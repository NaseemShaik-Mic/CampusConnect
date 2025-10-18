import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { leaveAPI } from "../services/api";
import {
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  FileText,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Particles from "../components/Particles"; // ✅ adjust the import path if needed

const Leaves = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    leaveType: "casual",
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await leaveAPI.getAll();
      setLeaves(response.data.leaveRequests);
    } catch (error) {
      toast.error("Error fetching leave requests");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeave = async (e) => {
    e.preventDefault();
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, val]) =>
        formDataToSend.append(key, val)
      );
      await leaveAPI.create(formDataToSend);
      toast.success("Leave request submitted");
      setShowCreateModal(false);
      setFormData({ startDate: "", endDate: "", reason: "", leaveType: "casual" });
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating leave request");
    }
  };

  const handleReviewLeave = async (status, comments) => {
    try {
      await leaveAPI.updateStatus(selectedLeave._id, { status, comments });
      toast.success(`Leave ${status}`);
      setShowReviewModal(false);
      setSelectedLeave(null);
      fetchLeaves();
    } catch (error) {
      toast.error("Error updating leave request");
    }
  };

  const handleDeleteLeave = async (id) => {
    if (window.confirm("Delete this leave request?")) {
      try {
        await leaveAPI.delete(id);
        toast.success("Deleted successfully");
        fetchLeaves();
      } catch {
        toast.error("Error deleting request");
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: Clock, color: "amber", label: "Pending" },
      approved: { icon: CheckCircle, color: "emerald", label: "Approved" },
      rejected: { icon: XCircle, color: "rose", label: "Rejected" },
    };
    const { icon: Icon, color, label } = badges[status] || badges.pending;
    return (
      <span
        className={`flex items-center gap-2 px-3 py-1 bg-${color}-100 text-${color}-700 font-medium rounded-full text-sm`}
      >
        <Icon className="w-4 h-4" /> {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 relative">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <Particles
            particleColors={["#ffffff", "#ffffff"]}
            particleCount={200}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={100}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
          />
        </div>
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ✅ Particles Background */}
      <div className="absolute inset-0 -z-10">
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      <motion.div
        className="space-y-8 p-6 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Leave Requests</h1>
            <p className="text-blue-500 mt-1">
              Track and manage your leaves easily
            </p>
          </div>
          {user.role === "student" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition shadow-md flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" /> Request Leave
            </button>
          )}
        </div>
<br />
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-25">
          {[
            {
              title: "Total Requests",
              value: leaves.length,
              icon: FileText,
              color: "indigo",
            },
            {
              title: "Approved",
              value: leaves.filter((l) => l.status === "approved").length,
              icon: CheckCircle,
              color: "emerald",
            },
            {
              title: "Pending",
              value: leaves.filter((l) => l.status === "pending").length,
              icon: Clock,
              color: "amber",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.03 }}
              className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="text-gray-600 text-sm">{stat.title}</p>
                <p className={`text-3xl font-bold text-${stat.color}-600 mt-2`}>
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`w-12 h-12 text-${stat.color}-500`} />
            </motion.div>
          ))}
        </div>
        <div className="grid gap-6 mt-8"><br /></div>
       {/* Leave Cards */}
        <div className="grid gap-6 mt-8">
          {leaves.length > 0 ? (
            leaves.map((leave) => (
              <motion.div
                key={leave._id}
                whileHover={{ scale: 1.02 }}
                className="bg-white/80 backdrop-blur-lg border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-semibold capitalize text-indigo-700">
                      {leave.leaveType} Leave
                    </h3>
                    {user.role !== "student" && (
                      <p className="text-gray-500 text-sm">
                        {leave.student?.name} ({leave.student?.studentId})
                      </p>
                    )}
                  </div>
                  {getStatusBadge(leave.status)}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4 text-gray-600">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <strong>From:</strong>{" "}
                    {new Date(leave.startDate).toLocaleDateString()}
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <strong>To:</strong>{" "}
                    {new Date(leave.endDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">Reason:</p>
                  <p className="text-gray-600">{leave.reason}</p>
                </div>

                {leave.comments && (
                  <div className="bg-gray-50 rounded-xl p-3 mt-4 text-sm">
                    <p className="font-semibold text-gray-700">Comments:</p>
                    <p>{leave.comments}</p>
                  </div>
                )}

                <div className="flex gap-3 mt-5">
                  {(user.role === "faculty" || user.role === "admin") &&
                    leave.status === "pending" && (
                      <button
                        onClick={() => {
                          setSelectedLeave(leave);
                          setShowReviewModal(true);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm shadow-sm"
                      >
                        Review
                      </button>
                    )}

                  {user.role === "student" && leave.status === "pending" && (
                    <button
                      onClick={() => handleDeleteLeave(leave._id)}
                      className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition text-sm shadow-sm"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 bg-white/80 rounded-2xl shadow">
              <FileText className="w-14 h-14 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No leave requests found</p>
            </div>
          )}
        </div>

        {/* Create Leave Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg"
            >
              <h3 className="text-2xl font-bold text-center text-indigo-600 mb-6">
                Request Leave
              </h3>
              <form onSubmit={handleCreateLeave} className="space-y-4">
                <select
                  value={formData.leaveType}
                  onChange={(e) =>
                    setFormData({ ...formData, leaveType: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="casual">Casual</option>
                  <option value="sick">Sick</option>
                  <option value="emergency">Emergency</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-400"
                />
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  rows="4"
                  placeholder="Reason for leave..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-400"
                ></textarea>

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedLeave && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Review Leave
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                <strong>Student:</strong> {selectedLeave.student?.name}
              </p>
              <p className="text-gray-600 text-sm mb-2">
                <strong>Period:</strong>{" "}
                {new Date(selectedLeave.startDate).toLocaleDateString()} -{" "}
                {new Date(selectedLeave.endDate).toLocaleDateString()}
              </p>
              <p className="text-gray-600 text-sm mb-4">
                <strong>Reason:</strong> {selectedLeave.reason}
              </p>
              <textarea
                id="reviewComments"
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-400"
                rows="3"
                placeholder="Comments (optional)"
              ></textarea>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() =>
                    handleReviewLeave(
                      "approved",
                      document.getElementById("reviewComments").value
                    )
                  }
                  className="flex-1 bg-emerald-500 text-white py-2 rounded-xl hover:bg-emerald-600"
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    handleReviewLeave(
                      "rejected",
                      document.getElementById("reviewComments").value
                    )
                  }
                  className="flex-1 bg-rose-500 text-white py-2 rounded-xl hover:bg-rose-600"
                >
                  Reject
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Leaves;

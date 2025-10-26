import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { mentoringAPI } from '../services/api';
import { Users, Calendar, Clock, Video, MapPin, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Balatro from '../components/Balatro';

const Mentoring = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topic: '',
    scheduledDate: '',
    duration: 60,
    meetingLink: '',
    location: '',
    students: []
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await mentoringAPI.getAll();
      setSessions(response.data.sessions);
    } catch (error) {
      toast.error('Error fetching mentoring sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await mentoringAPI.create(formData);
      toast.success('Mentoring session created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchSessions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating session');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      topic: '',
      scheduledDate: '',
      duration: 60,
      meetingLink: '',
      location: '',
      students: []
    });
  };

  const handleCancelSession = async (id) => {
    if (window.confirm('Cancel this session?')) {
      try {
        await mentoringAPI.cancel(id);
        toast.success('Session cancelled');
        fetchSessions();
      } catch {
        toast.error('Error cancelling session');
      }
    }
  };

  const getStatus = (session) => {
    if (session.status === 'cancelled')
      return { text: 'Cancelled', color: 'bg-red-100 text-red-600' };
    if (session.status === 'completed')
      return { text: 'Completed', color: 'bg-green-100 text-green-600' };
    const now = new Date();
    const date = new Date(session.scheduledDate);
    return date < now
      ? { text: 'Expired', color: 'bg-gray-100 text-gray-600' }
      : { text: 'Scheduled', color: 'bg-blue-100 text-blue-600' };
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-[70vh] animate-pulse">
        <div className="h-14 w-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <motion.div
      className="min-h-screen bg-gray-50 px-4 py-10 flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >

      {/* Header */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
            Mentoring Sessions
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Schedule and manage your valuable mentoring opportunities
          </p>
        </div>
        {user.role === 'faculty' && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-700 to-blue-500 text-white font-semibold rounded-3xl px-7 py-3 shadow-lg text-base focus:ring-4 focus:ring-blue-300 hover:opacity-90 transition z-10"
          >
            <Plus className="w-5 h-5" />
            Schedule New Session
          </motion.button>
        )}
      </div>

      {/* Sessions Grid */}
      <motion.div
        layout
        className="grid w-full max-w-5xl sm:grid-cols-2 lg:grid-cols-3 gap-7 p-0"
      >
        {sessions.length > 0 ? (
          sessions.map((session, index) => {
            const status = getStatus(session);
            return (
              <motion.div
                key={session._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-200 p-6 flex flex-col justify-between min-h-[320px]"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">{session.title}</h3>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-700`}>
                      {status.text}
                    </span>
                  </div>
                  <p className="text-gray-700 text-base mb-6 leading-relaxed">{session.description}</p>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-3 text-blue-500" />
                      {new Date(session.scheduledDate).toLocaleString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-3 text-blue-500" />
                      {session.duration} minutes
                    </div>
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-3 text-blue-500" />
                      Faculty: {session.faculty?.name}
                    </div>
                    {session.location && (
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 mr-3 text-blue-500" />
                        {session.location}
                      </div>
                    )}
                    {session.meetingLink && (
                      <a
                        href={session.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Video className="w-5 h-5 mr-3" /> Join Meeting
                      </a>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-between items-center">
                  {user.role === 'faculty' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCancelSession(session._id)}
                      className="text-sm bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm transition"
                    >
                      Cancel
                    </motion.button>
                  )}
                  <span className="text-sm text-gray-600 font-medium">
                    {session.attendees?.filter((a) => a.attended).length || 0}/{session.students?.length || 0} attended
                  </span>
                </div>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            className="col-span-full text-center text-gray-600 py-14 bg-white rounded-2xl shadow-sm border border-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-semibold text-gray-800 mb-2">No mentoring sessions yet</p>
            <p className="text-gray-600">Create your first session to get started</p>
          </motion.div>
        )}
      </motion.div>

      {/* Create Session Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center px-2 py-8 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.28 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-xl relative"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-7 text-center">
                Schedule New Mentoring Session
              </h3>
              <form onSubmit={handleCreateSession} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400"
                    required
                    placeholder="e.g., Career Guidance Session"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={e => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400"
                    required
                    placeholder="Main discussion topic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400"
                    rows="2"
                    placeholder="Brief description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledDate}
                      onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400"
                      min="15"
                      step="15"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                  <input
                    type="url"
                    value={formData.meetingLink}
                    onChange={e => setFormData({ ...formData, meetingLink: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400"
                    placeholder="https://meet.google.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400"
                    placeholder="Room 301, Main Building"
                  />
                </div>
                <div className="flex gap-4 pt-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-7 py-3 shadow-sm text-base focus:ring-4 focus:ring-blue-200 transition"
                  >
                    Create Session
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 rounded-xl px-7 py-3 shadow-sm hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Mentoring;

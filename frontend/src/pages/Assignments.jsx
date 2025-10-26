import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Loader2,
  FileUp,
  BookOpen,
  X,
  GraduationCap
} from 'lucide-react';

export default function AssignmentPortal() {
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionsForAssignment, setSubmissionsForAssignment] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [userRole, setUserRole] = useState('student');
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch current user from backend
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please login.');
          setLoading(false);
          return;
        }
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch user');
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          setUserRole(data.user.role);
        } else {
          setError(data.message || 'Failed to fetch user');
        }
      } catch (e) {
        setError(e.message);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/assignments`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      
      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching assignments:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData(e.target);
    const newAssignment = {
      title: formData.get('title'),
      description: formData.get('description'),
      subject: formData.get('subject'),
      department: formData.get('department') || user?.department,
      semester: parseInt(formData.get('semester')) || user?.semester,
      dueDate: formData.get('dueDate'),
      maxMarks: parseInt(formData.get('maxMarks')) || 100
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newAssignment)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create assignment');
      }

      setShowCreateModal(false);
      e.target.reset();
      fetchAssignments();
    } catch (err) {
      setError(err.message);
      console.error('Error creating assignment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!uploadedFile) {
      setError('Please select a file');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/assignments/${selectedAssignment._id}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Submission failed');
      }

      setShowSubmitModal(false);
      setUploadedFile(null);
      fetchAssignments();
    } catch (err) {
      setError(err.message);
      console.error('Error submitting assignment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    const gradeValue = e.target.grade.value;
    const feedbackValue = e.target.feedback.value;

    if (!gradeValue) {
      setError('Please select a grade');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/assignments/${selectedAssignment._id}/grade/${selectedSubmission._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ grade: gradeValue, feedback: feedbackValue })
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Grading failed');
      }

      setShowGradeModal(false);
      fetchAssignments();
    } catch (err) {
      setError(err.message);
      console.error('Error grading submission:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-500/20 text-amber-400 border border-amber-600/50',
      submitted: 'bg-blue-500/20 text-blue-400 border border-blue-600/50',
      graded: 'bg-green-500/20 text-green-400 border border-green-600/50',
      overdue: 'bg-red-500/20 text-red-400 border border-red-600/50'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={16} />,
      submitted: <CheckCircle size={16} />,
      graded: <CheckCircle size={16} />,
      overdue: <AlertCircle size={16} />
    };
    return icons[status] || icons.pending;
  };

  const filteredAssignments = selectedTab === 'all'
    ? assignments
    : assignments.filter((a) => a.status === selectedTab);

  const isFaculty = userRole === 'faculty' || userRole === 'admin';
  const tabs = ['all', 'pending', 'submitted', 'graded', 'overdue'];

  const tabCounts = {
    all: assignments.length,
    pending: assignments.filter((a) => a.status === 'pending').length,
    submitted: assignments.filter((a) => a.status === 'submitted').length,
    graded: assignments.filter((a) => a.status === 'graded').length,
    overdue: assignments.filter((a) => a.status === 'overdue').length
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">📋</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assignment Central</h1>
              <p className="text-xs text-gray-500">Academic Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-2">
              <span className={`px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700`}>Role: {userRole}</span>
            </div>

            <div className="h-6 w-px bg-gray-200 hidden md:block" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.department} - Sem {user.semester}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

      {/* View Submissions Modal */}
      {showSubmissionsModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-2xl w-full p-8 shadow-xl max-h-[80vh] overflow-y-auto text-gray-900">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4">
              <h3 className="text-2xl font-bold">Submissions</h3>
              <button
                onClick={() => {
                  setShowSubmissionsModal(false);
                  setSubmissionsForAssignment([]);
                }}
                className="text-gray-500 hover:text-gray-900 transition p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {submissionsForAssignment.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No submissions yet</p>
              ) : (
                submissionsForAssignment.map((submission) => (
                  <div key={submission._id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{submission.student?.name || submission.studentName}</p>
                        <p className="text-xs text-gray-500">
                          Submitted: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <span
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(
                          submission.status
                        )}`}
                      >
                        {getStatusIcon(submission.status)}
                        {submission.status?.charAt(0).toUpperCase()}
                        {submission.status?.slice(1)}
                      </span>
                    </div>

                    {submission.status === 'graded' && (
                      <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 font-semibold">
                          Grade: {submission.grade}
                        </p>
                        {submission.feedback && (
                          <p className="text-xs text-green-700 mt-1">{submission.feedback}</p>
                        )}
                      </div>
                    )}

                    {submission.status === 'submitted' && (
                      <button
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setShowGradeModal(true);
                          setShowSubmissionsModal(false);
                        }}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-sm transition text-white"
                      >
                        Grade This Submission
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

        {/* Header: Title + Actions */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-4xl font-bold mb-2">
              {userRole === 'student' ? 'My Assignments' : 'Grading Dashboard'}
            </h2>
            <p className="text-gray-600">
              {userRole === 'student'
                ? 'Track and manage your academic assignments efficiently.'
                : 'Review and grade student submissions'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="min-w-[180px]">
              <label className="block text-xs text-gray-500 mb-1">Filter</label>
              <select
                value={selectedTab}
                onChange={(e) => setSelectedTab(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {tabs.map((tab) => (
                  <option key={tab} value={tab} className="capitalize">
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tabCounts[tab]})
                  </option>
                ))}
              </select>
            </div>
            {isFaculty && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition shadow-sm"
              >
                Create Assignment
              </button>
            )}
          </div>
        </div>

        {/* Assignments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="flex flex-col justify-center items-center py-32">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <p className="text-gray-600">Loading assignments...</p>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
                <BookOpen size={56} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 text-lg font-medium">No assignments yet</p>
                <p className="text-gray-500 text-sm mt-2">
                  New assignments will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="group bg-white border border-gray-200 rounded-2xl p-8 min-h-[320px] hover:border-blue-300 hover:shadow-md transition flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl group-hover:text-blue-700 transition line-clamp-2">
                          {assignment.title}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1.5 font-medium">
                          {assignment.subject}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${getStatusColor(
                          assignment.status
                        )}`}
                      >
                        {getStatusIcon(assignment.status)}
                        {assignment.status?.charAt(0).toUpperCase()}
                        {assignment.status?.slice(1)}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed flex-grow">
                      {assignment.description}
                    </p>

                    <div className="flex items-center justify-between text-sm mb-7 pb-6 border-b border-gray-200">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={14} className="text-blue-600" />
                        <span>
                          Due{' '}
                          {new Date(assignment.dueDate).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric', year: 'numeric' }
                          )}
                        </span>
                      </div>
                      <span className="text-gray-900 font-bold text-base">
                        {assignment.maxMarks} pts
                      </span>
                    </div>

                    {userRole === 'student' ? (
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowSubmitModal(true);
                        }}
                        disabled={assignment.status === 'submitted' || assignment.status === 'graded'}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-semibold transition ${
                          assignment.status === 'submitted' || assignment.status === 'graded'
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <FileUp size={18} />
                        {assignment.status === 'submitted'
                          ? 'Already Submitted'
                          : assignment.status === 'graded'
                          ? 'Graded'
                          : 'Submit Assignment'}
                      </button>
                    ) : (
                      <button
                        onClick={() => openSubmissions(assignment)}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white transition"
                      >
                        View Submissions ({assignment.submissionCount || 0})
                      </button>
                    )}

                    {userRole === 'student' && assignment.status === 'graded' && assignment.submissions && assignment.submissions.length > 0 && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-600/30 rounded-xl">
                        <p className="text-sm text-green-400 font-bold">
                          ✓ Grade: {assignment.submissions[0].grade}
                        </p>
                        {assignment.submissions[0].feedback && (
                          <p className="text-xs text-green-300 mt-2 leading-relaxed">
                            {assignment.submissions[0].feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
      </main>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-8 shadow-xl text-gray-900">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Create Assignment</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-900 transition p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                  placeholder="Assignment title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  required
                  rows="3"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-900 resize-none placeholder-gray-400"
                  placeholder="Assignment description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                  placeholder="Subject name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    defaultValue={user?.department || ''}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                    placeholder="e.g., Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="semester"
                    defaultValue={user?.semester || ''}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                    placeholder="e.g., 5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    name="maxMarks"
                    defaultValue="100"
                    min="1"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-900"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Assignment Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-8 shadow-xl text-gray-900">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Submit Assignment</h3>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setUploadedFile(null);
                }}
                className="text-gray-500 hover:text-gray-900 transition p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 font-semibold mb-2">
                  {selectedAssignment.title}
                </p>
                <p className="text-xs text-gray-500">
                  Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload File
                </label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-blue-500 transition cursor-pointer bg-gray-50">
                  <input
                    type="file"
                    required
                    onChange={(e) => setUploadedFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FileUp size={36} className="mx-auto text-blue-600 mb-2" />
                  <p className="text-sm text-gray-700 font-medium">
                    {uploadedFile
                      ? uploadedFile.name
                      : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, TXT (Max 10MB)
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitModal(false);
                    setUploadedFile(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !uploadedFile}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Submission Modal */}
      {showGradeModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-8 shadow-xl text-gray-900">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Grade Submission</h3>
              <button
                onClick={() => {
                  setShowGradeModal(false);
                  setSelectedSubmission(null);
                }}
                className="text-gray-500 hover:text-gray-900 transition p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGradeSubmission} className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 font-semibold mb-2">
                  {selectedAssignment.title}
                </p>
                <p className="text-xs text-gray-500">
                  Submissions: {selectedAssignment.submissionCount || 0}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade
                </label>
                <select
                  name="grade"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-900"
                >
                  <option value="">Select a grade</option>
                  <option value="A+">A+ (90-100)</option>
                  <option value="A">A (80-89)</option>
                  <option value="B+">B+ (70-79)</option>
                  <option value="B">B (60-69)</option>
                  <option value="C+">C+ (50-59)</option>
                  <option value="C">C (40-49)</option>
                  <option value="D">D (30-39)</option>
                  <option value="F">F (Below 30)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback
                </label>
                <textarea
                  name="feedback"
                  rows="3"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-900 resize-none placeholder-gray-400"
                  placeholder="Add feedback for the student"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowGradeModal(false);
                    setSelectedSubmission(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? 'Grading...' : 'Submit Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
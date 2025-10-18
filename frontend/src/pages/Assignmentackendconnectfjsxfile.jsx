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
  LogOut,
  Eye,
  EyeOff
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
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Initialize - Get user ID from URL or session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('userId');
    
    if (id) {
      setUserId(id);
      fetchUserData(id);
    } else {
      setError('No user ID provided');
      setLoading(false);
    }
  }, []);

  // Fetch user details from backend
  const fetchUserData = async (uid) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/users/${uid}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      setUser(data.user);
      
      // Fetch assignments based on user role
      if (data.user.role === 'student') {
        fetchStudentAssignments(uid);
      } else if (data.user.role === 'faculty' || data.user.role === 'admin') {
        fetchFacultyAssignments(uid);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching user data:', err);
      setLoading(false);
    }
  };

  // Fetch assignments for student
  const fetchStudentAssignments = async (uid) => {
    try {
      const response = await fetch(`${API_URL}/assignments/student/${uid}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      
      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching student assignments:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch assignments for faculty
  const fetchFacultyAssignments = async (uid) => {
    try {
      const response = await fetch(`${API_URL}/assignments/faculty/${uid}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      
      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching faculty assignments:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Create assignment (Faculty only)
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData(e.target);
    const newAssignment = {
      title: formData.get('title'),
      description: formData.get('description'),
      subject: formData.get('subject'),
      dueDate: formData.get('dueDate'),
      maxMarks: parseInt(formData.get('maxMarks')) || 100,
      createdBy: userId
    };

    try {
      const response = await fetch(`${API_URL}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAssignment)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create assignment');
      }

      setShowCreateModal(false);
      e.target.reset();
      fetchFacultyAssignments(userId);
    } catch (err) {
      setError(err.message);
      console.error('Error creating assignment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit assignment (Student only)
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
    formData.append('studentId', userId);

    try {
      const response = await fetch(`${API_URL}/assignments/${selectedAssignment._id}/submit`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Submission failed');
      }

      setShowSubmitModal(false);
      setUploadedFile(null);
      fetchStudentAssignments(userId);
    } catch (err) {
      setError(err.message);
      console.error('Error submitting assignment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch submissions for an assignment (Faculty only)
  const fetchSubmissionsForAssignment = async (assignmentId) => {
    try {
      const response = await fetch(`${API_URL}/assignments/${assignmentId}/submissions`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      
      const data = await response.json();
      setSubmissionsForAssignment(data.submissions || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching submissions:', err);
      setSubmissionsForAssignment([]);
    }
  };

  // Grade submission (Faculty only)
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
      const response = await fetch(
        `${API_URL}/assignments/${selectedAssignment._id}/submissions/${selectedSubmission._id}/grade`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ grade: gradeValue, feedback: feedbackValue })
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Grading failed');
      }

      setShowGradeModal(false);
      fetchSubmissionsForAssignment(selectedAssignment._id);
      fetchFacultyAssignments(userId);
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

  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';

  const tabs = ['all', 'pending', 'submitted', 'graded', 'overdue'];

  const tabCounts = {
    all: assignments.length,
    pending: assignments.filter((a) => a.status === 'pending').length,
    submitted: assignments.filter((a) => a.status === 'submitted').length,
    graded: assignments.filter((a) => a.status === 'graded').length,
    overdue: assignments.filter((a) => a.status === 'overdue').length
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <p className="text-gray-400">Loading your data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-semibold mb-4">Error Loading User</p>
          <p className="text-gray-400">{error || 'User not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="bg-slate-900/40 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/50">
              📋
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Assignment Central
              </h1>
              <p className="text-xs text-gray-400">Academic Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-gray-400 capitalize">
                  {isStudent ? 'Student' : 'Faculty'} • {user.department}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center font-bold text-slate-900">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-600/50 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Dashboard Title */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-4xl font-bold mb-2">
              {isStudent ? '📚 My Assignments' : '📊 Grading Dashboard'}
            </h2>
            <p className="text-gray-400">
              {isStudent
                ? 'Track and manage your academic assignments efficiently.'
                : 'Review and grade student submissions'}
            </p>
          </div>

          {isFaculty && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl font-semibold transition shadow-lg hover:shadow-blue-500/50 transform hover:scale-105"
            >
              <Plus size={20} /> Create Assignment
            </button>
          )}
        </div>

        {/* Categories Sidebar + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 sticky top-24 shadow-xl">
              <h3 className="text-sm font-semibold text-gray-300 mb-4 px-2 uppercase tracking-wide">
                Filter
              </h3>
              <div className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition transform ${
                      selectedTab === tab
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                        : 'bg-slate-800/50 text-gray-300 hover:bg-slate-800/80 hover:translate-x-1'
                    }`}
                  >
                    <span className="flex-shrink-0">
                      {tab === 'pending' && <Clock size={16} />}
                      {tab === 'submitted' && <CheckCircle size={16} />}
                      {tab === 'graded' && <CheckCircle size={16} />}
                      {tab === 'overdue' && <AlertCircle size={16} />}
                      {tab === 'all' && <BookOpen size={16} />}
                    </span>
                    <span className="capitalize flex-1 text-left">{tab}</span>
                    <span className="text-xs bg-slate-700/50 px-2 py-1 rounded-lg font-semibold">
                      {tabCounts[tab]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assignments Grid */}
          <div className="lg:col-span-4">
            {filteredAssignments.length === 0 ? (
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-16 text-center">
                <BookOpen size={56} className="text-gray-500/50 mx-auto mb-4" />
                <p className="text-gray-400 text-lg font-medium">No assignments yet</p>
                <p className="text-gray-500 text-sm mt-2">
                  New assignments will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAssignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="group bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 transition duration-300 transform hover:scale-[1.02] flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg group-hover:text-blue-400 transition line-clamp-2">
                          {assignment.title}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1.5 font-medium">
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

                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed flex-grow">
                      {assignment.description}
                    </p>

                    <div className="flex items-center justify-between text-sm mb-6 pb-6 border-b border-slate-700/50">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock size={14} className="text-blue-400" />
                        <span>
                          Due:{' '}
                          {new Date(assignment.dueDate).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric' }
                          )}
                        </span>
                      </div>
                      <span className="text-gray-300 font-bold text-base">
                        {assignment.maxMarks} pts
                      </span>
                    </div>

                    {isStudent ? (
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowSubmitModal(true);
                        }}
                        disabled={assignment.status === 'submitted' || assignment.status === 'graded'}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition transform ${
                          assignment.status === 'submitted' || assignment.status === 'graded'
                            ? 'bg-slate-800/50 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 active:scale-95'
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
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          fetchSubmissionsForAssignment(assignment._id);
                          setShowSubmissionsModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition hover:shadow-lg hover:shadow-purple-500/30 transform hover:scale-105 active:scale-95"
                      >
                        📊 View Submissions ({assignment.submissionCount || 0})
                      </button>
                    )}

                    {isStudent && assignment.status === 'graded' && assignment.submissions && assignment.submissions.length > 0 && (
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
        </div>
      </main>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Create Assignment</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition p-1 hover:bg-slate-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition text-white placeholder-gray-500"
                  placeholder="Assignment title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  required
                  rows="3"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition text-white resize-none placeholder-gray-500"
                  placeholder="Assignment description"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition text-white placeholder-gray-500"
                  placeholder="Subject name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    required
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    name="maxMarks"
                    defaultValue="100"
                    min="1"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition text-white"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Submit Assignment</h3>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setUploadedFile(null);
                }}
                className="text-gray-400 hover:text-white transition p-1 hover:bg-slate-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-sm text-gray-300 font-semibold mb-2">
                  {selectedAssignment.title}
                </p>
                <p className="text-xs text-gray-400">
                  Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Upload File
                </label>
                <div className="relative border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-blue-500 transition cursor-pointer bg-slate-800/30">
                  <input
                    type="file"
                    required
                    onChange={(e) => setUploadedFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FileUp size={36} className="mx-auto text-blue-400 mb-2" />
                  <p className="text-sm text-gray-300 font-medium">
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

      {/* View Submissions Modal */}
      {showSubmissionsModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-gradient-to-br from-slate-800 to-slate-900 pb-4">
              <h3 className="text-2xl font-bold">Submissions</h3>
              <button
                onClick={() => {
                  setShowSubmissionsModal(false);
                  setSubmissionsForAssignment([]);
                }}
                className="text-gray-400 hover:text-white transition p-1 hover:bg-slate-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {submissionsForAssignment.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No submissions yet</p>
              ) : (
                submissionsForAssignment.map((submission) => (
                  <div key={submission._id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-white">{submission.studentName}</p>
                        <p className="text-xs text-gray-400">
                          Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
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
                      <div className="mb-3 p-3 bg-green-500/10 border border-green-600/30 rounded-lg">
                        <p className="text-sm text-green-400 font-bold">
                          Grade: {submission.grade}
                        </p>
                        {submission.feedback && (
                          <p className="text-xs text-green-300 mt-1">{submission.feedback}</p>
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
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-sm transition"
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

      {/* Grade Submission Modal */}
      {showGradeModal && selectedAssignment && selectedSubmission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Grade Submission</h3>
              <button
                onClick={() => {
                  setShowGradeModal(false);
                  setSelectedSubmission(null);
                }}
                className="text-gray-400 hover:text-white transition p-1 hover:bg-slate-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGradeSubmission} className="space-y-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-sm text-gray-300 font-semibold mb-2">
                  {selectedAssignment.title}
                </p>
                <p className="text-xs text-gray-400 mb-2">
                  {selectedSubmission.studentName}
                </p>
                <p className="text-xs text-gray-500">
                  Submitted: {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Grade
                </label>
                <select
                  name="grade"
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition text-white"
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
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Feedback
                </label>
                <textarea
                  name="feedback"
                  rows="3"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition text-white resize-none placeholder-gray-500"
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
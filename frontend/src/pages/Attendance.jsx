import React, { useState, useEffect } from 'react';
import { Calendar, Search, ChevronLeft, ChevronRight, User, CheckCircle, XCircle, Bell } from 'lucide-react';
import Iridescence from '../components/Iridescence';

const API_BASE_URL = 'http://localhost:5000/api';

const Attendance = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceMarked, setAttendanceMarked] = useState({});
  const [stats, setStats] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    faculty: '',
    program: '',
    section: 'All',
    session: '',
    course: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    faculties: [],
    programs: [],
    sections: ['All', 'A', 'B', 'C'],
    sessions: [],
    courses: []
  });

  // Fetch current user
  useEffect(() => { fetchCurrentUser(); }, []);
  useEffect(() => { if (user) user.role === 'student' ? fetchStudentData() : fetchDynamicFilterOptions(); }, [user]);
  useEffect(() => { if (user && user.role !== 'student' && filters.course) fetchStudentsForAttendance(); }, [filters]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setError('No authentication token found. Please login.'); setLoading(false); return; }
      const response = await fetch(`${API_BASE_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch user data');
      const data = await response.json();
      if (data.success) setUser(data.user); else setError(data.message || 'Failed to fetch user data');
      setLoading(false);
    } catch (err) { console.error(err); setError(err.message); setLoading(false); }
  };

  const fetchDynamicFilterOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const usersResponse = await fetch(`${API_BASE_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!usersResponse.ok) throw new Error('Failed to fetch users');
      const usersData = await usersResponse.json();
      const allUsers = usersData.users || usersData.data || [];

      const faculties = [...new Set(allUsers.filter(u => u.department).map(u => u.department))].filter(Boolean);
      const programs = [...new Set(allUsers.filter(u => u.department).map(u => u.department))].filter(Boolean);
      const semesters = [...new Set(allUsers.filter(u => u.semester).map(u => `Semester ${u.semester}`))].filter(Boolean).sort();
      const courses = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English'];

      setFilterOptions({
        faculties: faculties.length > 0 ? faculties : ['Computer Science', 'Electronics', 'Mechanical'],
        programs: programs.length > 0 ? programs : ['Computer Science', 'Electronics', 'Mechanical'],
        sections: ['All', 'A', 'B', 'C'],
        sessions: semesters.length > 0 ? semesters : ['2024-2025', '2025-2026'],
        courses
      });

      if (faculties.length > 0) setFilters(prev => ({ ...prev, faculty: faculties[0], program: programs[0] || '', session: semesters[0] || '', course: courses[0] || '' }));
    } catch (err) {
      console.error(err);
      setFilterOptions({
        faculties: ['Computer Science', 'Electronics', 'Mechanical'],
        programs: ['Computer Science', 'Electronics', 'Mechanical'],
        sections: ['All', 'A', 'B', 'C'],
        sessions: ['2024-2025', '2025-2026'],
        courses: ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English']
      });
    }
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/attendance`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch attendance data');
      const data = await response.json();
      if (data.success) setStudentAttendance(data.attendance || []);

      const statsResponse = await fetch(`${API_BASE_URL}/attendance/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsResponse.json();
      if (statsData.success) setStats(statsData.stats);

      setLoading(false);
    } catch (err) { console.error(err); setError(err.message); setLoading(false); }
  };

  const fetchStudentsForAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE_URL}/students?${queryParams}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      if (data.success) { setStudents(data.students || []); await fetchTodayAttendance(); }
      setLoading(false);
    } catch (err) { console.error(err); setError(err.message); setStudents([]); setLoading(false); }
  };

  const fetchTodayAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const dateStr = currentDate.toISOString().split('T')[0];
      const response = await fetch(`${API_BASE_URL}/attendance/date/${dateStr}?course=${filters.course}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.attendance) {
          const marked = {};
          data.attendance.forEach(record => { marked[record.student._id || record.student] = record.status; });
          setAttendanceMarked(marked);
        }
      }
    } catch (err) { console.error(err); }
  };

  const toggleAttendance = (studentId, status) => { setAttendanceMarked(prev => ({ ...prev, [studentId]: prev[studentId] === status ? null : status })); };

  const saveAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const records = Object.entries(attendanceMarked).filter(([_, status]) => status !== null).map(([studentId, status]) => ({ student: studentId, status }));
      if (!records.length) { alert('Please mark attendance for at least one student'); return; }
      const response = await fetch(`${API_BASE_URL}/attendance`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ date: currentDate.toISOString().split('T')[0], ...filters, records })
      });
      const data = await response.json();
      if (data.success) { alert('Attendance saved successfully!'); await fetchTodayAttendance(); }
      else alert(data.message || 'Failed to save attendance');
    } catch (err) { console.error(err); alert(`Error: ${err.message}`); }
  };

  const getTodayStats = () => {
    const total = students.length;
    const present = Object.values(attendanceMarked).filter(s => s === 'present').length;
    const absent = Object.values(attendanceMarked).filter(s => s === 'absent').length;
    return { total, present, absent };
  };
  const todayStats = getTodayStats();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekDays.forEach(day => days.push(<div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">{day}</div>));
    for (let i = 0; i < startingDayOfWeek; i++) days.push(<div key={`empty-${i}`} className="p-2"></div>);
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === today.toDateString();
      const attendance = studentAttendance.find(a => a.date.split('T')[0] === dateStr);
      let bgColor = 'bg-white border-gray-200';
      if (isToday) bgColor = 'bg-green-500 text-white border-green-500';
      else if (attendance?.status === 'present') bgColor = 'bg-green-100 border-green-300';
      else if (attendance?.status === 'absent') bgColor = 'bg-red-100 border-red-300';
      days.push(<div key={day} className={`border rounded-lg p-2 text-center ${bgColor} ${isToday ? 'font-bold' : ''}`}>{day}</div>);
    }
    return days;
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="flex items-center justify-center h-screen bg-gray-50"><div className="bg-white p-8 rounded-lg shadow-lg max-w-md"><div className="text-red-600 text-xl font-bold mb-4">Error</div><p className="text-gray-700 mb-4">{error}</p><button onClick={() => window.location.href = '/login'} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Go to Login</button></div></div>;
  if (!user) return null;

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 -z-10">
        <Iridescence color={[1, 1, 1]} mouseReact={false} amplitude={0.1} speed={1.0} />
      </div>
<br />
      {/* Student View */}
      {user.role === 'student' ? (
       <div className="min-h-screen bg-transparent p-6">
  <div className="max-w-6xl mx-auto">
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-gray-600" />
        </div>
        <br />
        <div>
          <h1 className="text-xl font-bold text-gray-800">Student Attendance</h1>
          <p className="text-sm text-gray-600">{user.name}</p>
        </div>
      </div>
    </div>
<br />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">
              {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>
        </div>
<br />
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-bold mb-4">Subject-wise Attendance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Subject</th>
                  <th className="text-left py-2 px-4">Total Classes</th>
                  <th className="text-left py-2 px-4">Present</th>
                  <th className="text-left py-2 px-4">Absent</th>
                  <th className="text-left py-2 px-4">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {stats?.subjectWise?.map((subject, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{subject.subject}</td>
                    <td className="py-3 px-4">{subject.total}</td>
                    <td className="py-3 px-4 text-green-600 font-semibold">{subject.present}</td>
                    <td className="py-3 px-4 text-red-600 font-semibold">{subject.total - subject.present}</td>
                    <td className="py-3 px-4 font-semibold">{subject.percentage.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
<br />
      <div className="space-y-6">
        <div className="bg-yellow-100 rounded-lg p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <User className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{stats?.totalClasses || 0}</div>
            <div className="text-sm text-gray-600">Total Classes</div>
          </div>
        </div>
<br />
        <div className="bg-green-100 rounded-lg p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{stats?.presentCount || 0}</div>
            <div className="text-sm text-gray-600">Present</div>
          </div>
        </div>
<br />
        <div className="bg-red-100 rounded-lg p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{stats?.absentCount || 0}</div>
            <div className="text-sm text-gray-600">Absent</div>
          </div>
        </div>
<br />
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold mb-4">Recent Attendance</h3>
          <div className="space-y-3">
            {studentAttendance.slice(0, 5).map((att, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-semibold text-sm">{att.course || att.subject}</div>
                  <div className="text-xs text-gray-500">{new Date(att.date).toLocaleDateString()}</div>
                </div>
                <div className={`px-3 py-1 rounded text-xs font-semibold ${
                  att.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {att.status === 'present' ? 'Present' : 'Absent'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

      ) : (
        /* Faculty/Admin View */
       <div className="min-h-screen bg-transparent p-6">
  <div className="max-w-7xl mx-auto">
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for student"
            className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-600" />
          </div>
          <span className="font-semibold">{user.name}</span>
        </div> */}
      </div>
    </div>
<br />
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Faculty *</label>
              <select 
                className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                value={filters.faculty} 
                onChange={(e) => setFilters({...filters, faculty: e.target.value})}
              >
                <option value="">Select Faculty</option>
                {filterOptions.faculties.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Program *</label>
              <select 
                className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                value={filters.program} 
                onChange={(e) => setFilters({...filters, program: e.target.value})}
              >
                <option value="">Select Program</option>
                {filterOptions.programs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Section *</label>
              <select 
                className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                value={filters.section} 
                onChange={(e) => setFilters({...filters, section: e.target.value})}
              >
                {filterOptions.sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Session *</label>
              <select 
                className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                value={filters.session} 
                onChange={(e) => setFilters({...filters, session: e.target.value})}
              >
                <option value="">Select Session</option>
                {filterOptions.sessions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Course *</label>
              <select 
                className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                value={filters.course} 
                onChange={(e) => setFilters({...filters, course: e.target.value})}
              >
                <option value="">Select Course</option>
                {filterOptions.courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={fetchStudentsForAttendance}
                className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </div>
        </div>
              
        <div className="bg-white rounded-lg shadow-sm p-6">
          {students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <br />
              No students found. Please select filters and click Search.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Student ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Present</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Absent</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Late</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const marked = attendanceMarked[student._id || student.id];
                      return (
                        <tr key={student._id || student.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">{student.studentId}</td>
                          <td className="py-3 px-4">{student.name}</td>
                          <td className="text-center py-3 px-4">
                            <button
                              onClick={() => toggleAttendance(student._id || student.id, 'present')}
                              className={`w-8 h-8 rounded-full border-2 transition-colors ${
                                marked === 'present' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'
                              }`}
                            ></button>
                          </td>
                          <td className="text-center py-3 px-4">
                            <button
                              onClick={() => toggleAttendance(student._id || student.id, 'absent')}
                              className={`w-8 h-8 rounded-full border-2 transition-colors ${
                                marked === 'absent' ? 'bg-red-500 border-red-500' : 'border-gray-300 hover:border-red-400'
                              }`}
                            ></button>
                          </td>
                          <td className="text-center py-3 px-4">
                            <button
                              onClick={() => toggleAttendance(student._id || student.id, 'late')}
                              className={`w-8 h-8 rounded-full border-2 transition-colors ${
                                marked === 'late' ? 'bg-yellow-500 border-yellow-500' : 'border-gray-300 hover:border-yellow-400'
                              }`}
                            ></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {Object.keys(attendanceMarked).length > 0 && (
                <div className="mt-6 flex justify-end gap-4">
                  <button
                    onClick={() => setAttendanceMarked({})}
                    className="bg-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-400 font-semibold"
                  >
                    Clear
                  </button>
                  <button
                    onClick={saveAttendance}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Save Attendance
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-sm">
              {currentDate.toLocaleString('default', { month: 'short' })} {currentDate.getFullYear()}
            </h3>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="font-semibold text-gray-600 py-1">{day}</div>
            ))}
            {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }, (_, i) => (
              <div key={`empty-${i}`}></div>
            ))}
            {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }, (_, i) => {
              const day = i + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`py-1 ${isToday ? 'bg-green-500 text-white rounded-full' : ''}`}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>
<br />
        <div className="bg-yellow-100 rounded-lg p-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-3">
            <User className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800">{students.length}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        <br />

        <div className="bg-green-100 rounded-lg p-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800">{todayStats.present}</div>
          <div className="text-sm text-gray-600">Present Today</div>
        </div>
<br />
        <div className="bg-red-100 rounded-lg p-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-3">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800">{todayStats.absent}</div>
          <div className="text-sm text-gray-600">Absent Today</div>
        </div>
      </div>
    </div>
  </div>
</div>

      )}
    </div>
  );
};

export default Attendance;

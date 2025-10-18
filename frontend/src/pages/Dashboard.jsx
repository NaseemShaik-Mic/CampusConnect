import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Calendar,
  BookOpen,
  FileText,
  Users,
  TrendingUp,
  Clock,
} from 'lucide-react';
import './Dashboard.css'; // Ensure this has the updated CSS
import {
  assignmentAPI,
  attendanceAPI,
  leaveAPI,
  mentoringAPI,
  notificationAPI,
} from '../services/api';

// ---------- Stats Card Component ----------
const StatsCard = ({ card, onClick }) => (
  <div
    onClick={onClick}
    className={`card glow-on-hover fade-in ${card.color}-gradient`}
    style={{ '--card-color': card.colorLight, '--card-color-dark': card.colorDark }}
  >
    <div className="card-icon">{card.icon}</div>
    <div className="card-text">
      <p className="text-lg font-semibold text-white">{card.title}</p>
      <h3 className="text-2xl font-bold text-white shadow-text">{card.value}</h3>
      <span className="text-sm text-white opacity-80">{card.subtitle}</span>
    </div>
  </div>
);

// ---------- Sidebar Component ----------
const Sidebar = ({ onLogout }) => {
  const location = useLocation();
  const links = [
    { name: 'Dashboard', icon: <Calendar className="w-6 h-6" />, path: '/dashboard' },
    { name: 'Attendance', icon: <BookOpen className="w-6 h-6" />, path: '/attendance' },
    { name: 'Assignments', icon: <FileText className="w-6 h-6" />, path: '/assignments' },
    { name: 'Mentoring', icon: <Users className="w-6 h-6" />, path: '/mentoring' },
  ];

  return (
    <aside className="sidebar fade-in">
      <div className="sidebar-header">
        <div className="dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map((link, index) => (
          <Link
            key={index}
            to={link.path}
            className={`flex items-center p-3 rounded-lg transition-all ${location.pathname === link.path ? 'bg-gray-200' : ''} hover:from-blue-500 hover:to-purple-500 hover:text-white`} // Added colorful hover
          >
            {link.icon} <span className="ml-2">{link.name}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button
          onClick={onLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition-shadow glow-on-hover"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

// ---------- Recent Activity Component ----------
const RecentActivity = ({ notifications }) => (
  <div className="recent-activity-card fade-in">
    <h3 className="text-xl font-bold mb-4 flex items-center"><TrendingUp className="mr-2" /> Recent Notifications</h3>
    <ul className="space-y-2">
      {notifications.map((n, i) => (
        <li key={i} className="flex items-center p-3 bg-white bg-opacity-70 rounded-lg shadow-sm transition-transform hover:scale-105">
          <Clock className="w-5 h-5 mr-2 text-blue-500" /> <span>{n.message}</span>
        </li>
      ))}
    </ul>
  </div>
);

// ---------- Dashboard Component ----------
const Dashboard = () => {
const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    attendance: { overallPercentage: 0, totalClasses: 0, presentCount: 0, subjectWise: [] },
    assignments: { total: 0, submitted: 0, graded: 0 },
    leaves: { pending: 0, approved: 0 },
    mentoring: { upcoming: 0 },
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [
          attendanceRes,
          assignmentsRes,
          leavesRes,
          mentoringRes,
          notificationsRes
        ] = await Promise.all([
          attendanceAPI.getStats(),
          assignmentAPI.getAll(),
          leaveAPI.getAll(),
          mentoringAPI.getAll(),
          notificationAPI.getAll({ limit: 5 })
        ]);

        const attendanceStats = attendanceRes.data.stats;
        const assignments = assignmentsRes.data.assignments;
        const leaves = leavesRes.data.leaveRequests;
        const sessions = mentoringRes.data.sessions;
        const notifications = notificationsRes.data.notifications;

        setStats({
          attendance: attendanceStats || { overallPercentage: 0, totalClasses: 0, presentCount: 0, subjectWise: [] },
          assignments: {
            total: assignments.length,
            submitted: assignments.filter((a) => a.submissions?.some((s) => s.student === user.id)).length,
            graded: assignments.filter((a) => a.submissions?.some((s) => s.student === user.id && s.grade)).length,
          },
          leaves: {
            pending: leaves.filter((l) => l.status === 'pending').length,
            approved: leaves.filter((l) => l.status === 'approved').length,
          },
          mentoring: {
            upcoming: sessions.filter((s) => new Date(s.scheduledDate) > new Date() && s.status === 'scheduled').length,
          },
        });

        setRecentActivity(notifications);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.id]);

  const attendanceData = useMemo(() => {
    return stats.attendance.subjectWise.map((s) => ({
      subject: s.subject,
      percentage: parseFloat(s.percentage),
    }));
  }, [stats.attendance]);

  const cardConfigs = [
    {
      title: 'Overall Attendance',
      value: `${stats.attendance.overallPercentage}%`,
      subtitle: `${stats.attendance.presentCount}/${stats.attendance.totalClasses} classes`,
      icon: <Calendar className="w-10 h-10 text-white" />,
      colorLight: '#3b82f6',
      colorDark: '#1d4ed8',
      color: 'blue',
      route: '/attendance',
    },
    {
      title: 'Assignments',
      value: `${stats.assignments.submitted}/${stats.assignments.total}`,
      subtitle: `${stats.assignments.graded} graded`,
      icon: <BookOpen className="w-10 h-10 text-white" />,
      colorLight: '#10b981',
      colorDark: '#047857',
      color: 'green',
      route: '/assignments',
    },
    {
      title: 'Leave Requests',
      value: `${stats.leaves.pending}`,
      subtitle: `${stats.leaves.approved} approved`,
      icon: <FileText className="w-10 h-10 text-white" />,
      colorLight: '#f59e0b',
      colorDark: '#d97706',
      color: 'yellow',
      route: '/leaves',
    },
    {
      title: 'Upcoming Sessions',
      value: `${stats.mentoring.upcoming}`,
      subtitle: 'Mentoring sessions',
      icon: <Users className="w-10 h-10 text-white" />,
      colorLight: '#8b5cf6',
      colorDark: '#6b21a8',
      color: 'purple',
      route: '/mentoring',
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen fade-in">
        <div className="text-center">
          <div className="loading-spinner rounded-full h-16 w-16 border-4 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="dashboard-container bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen fade-in">
      <Sidebar onLogout={handleLogout} />

      <main className="main-content p-6">
        <header className="main-header mb-6">
          <div className="header-title">
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Welcome back, {user?.name}!
            </span>
          </div>
        </header>

        <section className="content-body">
          <div className="cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cardConfigs.map((card, index) => (
              <StatsCard key={index} card={card} onClick={() => navigate(card.route)} />
            ))}
          </div>

          {attendanceData.length > 0 && (
            <div className="chart-card mt-8 fade-in">
              <h3 className="text-xl font-bold mb-4 flex items-center text-blue-600"><TrendingUp className="mr-2" /> Subject-wise Attendance</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="subject" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#3b82f6" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Wrap Recent Activity in a new container for differentiation */}
          <div className="recent-activity-container mt-8">
            <RecentActivity notifications={recentActivity} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

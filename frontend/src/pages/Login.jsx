import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';
import { FaUser, FaLock } from 'react-icons/fa';
import './Login.css'; // Your stylesheet for layout

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showReset, setShowReset] = useState(false);
  const [resetForm, setResetForm] = useState({ email: '', newPassword: '', confirmPassword: '' });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = 'http://localhost:5000/api';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    if (!resetForm.email || !resetForm.newPassword || !resetForm.confirmPassword) {
      setResetError('All fields are required');
      return;
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }
    try {
      setResetLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetForm.email,
          newPassword: resetForm.newPassword,
          confirmPassword: resetForm.confirmPassword
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to reset password');
      }
      setResetSuccess('Password updated successfully. You can now log in.');
      setResetForm({ email: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(formData.email, formData.password);

      if (success) {
        navigate('/');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Panel */}
      <div className="left-panel">
        <div className="welcome-content">
          <h1>Welcome to College Digital Portal</h1>
          <p>
            Access your student, faculty, or admin account to manage academic
            activities and stay connected with your college community.
          </p>
        </div>
      </div>

      {/* Right Panel (Login Form) */}
      <div className="right-panel">
        <div className="login-form">
          <h2>USER LOGIN</h2>

          {error && (
            <div className="error-box">
              <AlertCircle className="error-icon" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password Input */}
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Remember & Forgot Password */}
            <div className="options">
              <label className="remember-me">
                <input type="checkbox" defaultChecked />
                <span>Remember</span>
              </label>
              <button type="button" className="forgot-password" onClick={() => { setShowReset(true); setResetError(''); setResetSuccess(''); }}>
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? 'Logging in...' : 'LOGIN'}
            </button>
          </form>

          {/* Register */}
          <div className="register-section">
            <p>
              Don’t have an account?{' '}
              <Link to="/register" className="register-link">
                SignUp
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          {/* <div className="demo-section">
            <p className="demo-title">Demo Credentials:</p>
            <p>Student: student@college.edu / password123</p>
            <p>Faculty: faculty@college.edu / password123</p>
            <p>Admin: admin@college.edu / password123</p>
          </div> */}
        </div>
      </div>
      {showReset && (
        <div className="reset-overlay">
          <div className="reset-modal">
            <div className="reset-header">
              <h3>Reset Password</h3>
              <button className="reset-close" onClick={() => setShowReset(false)}>×</button>
            </div>
            {resetError && (
              <div className="error-box">
                <AlertCircle className="error-icon" />
                <p>{resetError}</p>
              </div>
            )}
            {resetSuccess && (
              <div className="success-box">
                <p>{resetSuccess}</p>
              </div>
            )}
            <form onSubmit={handleResetSubmit} className="reset-form">
              <div className="input-group">
                <FaUser className="input-icon" />
                <input
                  type="email"
                  name="resetEmail"
                  placeholder="Enter your email"
                  value={resetForm.email}
                  onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  name="newPassword"
                  placeholder="New password"
                  value={resetForm.newPassword}
                  onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="login-button" disabled={resetLoading}>
                {resetLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

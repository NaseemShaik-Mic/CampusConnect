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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
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
              <a href="#" className="forgot-password">
                Forgot password?
              </a>
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
    </div>
  );
};

export default Login;

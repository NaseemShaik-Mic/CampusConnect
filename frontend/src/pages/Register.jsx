import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: '',
    semester: '',
    studentId: '',
    facultyId: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...submitData } = formData;
    const success = await register(submitData);

    if (success) {
      navigate('/');
    }

    setLoading(false);
  };

  return (
    <div className="register-container">
      {/* Left Panel with Welcome Message */}
      <div className="left-panel-register">
        <div className="arrow-down"></div>
        <div className="join-us-content">
          <h1>Join Us</h1>
          <p>
            Become part of the College Digital Portal to access academic
            resources, stay connected, and manage your profile seamlessly.
          </p>
          <button className="about-us-button">About Us</button>
        </div>
      </div>

      {/* Right Panel with Registration Form */}
      <div className="right-panel-register">
        <div className="register-form">
          <div className="form-header">
            <UserPlus className="register-icon" />
            <h2>Register Here</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Full Name */}
              <div className="input-group-register">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  required
                />
              </div>

              {/* Email */}
              <div className="input-group-register">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                />
              </div>

              {/* Password */}
              <div className="input-group-register">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  minLength={6}
                />
              </div>

              {/* Confirm Password */}
              <div className="input-group-register">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  required
                  minLength={6}
                />
              </div>

              {/* Role */}
              <div className="input-group-register">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Department */}
              <div className="input-group-register">
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Fields */}
              {formData.role === 'student' && (
                <>
                  <div className="input-group-register">
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      placeholder="Student ID"
                      required
                    />
                  </div>

                  <div className="input-group-register">
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Faculty Fields */}
              {formData.role === 'faculty' && (
                <div className="input-group-register">
                  <input
                    type="text"
                    name="facultyId"
                    value={formData.facultyId}
                    onChange={handleChange}
                    placeholder="Faculty ID"
                    required
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="register-button"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          {/* Login Redirect */}
          <div className="register-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="login-link">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

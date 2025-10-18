import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Save } from 'lucide-react';
import './ProfileEdit.css';

const ProfileEdit = () => {
  const { user, updateProfile } = useAuth(); // Assuming `user` has current user info
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    semester: '',
    studentId: '',
    facultyId: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];

  useEffect(() => {
    if (user) {
      // Populate form with existing user data
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'student',
        department: user.department || '',
        semester: user.semester || '',
        studentId: user.studentId || '',
        facultyId: user.facultyId || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const success = await updateProfile(formData); // Call update API

    if (success) {
      alert('Profile updated successfully!');
      navigate('/dashboard'); // Redirect to dashboard after update
    } else {
      alert('Failed to update profile.');
    }

    setLoading(false);
  };

  return (
    <div className="profile-edit-container">
      <div className="profile-edit-form">
        <div className="form-header">
          <UserPlus className="profile-icon" />
          <h2>Edit Profile</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Full Name */}
            <div className="input-group-edit">
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
            <div className="input-group-edit">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
              />
            </div>

            {/* Role */}
            <div className="input-group-edit">
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
            <div className="input-group-edit">
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
                <div className="input-group-edit">
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    placeholder="Student ID"
                    required
                  />
                </div>

                <div className="input-group-edit">
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
              <div className="input-group-edit">
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

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="save-button"
          >
            {loading ? 'Saving...' : <><Save /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;

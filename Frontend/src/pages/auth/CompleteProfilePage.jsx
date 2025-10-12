import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import '../../styles/Auth.css';

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    batch: '',
    year: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const departments = [
    'Computer Science and Engineering',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Information Technology',
    'Artificial Intelligence and Machine Learning',
    'Data Science',
  ];

  const years = ['1', '2', '3', '4'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.completeProfile(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Complete Your Profile</h1>
          <p>Tell us a bit more about yourself</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="department">Department *</label>
            <select
              id="department"
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="batch">Batch *</label>
              <input
                type="text"
                id="batch"
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                placeholder="e.g., 2022"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="year">Year *</label>
              <select
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
              >
                <option value="">Select Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number (Optional)</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Completing...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfilePage;

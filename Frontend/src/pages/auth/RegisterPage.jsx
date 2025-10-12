import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import ErrorHelper from '../../components/ErrorHelper';
import { diagnoseError } from '../../utils/errorDiagnostics';
import '../../styles/Auth.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    rollNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateRollNumber = (rollNumber) => {
    const regex = /^[0-9]{2}[Bb][Dd][A-Za-z0-9]{6}$/;
    return regex.test(rollNumber);
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error for this field
    setErrors({
      ...errors,
      [e.target.name]: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validation
    if (!validateRollNumber(formData.rollNumber)) {
      newErrors.rollNumber = 'Invalid roll number format (e.g., 22BD1A0501)';
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // Send all data including confirmPassword (backend validator requires it)
      await authService.register(formData);
      
      // Navigate to OTP verification with email
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (err) {
      // Diagnose error with detailed logging
      const diagnosis = diagnoseError(err, '/auth/register');
      
      let errorMessage = diagnosis.userMessage;
      
      // Add specific handling for 500 errors
      if (err.response?.status === 500) {
        errorMessage = 'Server error: ' + (err.response?.data?.message || 'Backend is having issues. Please check backend logs.');
      }
      
      setErrors({
        general: errorMessage,
      });
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join KMIT Clubs Hub and start your journey</p>
        </div>

        {errors.general && <ErrorHelper error={errors.general} type="register" />}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="rollNumber">Roll Number *</label>
            <input
              type="text"
              id="rollNumber"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleChange}
              placeholder="e.g., 22BD1A0501"
              required
            />
            {errors.rollNumber && <span className="error-text">{errors.rollNumber}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              required
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              required
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
            <small className="form-hint">
              Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              required
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="link">
              Login here
            </Link>
          </p>
          <Link to="/" className="link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

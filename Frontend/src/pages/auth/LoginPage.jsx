import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ErrorHelper from '../../components/ErrorHelper';
import '../../styles/Auth.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    identifier: '', // email or rollNumber
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData);
      const user = response.data.user;

      // Redirect based on role (priority order)
      if (user.globalRoles?.includes('admin')) {
        navigate('/admin/dashboard');
      } else if (user.globalRoles?.includes('coordinator')) {
        navigate('/coordinator/dashboard');
      } else if (user.clubRoles?.some(cr => cr.roles.includes('core') || cr.roles.includes('president'))) {
        navigate('/core/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      let errorMessage = 'Login failed. Please try again.';
      
      // Log full error details for debugging
      console.error('Login error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        formData: formData
      });
      
      if (err.response?.status === 400) {
        // Validation error - show the specific validation message
        errorMessage = err.response.data?.message || 'Invalid input. Please check your email/roll number and password.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Invalid credentials or account not verified. Please check your email/roll number and password.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid email/roll number or password.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Login to your KMIT Clubs Hub account</p>
        </div>

        {error && <ErrorHelper error={error} type="login" />}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="identifier">Email or Roll Number</label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="Enter your email or roll number"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="form-footer">
            <Link to="/forgot-password" className="link">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="link">
              Register here
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

export default LoginPage;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import '../../styles/Auth.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.forgotPassword({ identifier });
      setSuccess('Password reset instructions sent to your email!');
      setTimeout(() => {
        navigate('/reset-password', { state: { identifier } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Forgot Password?</h1>
          <p>Enter your email or roll number to reset your password</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="identifier">Email or Roll Number</label>
            <input
              type="text"
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email or roll number"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Remember your password?{' '}
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

export default ForgotPasswordPage;

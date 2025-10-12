import React from 'react';
import '../styles/ErrorHelper.css';

const ErrorHelper = ({ error, type = 'general' }) => {
  if (!error) return null;

  const getErrorInfo = () => {
    // Registration errors
    if (type === 'register') {
      if (error.includes('409') || error.includes('already registered') || error.includes('Account exists')) {
        return {
          title: '✅ Account Already Exists',
          message: 'You already have an account with this email or roll number.',
          action: 'Please use the Login page. If you haven\'t verified your OTP yet, check your email first.',
          type: 'info'
        };
      }
    }

    // Login errors
    if (type === 'login') {
      if (error.includes('403') || error.includes('not verified')) {
        return {
          title: '⚠️ Account Not Verified',
          message: 'Your account exists but OTP verification is not complete.',
          action: 'Please check your email for the OTP code and complete verification.',
          type: 'warning'
        };
      }
      if (error.includes('401') || error.includes('Invalid')) {
        return {
          title: '❌ Invalid Credentials',
          message: 'The email/roll number or password is incorrect.',
          action: 'Please check your credentials or use "Forgot Password".',
          type: 'error'
        };
      }
    }

    // Default error
    return {
      title: '❌ Error',
      message: error,
      action: null,
      type: 'error'
    };
  };

  const errorInfo = getErrorInfo();

  return (
    <div className={`error-helper error-helper-${errorInfo.type}`}>
      <div className="error-helper-title">{errorInfo.title}</div>
      <div className="error-helper-message">{errorInfo.message}</div>
      {errorInfo.action && (
        <div className="error-helper-action">{errorInfo.action}</div>
      )}
    </div>
  );
};

export default ErrorHelper;

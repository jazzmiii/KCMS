// Error diagnostics utility
export const diagnoseError = (error, endpoint) => {
  const status = error.response?.status;
  const message = error.response?.data?.message;
  const data = error.response?.data;

  console.group(`🔍 Error Diagnostic - ${endpoint}`);
  console.log('Status Code:', status);
  console.log('Error Message:', message);
  console.log('Full Response:', data);
  console.log('Request Data:', error.config?.data);
  console.groupEnd();

  return {
    status,
    message,
    userMessage: getUserFriendlyMessage(status, message, endpoint)
  };
};

const getUserFriendlyMessage = (status, message, endpoint) => {
  // Registration errors
  if (endpoint.includes('register')) {
    switch (status) {
      case 500:
        return 'Server error during registration. This might be a backend issue. Please try again or contact support.';
      case 409:
        return 'This email or roll number is already registered. Please login instead.';
      case 400:
        return message || 'Invalid registration data. Please check all fields.';
      default:
        return message || 'Registration failed. Please try again.';
    }
  }

  // Login errors
  if (endpoint.includes('login')) {
    switch (status) {
      case 403:
        return 'Invalid credentials or account not verified. Please check your email/roll number and password.';
      case 401:
        return 'Invalid email/roll number or password.';
      case 500:
        return 'Server error during login. Please try again.';
      default:
        return message || 'Login failed. Please try again.';
    }
  }

  // Events errors
  if (endpoint.includes('events')) {
    switch (status) {
      case 500:
        return 'Unable to load events. This is a backend issue.';
      default:
        return message || 'Failed to load events.';
    }
  }

  return message || 'An error occurred. Please try again.';
};

export const logErrorDetails = (error, context = '') => {
  console.error(`❌ Error in ${context}:`, {
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    config: {
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data
    }
  });
};

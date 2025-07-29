// Error handling utility for consistent error message extraction
export const getErrorMessage = (error) => {
  // Handle different error formats
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.response?.data?.detail) {
    const detail = error.response.data.detail;
    
    // Handle Pydantic validation errors (array of error objects)
    if (Array.isArray(detail)) {
      return detail.map(err => err.msg || err.message || 'Validation error').join(', ');
    }
    
    // Handle string detail
    if (typeof detail === 'string') {
      return detail;
    }
    
    // Handle object detail
    if (typeof detail === 'object' && detail.msg) {
      return detail.msg;
    }
  }
  
  // Handle standard error messages
  if (error?.message) {
    return error.message;
  }
  
  // Fallback
  return 'An unexpected error occurred';
};

// Safe toast error function
export const showErrorToast = (error, fallbackMessage = 'An error occurred') => {
  const message = getErrorMessage(error);
  return message || fallbackMessage;
};

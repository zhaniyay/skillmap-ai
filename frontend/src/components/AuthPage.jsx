import React, { useState, useRef, useEffect } from 'react';

const AuthPage = ({ onAuth, loading }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const submitRef = useRef(null);

  // Focus management
  useEffect(() => {
    if (usernameRef.current) {
      usernameRef.current.focus();
    }
  }, [isLogin]); // Refocus when switching between login/signup

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Basic client-side validation for better UX
    const newErrors = {};
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Focus first field with error
      if (newErrors.username && usernameRef.current) {
        usernameRef.current.focus();
      } else if (newErrors.password && passwordRef.current) {
        passwordRef.current.focus();
      }
      return;
    }
    
    onAuth(username, password, isLogin);
  };

  const handleKeyDown = (e, nextRef) => {
    // Enhanced keyboard navigation
    if (e.key === 'Enter' && nextRef && nextRef.current) {
      e.preventDefault();
      nextRef.current.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="SkillMap AI Logo" 
            className="h-16 w-16 mx-auto mb-4"
            role="img"
          />
          <h1 className="text-3xl font-bold text-gray-800">SkillMap AI</h1>
          <p className="text-gray-600 mt-2">Personalized Learning Roadmaps</p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="space-y-6"
          noValidate
          role="form"
          aria-label={isLogin ? "Login form" : "Sign up form"}
        >
          {/* Screen reader announcement for form mode */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {isLogin ? "Login form" : "Sign up form"}
          </div>

          <div>
            <label 
              htmlFor="username-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Username
              <span className="text-red-500 ml-1" aria-label="required">*</span>
            </label>
            <input
              id="username-input"
              ref={usernameRef}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, passwordRef)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                errors.username 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              required
              aria-required="true"
              aria-invalid={errors.username ? 'true' : 'false'}
              aria-describedby={errors.username ? 'username-error' : undefined}
              autoComplete={isLogin ? 'username' : 'username'}
            />
            {errors.username && (
              <div 
                id="username-error" 
                className="mt-1 text-sm text-red-600"
                role="alert"
                aria-live="polite"
              >
                {errors.username}
              </div>
            )}
          </div>
          
          <div>
            <label 
              htmlFor="password-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
              <span className="text-red-500 ml-1" aria-label="required">*</span>
            </label>
            <input
              id="password-input"
              ref={passwordRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, submitRef)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                errors.password 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              required
              aria-required="true"
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : undefined}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            {errors.password && (
              <div 
                id="password-error" 
                className="mt-1 text-sm text-red-600"
                role="alert"
                aria-live="polite"
              >
                {errors.password}
              </div>
            )}
          </div>
          
          <button
            ref={submitRef}
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-describedby="submit-button-description"
          >
            {loading ? (
              <>
                <span className="sr-only">Processing request</span>
                <span aria-hidden="true">Please wait...</span>
              </>
            ) : (
              isLogin ? 'Login' : 'Sign Up'
            )}
          </button>
          <div id="submit-button-description" className="sr-only">
            {isLogin 
              ? "Submit form to log into your account" 
              : "Submit form to create a new account"
            }
          </div>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({}); // Clear errors when switching modes
            }}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
            aria-describedby="mode-switch-description"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
          <div id="mode-switch-description" className="sr-only">
            {isLogin 
              ? "Switch to sign up form to create a new account" 
              : "Switch to login form to access existing account"
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

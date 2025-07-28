import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ username, onLogout }) => {
  const location = useLocation();

  return (
    <header className="bg-white shadow-lg border-b-2 border-blue-100">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <Link 
            to="/profile" 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
            aria-label="SkillMap AI - Go to profile"
          >
            <img 
              src="/logo.png" 
              alt="SkillMap AI Logo" 
              className="h-10 w-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-800">SkillMap AI</h1>
              <p className="text-xs text-gray-500">Personalized Learning Roadmaps</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/profile"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                location.pathname === '/profile'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              Profile
            </Link>
            <Link
              to="/goals"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                location.pathname === '/goals'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              Goals
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              Welcome, <span className="font-semibold">{username}</span>
            </span>
            <button
              onClick={onLogout}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium
                       hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300
                       transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex space-x-4">
          <Link
            to="/profile"
            className={`flex-1 text-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              location.pathname === '/profile'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            Profile
          </Link>
          <Link
            to="/goals"
            className={`flex-1 text-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              location.pathname === '/goals'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            Goals
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;

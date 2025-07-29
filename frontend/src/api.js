// src/api.js
import axios from 'axios';
import config, { validateEnvironment } from './config/environment.js';
import { toast } from 'react-hot-toast';

// Validate environment configuration on startup
validateEnvironment();

// Default timeout of 2 minutes for all requests
const DEFAULT_TIMEOUT = 120000; // 2 minutes

// Create an axios instance with default config
export const API = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Request interceptor for adding auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Special handling for file uploads
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
      // Increase timeout for file uploads to 5 minutes
      config.timeout = 300000;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, message } = error;
    
    // Handle timeout errors
    if (message.includes('timeout')) {
      toast.error('Request timed out. The server is taking too long to respond.');
    } 
    // Handle network errors
    else if (message === 'Network Error') {
      toast.error('Network error. Please check your internet connection.');
    }
    // Handle HTTP errors
    else if (response) {
      // Handle specific status codes
      switch (response.status) {
        case 401:
          // Handle unauthorized access
          if (window.location.pathname !== '/login') {
            toast.error('Session expired. Please log in again.');
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
          break;
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
          toast.error('The requested resource was not found.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(response.data?.detail || 'An error occurred');
      }
    }
    
    return Promise.reject(error);
  }
);;

export function signup(username, password) {
  const data = new URLSearchParams();
  data.append("username", username);
  data.append("password", password);
  return API.post("/signup", data, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

export function login(username, password) {
  const data = new URLSearchParams();
  data.append("username", username);
  data.append("password", password);
  return API.post("/token", data, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}
export function uploadResume(formData) {
  return API.post('/upload_resume', formData, {
    headers: {
      'Content-Type': undefined // Let browser set multipart/form-data with boundary
    }
  });
}

export function getProgress() {
  // Returns the most recent progress for the logged-in user
  return API.get('/progress/'); // <-- trailing slash
}

export function saveProgress(goal, skills, roadmap, cv_assessment = '', skill_gaps = [], learning_path = [], cv_tips = []) {
  // Save or update the user's progress with structured roadmap data
  const progressData = {
    goal,
    skills,
    roadmap,
    cv_assessment,
    skill_gaps,
    learning_path,
    cv_tips
  };
  
  console.log('📡 API: Sending progress data:', progressData);
  return API.post('/progress/', progressData);
}

export function getAllProgress() {
  // Returns all progress entries for the logged-in user
  return API.get('/progress/all/');
}

export function deleteProgress(id) {
  return API.delete(`/progress/${id}/`);
}

export function renameProgress(id, new_goal) {
  return API.patch(`/progress/${id}/`, { new_goal });
}

export function toggleStep(id, step_idx, done) {
  return API.patch(`/progress/${id}/step/`, { step_idx, done });
}





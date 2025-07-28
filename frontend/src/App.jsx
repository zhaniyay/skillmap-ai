// src/App.jsx - Redesigned with comprehensive UI/UX improvements
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { signup, login, uploadResume, getProgress, saveProgress, getAllProgress, deleteProgress, renameProgress, toggleStep } from './api';
import Header from './components/Header';
import ProfilePage from './components/ProfilePage';
import GoalsPage from './components/GoalsPage';
import RoadmapView from './components/RoadmapView';
import './App.css';

// Modal Component for New Goal
const NewGoalModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [goal, setGoal] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file || !goal) {
      alert('Please select a file and enter a goal');
      return;
    }
    onSubmit(goal, file);
  };

  const handleClose = () => {
    setGoal('');
    setFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-200 scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create New Goal</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Career Goal
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Become a full-stack developer"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Your Resume (PDF)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Authentication Component
const AuthPage = ({ onAuth, loading }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAuth(username, password, isLogin);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="SkillMap AI Logo" className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">SkillMap AI</h1>
          <p className="text-gray-600 mt-2">Personalized Learning Roadmaps</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingGoalValue, setEditingGoalValue] = useState('');
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [goal, setGoal] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUsername = localStorage.getItem("username");
    if (token && savedUsername) {
      setIsAuthenticated(true);
      setUsername(savedUsername);
      fetchAllProgress();
    }
  }, []);

  const fetchAllProgress = async () => {
    try {
      const { data } = await getAllProgress();
      setGoals(data);
      if (data.length > 0) {
        const latestGoal = data[0];
        setSelectedGoalId(latestGoal.id);
        setGoal(latestGoal.goal);
        setResult({
          extracted_skills: latestGoal.skills || [],
          roadmap: (latestGoal.roadmap || []).join('\n'),
          completed_steps: latestGoal.completed_steps || [],
          recommended_courses: []
        });
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleAuth = async (usernameInput, password, isLogin) => {
    setLoading(true);
    try {
      const authFunction = isLogin ? login : signup;
      const response = await authFunction(usernameInput, password);
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("username", usernameInput);
      setIsAuthenticated(true);
      setUsername(usernameInput);
      await fetchAllProgress();
      navigate('/profile');
    } catch (error) {
      alert(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setIsAuthenticated(false);
    setUsername('');
    setGoals([]);
    setResult(null);
    setSelectedGoalId(null);
  };

  const handleNewGoal = async (goalText, file) => {
    setLoading(true);
    try {
      const response = await uploadResume(file, goalText);
      setResult(response.data);
      setGoal(goalText);
      
      // Save progress with correct format: { goal, skills, roadmap }
      const saveResponse = await saveProgress(
        goalText, 
        response.data.extracted_skills || [], 
        response.data.roadmap ? response.data.roadmap.split('\n') : []
      );
      await fetchAllProgress();
      
      setShowNewGoalModal(false);
      navigate('/roadmap');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoalFromPage = async (goalText, resumeFile = null) => {
    try {
      if (resumeFile) {
        // Use resume upload for AI-powered roadmap generation
        const formData = new FormData();
        formData.append('file', resumeFile);
        formData.append('goal', goalText);
        
        const uploadResponse = await uploadResume(formData);
        const { extracted_skills, roadmap } = uploadResponse.data;
        
        // Parse roadmap text into array of steps
        let roadmapArray;
        if (typeof roadmap === 'string') {
          // Split roadmap text by lines and clean up
          roadmapArray = roadmap
            .split('\n')
            .map(step => step.trim())
            .filter(step => step.length > 0)
            .map(step => {
              // Remove numbering, bullets, or dashes from the beginning
              return step.replace(/^[\d\-\*\.\)\s]+/, '').trim();
            })
            .filter(step => step.length > 0);
        } else if (Array.isArray(roadmap)) {
          roadmapArray = roadmap;
        } else {
          // Fallback to mock roadmap if format is unexpected
          roadmapArray = [
            `Research ${goalText}`,
            'Create learning plan',
            'Start with fundamentals',
            'Build projects',
            'Get certified'
          ];
        }
        
        // Save progress with AI-generated data
        const saveResponse = await saveProgress(goalText, extracted_skills, roadmapArray);
        await fetchAllProgress();
        return saveResponse;
      } else {
        // Create goal without resume upload - use mock roadmap
        const mockRoadmap = [
          `Research ${goalText}`,
          'Create learning plan',
          'Start with fundamentals',
          'Build projects',
          'Get certified'
        ];
        
        // Save progress with correct format: { goal, skills, roadmap }
        const saveResponse = await saveProgress(goalText, [], mockRoadmap);
        await fetchAllProgress();
        return saveResponse;
      }
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteProgress(goalId);
      await fetchAllProgress();
      
      // If the deleted goal was currently selected, clear the selection
      if (selectedGoalId === goalId) {
        setSelectedGoalId(null);
        setGoal('');
        setResult(null);
      }
      
      toast.success('Goal deleted successfully!', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#0052CC',
          color: 'white',
          fontWeight: '600',
        },
      });
    } catch (error) {
      toast.error('Failed to delete goal. Please try again.');
      throw error;
    }
  };

  const handleGoalSelect = (selectedGoal) => {
    setSelectedGoalId(selectedGoal.id);
    setGoal(selectedGoal.goal);
    setResult({
      extracted_skills: selectedGoal.skills || [],
      roadmap: (selectedGoal.roadmap || []).join('\n'),
      completed_steps: selectedGoal.completed_steps || [],
      recommended_courses: []
    });
    navigate('/roadmap');
  };

  const handleToggleStep = async (stepIndex) => {
    if (!selectedGoalId) return;
    
    try {
      // Determine if the step is currently completed
      const currentCompleted = result?.completed_steps || [];
      const isCurrentlyCompleted = currentCompleted.includes(stepIndex);
      
      // Send the correct format: { step_idx, done }
      await toggleStep(selectedGoalId, stepIndex, !isCurrentlyCompleted);
      await fetchAllProgress();
      
      // Update current result
      const updatedGoal = goals.find(g => g.id === selectedGoalId);
      if (updatedGoal) {
        setResult(prev => ({
          ...prev,
          completed_steps: updatedGoal.completed_steps || []
        }));
      }
    } catch (error) {
      console.error('Error toggling step:', error);
    }
  };



  const handleRenameGoal = async (goalId) => {
    if (!editingGoalValue.trim()) {
      setEditingGoalId(null);
      return;
    }
    
    try {
      await renameProgress(goalId, editingGoalValue.trim());
      await fetchAllProgress();
      if (selectedGoalId === goalId) {
        setGoal(editingGoalValue.trim());
      }
    } catch (error) {
      console.error('Error renaming goal:', error);
    } finally {
      setEditingGoalId(null);
      setEditingGoalValue('');
    }
  };

  const handleEditGoal = (goalId, currentGoal) => {
    setEditingGoalId(goalId);
    setEditingGoalValue(currentGoal);
  };

  if (!isAuthenticated) {
    return <AuthPage onAuth={handleAuth} loading={loading} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={username} onLogout={handleLogout} />
      
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/profile" replace />} />
          <Route 
            path="/profile" 
            element={
              <ProfilePage 
                username={username} 
                goals={goals}
              />
            } 
          />
          <Route 
            path="/goals" 
            element={
              <GoalsPage 
                goals={goals}
                onAddGoal={handleAddGoalFromPage}
                onGoalSelect={handleGoalSelect}
                onDeleteGoal={handleDeleteGoal}
              />
            } 
          />
          <Route 
            path="/roadmap" 
            element={
              selectedGoalId ? (
                <div className="max-w-6xl mx-auto py-8 px-6">
                  <RoadmapView 
                    result={result}
                    onToggleStep={handleToggleStep}
                    goal={goal}
                  />
                </div>
              ) : (
                <Navigate to="/goals" replace />
              )
            } 
          />
        </Routes>
      </main>

      <NewGoalModal
        isOpen={showNewGoalModal}
        onClose={() => setShowNewGoalModal(false)}
        onSubmit={handleNewGoal}
        loading={loading}
      />
      
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

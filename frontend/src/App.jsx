// src/App.jsx - Redesigned with comprehensive UI/UX improvements
import React, { useState, useEffect } from 'react';
import { signup, login, uploadResume, getProgress, saveProgress, getAllProgress, deleteProgress, renameProgress, toggleStep } from './api';
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
              placeholder="e.g., AI Engineer at Apple"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Resume/CV
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf,.doc,.docx"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              required
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingGoalValue, setEditingGoalValue] = useState('');
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredGoalId, setHoveredGoalId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
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

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const authFunction = isLogin ? login : signup;
      const response = await authFunction(username, password);
      localStorage.setItem("token", response.data.access_token);
      setIsAuthenticated(true);
      setUsername('');
      setPassword('');
    } catch (error) {
      alert(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setGoal('');
    setFile(null);
    setResult(null);
    setGoals([]);
    setSelectedGoalId(null);
    setEditingGoalId(null);
    setEditingGoalValue('');
  };

  const handleNewGoal = async (goal, file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('goal', goal);

      const response = await uploadResume(formData);
      
      // Save progress
      await saveProgress(goal, response.data.extracted_skills, response.data.roadmap.split('\n'), []);
      
      // Refresh goals list
      const { data: allProgress } = await getAllProgress();
      setGoals(allProgress);
      if (allProgress.length > 0) {
        const latestGoal = allProgress[0];
        setSelectedGoalId(latestGoal.id);
        setResult({
          extracted_skills: response.data.extracted_skills,
          roadmap: response.data.roadmap,
          completed_steps: latestGoal.completed_steps || [],
          recommended_courses: response.data.recommended_courses || []
        });
      }
      
      setShowNewGoalModal(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoalSelect = (selectedGoal) => {
    setSelectedGoalId(selectedGoal.id);
    setResult({
      extracted_skills: selectedGoal.skills || [],
      roadmap: (selectedGoal.roadmap || []).join('\n'),
      completed_steps: selectedGoal.completed_steps || [],
      recommended_courses: []
    });
    setSidebarOpen(false); // Close sidebar on mobile
  };

  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await deleteProgress(goalId);
      const { data: allProgress } = await getAllProgress();
      setGoals(allProgress);
      if (selectedGoalId === goalId) {
        if (allProgress.length > 0) {
          handleGoalSelect(allProgress[0]);
        } else {
          setSelectedGoalId(null);
          setResult(null);
        }
      }
    } catch (error) {
      alert('Error deleting goal');
    }
  };

  const handleEditGoal = (goalId, currentGoal) => {
    setEditingGoalId(goalId);
    setEditingGoalValue(currentGoal);
  };

  const handleRenameGoal = async (goalId) => {
    try {
      await renameProgress(goalId, editingGoalValue);
      const { data: allProgress } = await getAllProgress();
      setGoals(allProgress);
      if (selectedGoalId === goalId) {
        setGoal(editingGoalValue);
      }
      setEditingGoalId(null);
      setEditingGoalValue('');
    } catch (error) {
      alert('Error renaming goal');
    }
  };

  const handleToggleStep = async (stepIdx) => {
    if (!selectedGoalId) return;
    try {
      // Get current completion status
      const currentCompleted = result.completed_steps || [];
      const isCurrentlyCompleted = currentCompleted.includes(stepIdx);
      
      // Call backend to toggle step
      await toggleStep(selectedGoalId, stepIdx, !isCurrentlyCompleted);
      
      // Refresh data from backend
      const { data: allProgress } = await getAllProgress();
      setGoals(allProgress);
      
      // Find the updated entry and update result state
      const entry = allProgress.find(g => g.id === selectedGoalId);
      if (entry) {
        setResult(prevResult => ({
          ...prevResult,
          extracted_skills: entry.skills || [],
          roadmap: (entry.roadmap || []).join('\n'),
          completed_steps: entry.completed_steps || [],
          recommended_courses: prevResult?.recommended_courses || []
        }));
      }
    } catch (error) {
      console.error('Error toggling step:', error);
      // Optionally show user-friendly error message
      alert('Failed to update step. Please try again.');
    }
  };

  const calculateProgress = () => {
    if (!result?.roadmap || !result?.completed_steps) return 0;
    const steps = result.roadmap.split('\n').filter(line => line.trim());
    return steps.length > 0 ? Math.round((result.completed_steps.length / steps.length) * 100) : 0;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">SkillMap AI Agent</h1>
            <p className="text-gray-600">Your personal learning roadmap generator</p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50"
            >
              {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100" style={{backgroundColor: '#E8F1FA'}}>
      {/* New Goal Modal */}
      <NewGoalModal 
        isOpen={showNewGoalModal} 
        onClose={() => setShowNewGoalModal(false)} 
        onSubmit={handleNewGoal} 
        loading={loading} 
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
                aria-label="Toggle sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 ml-2 lg:ml-0">
                SkillMap AI Agent
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNewGoalModal(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">New Goal</span>
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className={`lg:w-80 ${sidebarOpen ? 'block' : 'hidden lg:block'} transition-all duration-200`}>
            <div className="rounded-2xl shadow-lg p-6 space-y-6" style={{backgroundColor: '#2B4F81'}}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Your Goals</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden text-gray-300 hover:text-white transition-colors duration-200"
                  aria-label="Close sidebar"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {goals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-300 mb-4">No goals yet</p>
                  <button
                    onClick={() => setShowNewGoalModal(true)}
                    className="text-blue-200 hover:text-white font-medium transition-colors duration-200"
                  >
                    Create your first goal
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedGoalId === goal.id
                          ? 'bg-blue-100 border border-blue-300 shadow-sm'
                          : 'bg-blue-50 hover:bg-blue-100 hover:shadow-sm'
                      }`}
                      onClick={() => handleGoalSelect(goal)}
                      onMouseEnter={() => setHoveredGoalId(goal.id)}
                      onMouseLeave={() => setHoveredGoalId(null)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="3"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="url(#gradient)"
                              strokeWidth="3"
                              strokeDasharray={`${goal.completed_steps ? Math.round((goal.completed_steps.length / (goal.roadmap?.length || 1)) * 100) : 0}, 100`}
                              className="transition-all duration-500"
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3A6FA5" />
                                <stop offset="100%" stopColor="#2B4F81" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-800">
                              {goal.completed_steps ? Math.round((goal.completed_steps.length / (goal.roadmap?.length || 1)) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingGoalId === goal.id ? (
                            <input
                              type="text"
                              value={editingGoalValue}
                              onChange={(e) => setEditingGoalValue(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              onKeyPress={(e) => e.key === 'Enter' && handleRenameGoal(goal.id)}
                              onBlur={() => handleRenameGoal(goal.id)}
                              autoFocus
                            />
                          ) : (
                            <>
                              <h3 className="font-semibold truncate" style={{color: '#1B2A47'}}>{goal.goal}</h3>
                              <p className="text-xs mt-1" style={{color: '#1B2A47', opacity: 0.7}}>
                                Created {new Date(goal.updated_at).toLocaleDateString()}
                              </p>
                            </>
                          )}
                          
                          {hoveredGoalId === goal.id && editingGoalId !== goal.id && (
                            <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditGoal(goal.id, goal.goal);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                aria-label="Edit goal"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGoal(goal.id);
                                }}
                                className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                                aria-label="Delete goal"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Extracted Skills */}
              {result?.extracted_skills && result.extracted_skills.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Extracted Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.extracted_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {goals.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="mb-8">
                  <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4" style={{color: '#1B2A47'}}>No Goals Yet</h3>
                <p className="mb-8 max-w-md mx-auto" style={{color: '#1B2A47', opacity: 0.7}}>
                  Create your first learning roadmap by uploading your resume and setting a career goal.
                </p>
                <button
                  onClick={() => setShowNewGoalModal(true)}
                  className="text-white px-8 py-4 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 mx-auto hover:opacity-90"
                  style={{background: 'linear-gradient(to right, #3A6FA5, #2B4F81)'}}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create Your First Goal</span>
                </button>
              </div>
            ) : result ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Learning Roadmap</h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="url(#gradient2)"
                          strokeWidth="3"
                          strokeDasharray={`${calculateProgress()}, 100`}
                          className="transition-all duration-500"
                        />
                        <defs>
                          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3A6FA5" />
                            <stop offset="100%" stopColor="#2B4F81" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-800" aria-label={`${calculateProgress()}% complete`}>
                          {calculateProgress()}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-8">
                  {/* Overview Card */}
                  <div className="rounded-2xl shadow-lg p-6" style={{backgroundColor: '#E8F1FA'}}>
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#2B4F81'}}>
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-3" style={{color: '#1B2A47'}}>Overview</h3>
                        <p className="text-sm leading-relaxed" style={{color: '#1B2A47'}}>
                          A standout CV for your target role should highlight relevant technical skills, quantifiable achievements, and demonstrate clear career progression. Focus on showcasing projects that align with industry requirements and emphasize your ability to deliver measurable results.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Skills to Learn Section */}
                  <div>
                    <h3 className="text-xl font-bold mb-4" style={{color: '#1B2A47'}}>Skills to Learn</h3>
                    <div className="grid gap-3">
                      {['Excel', 'Python', 'English', 'SQL', 'Time Management'].map((skill, idx) => {
                        const done = (result.completed_steps || []).includes(idx);
                        return (
                          <div 
                            key={skill}
                            className={`p-4 rounded-xl transition-all duration-200 hover:shadow-md cursor-pointer`}
                            style={{
                              backgroundColor: done ? '#D1E4FF' : '#F1F8FF'
                            }}
                            onClick={() => handleToggleStep(idx)}
                          >
                            <div className="flex items-center space-x-4">
                              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                done ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'
                              }`}>
                                {done && (
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span className={`font-medium transition-all duration-200 ${
                                done ? 'line-through opacity-75' : ''
                              }`} style={{color: '#1B2A47'}}>
                                {skill}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional CV Tips Section */}
                  <div>
                    <h3 className="text-xl font-bold mb-4" style={{color: '#1B2A47'}}>Additional CV Tips</h3>
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <ul className="space-y-3">
                        <li className="flex items-start space-x-3">
                          <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{backgroundColor: '#3A6FA5'}}></div>
                          <span className="text-sm" style={{color: '#1B2A47'}}>Quantify your achievements with specific numbers and percentages whenever possible</span>
                        </li>
                        <li className="flex items-start space-x-3">
                          <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{backgroundColor: '#3A6FA5'}}></div>
                          <span className="text-sm" style={{color: '#1B2A47'}}>Tailor your CV to each job application using relevant keywords from the job description</span>
                        </li>
                        <li className="flex items-start space-x-3">
                          <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{backgroundColor: '#3A6FA5'}}></div>
                          <span className="text-sm" style={{color: '#1B2A47'}}>Use a clean, ATS-friendly format with consistent fonts and clear section headings</span>
                        </li>
                        <li className="flex items-start space-x-3">
                          <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{backgroundColor: '#3A6FA5'}}></div>
                          <span className="text-sm" style={{color: '#1B2A47'}}>Keep your CV to 1-2 pages and prioritize the most relevant and recent experiences</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

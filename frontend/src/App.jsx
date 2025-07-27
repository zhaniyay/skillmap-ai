// src/App.jsx
import React, { useState, useEffect } from 'react';
import { signup, login, uploadResume, getProgress, saveProgress, getAllProgress, deleteProgress, renameProgress, toggleStep } from './api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [goal, setGoal] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingGoalValue, setEditingGoalValue] = useState('');

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

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file');
      return;
    }
    setLoading(true);
    try {
      const response = await uploadResume(file, goal);
      setResult(response.data);
      
      // Save progress
      await saveProgress(goal, response.data.extracted_skills, response.data.roadmap.split('\n'), []);
      
      // Refresh goals and select the new one
      const { data: allProgress } = await getAllProgress();
      setGoals(allProgress);
      if (allProgress.length > 0) {
        const latestGoal = allProgress[0];
        setSelectedGoalId(latestGoal.id);
        setResult({
          ...response.data,
          completed_steps: latestGoal.completed_steps || []
        });
      }
    } catch (error) {
      alert(error.response?.data?.detail || 'Error generating roadmap');
    } finally {
      setLoading(false);
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
          setGoal('');
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
      await toggleStep(selectedGoalId, stepIdx, !(result.completed_steps || []).includes(stepIdx));
      const { data: allProgress } = await getAllProgress();
      setGoals(allProgress);
      const entry = allProgress.find(g => g.id === selectedGoalId);
      if (entry) {
        setResult({
          extracted_skills: entry.skills || [],
          roadmap: (entry.roadmap || []).join('\n'),
          completed_steps: entry.completed_steps || [],
          recommended_courses: result?.recommended_courses || []
        });
      }
    } catch (error) {
      console.error('Error toggling step:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">SkillMap AI Agent</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setGoal('');
                setFile(null);
                setResult(null);
                setSelectedGoalId(null);
              }}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>New Goal</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Your Goals Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Goals</h2>
            
            {goals.length > 0 && selectedGoalId && (
              <div className="flex items-center space-x-4 mb-4">
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
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      strokeDasharray={`${calculateProgress()}, 100`}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-800">{calculateProgress()}%</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-xl px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 truncate">{goal}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditGoal(selectedGoalId, goal)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(selectedGoalId)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Goals List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {goals.map((g) => (
                <div
                  key={g.id}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    selectedGoalId === g.id
                      ? 'bg-purple-50 border border-purple-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => handleGoalSelect(g)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {editingGoalId === g.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingGoalValue}
                            onChange={(e) => setEditingGoalValue(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            onKeyPress={(e) => e.key === 'Enter' && handleRenameGoal(g.id)}
                            onBlur={() => handleRenameGoal(g.id)}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate">{g.goal}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(g.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extracted Skills Card */}
          {result?.extracted_skills && result.extracted_skills.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Extracted Skills</h2>
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
              
              {/* Decorative 3D cube */}
              <div className="absolute bottom-4 left-4 opacity-10">
                <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2">
          {!result ? (
            /* Upload Form */
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Generate Your Learning Roadmap</h2>
              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Career Goal
                  </label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., AI Engineer at Apple"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50"
                >
                  {loading ? 'Generating Roadmap...' : 'Generate Roadmap'}
                </button>
              </form>
            </div>
          ) : (
            /* Roadmap Display */
            <div className="bg-white rounded-2xl shadow-lg p-8 relative overflow-hidden">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Roadmap</h2>
              
              <div className="space-y-4">
                {result.roadmap
                  .split('\n')
                  .map(line => line.trim())
                  .filter(line => line)
                  .map((step, idx) => {
                    const done = (result.completed_steps || []).includes(idx);
                    const colors = [
                      'from-pink-500 to-orange-500',
                      'from-blue-500 to-purple-500',
                      'from-pink-500 to-orange-500',
                      'from-purple-400 to-purple-600'
                    ];
                    const colorClass = colors[idx % colors.length];
                    
                    return (
                      <div key={idx} className="flex items-start space-x-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${colorClass} flex items-center justify-center flex-shrink-0 mt-1`}>
                          {done ? (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`font-medium ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {step.replace(/^\d+\.\s*/, '')}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {done ? 'Completed' : 'In progress'}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => handleToggleStep(idx)}
                              className={`ml-4 p-2 rounded-lg transition-all ${
                                done 
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {/* Decorative 3D cube */}
              <div className="absolute bottom-4 right-4 opacity-10">
                <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

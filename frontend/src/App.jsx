// src/App.jsx - Redesigned with context-based state management
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { signup, login, uploadResume, saveProgress, deleteProgress, getAllProgress } from './api';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import AuthPage from './components/AuthPage';
import ErrorBoundary from './components/ErrorBoundary';
import { getErrorMessage } from './utils/errorHandler';
import { 
  ProfilePage, 
  GoalsPage, 
  RoadmapView, 
  NewGoalModal, 
  LazyLoadErrorBoundary 
} from './components/LazyComponents';
import toast from 'react-hot-toast';
import './App.css';



// Main App Component with Context State Management
function AppContent() {
  const {
    isAuthenticated,
    username,
    loading,
    showNewGoalModal,
    result,
    goal,
    goals,
    selectedGoalId,
    editingGoalId,
    editingGoalValue,
    setAuthenticated,
    logout,
    setLoading,
    setShowNewGoalModal,
    addGoalFromResume,
    selectGoal,
    deleteGoal,
    renameGoal,
    toggleStep,
    startEditingGoal,
    cancelEditingGoal,
    updateEditingGoalValue,
    fetchAllProgress,
  } = useApp();
  
  const navigate = useNavigate();

  const handleAuth = async (usernameInput, password, isLogin) => {
    setLoading(true);
    try {
      const authFunction = isLogin ? login : signup;
      const response = await authFunction(usernameInput, password);
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("username", usernameInput);
      setAuthenticated(true, usernameInput);
      navigate('/profile');
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNewGoal = async (goalText, file) => {
    setLoading(true);
    try {
      // Use the context function for goal creation
      await addGoalFromResume(goalText, file);
      navigate('/roadmap');
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoalFromPage = async (goalText, resumeFile = null) => {
    try {
      if (resumeFile) {
        console.log('🚀 Creating goal with resume upload:', goalText);
        // Use context function for resume upload
        await addGoalFromResume(goalText, resumeFile);
        console.log('✅ Goal created with resume, navigating to roadmap...');
        // Navigate to roadmap page after successful creation
        navigate('/roadmap');
      } else {
        console.log('🚀 Creating goal without resume:', goalText);
        // Create goal without resume upload - use mock roadmap
        const mockRoadmap = [
          `Research ${goalText}`,
          'Create learning plan',
          'Start with fundamentals',
          'Build projects',
          'Get certified'
        ];
        
        // Save progress with correct format: { goal, skills, roadmap }
        await saveProgress(goalText, [], mockRoadmap);
        await fetchAllProgress();
        console.log('✅ Goal created without resume, navigating to roadmap...');
        // Navigate to roadmap page after successful creation
        navigate('/roadmap');
      }
      
      toast.success('Goal added successfully!', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#0052CC',
          color: 'white',
          fontWeight: '600',
        },
      });
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  };

  const handleDeleteGoal = async (goalId) => {
    console.log('🗑️ Delete goal:', goalId); // Debug log
    await deleteGoal(goalId);
  };

  const handleGoalSelect = (selectedGoal) => {
    console.log('🎯 Goal selected:', selectedGoal); // Debug log
    selectGoal(selectedGoal.id);
    navigate('/roadmap');
  };

  const handleToggleStep = async (stepIndex) => {
    console.log('✅ Toggle step:', stepIndex); // Debug log
    await toggleStep(stepIndex);
  };



  const handleRenameGoal = async (goalId) => {
    if (!editingGoalValue.trim()) {
      cancelEditingGoal();
      return;
    }
    
    console.log('✏️ Rename goal:', goalId, 'to:', editingGoalValue.trim()); // Debug log
    await renameGoal(goalId, editingGoalValue.trim());
  };

  const handleEditGoal = (goalId, currentGoal) => {
    console.log('📝 Edit goal:', goalId, currentGoal); // Debug log
    startEditingGoal(goalId, currentGoal);
  };

  if (!isAuthenticated) {
    return <AuthPage onAuth={handleAuth} loading={loading} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={username} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-8">
        <LazyLoadErrorBoundary>
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
        </LazyLoadErrorBoundary>
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
    <ErrorBoundary>
      <Router>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

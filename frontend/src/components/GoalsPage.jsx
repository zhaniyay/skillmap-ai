import React, { useState } from 'react';
import toast from 'react-hot-toast';

const GoalsPage = ({ goals, onAddGoal, onGoalSelect, onDeleteGoal }) => {
  const [newGoal, setNewGoal] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [useResumeUpload, setUseResumeUpload] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Inline validation
    if (!newGoal.trim()) {
      setValidationError('Goal is required');
      return;
    }
    
    if (newGoal.trim().length < 3) {
      setValidationError('Goal must be at least 3 characters long');
      return;
    }

    if (useResumeUpload && !resumeFile) {
      setValidationError('Please upload a resume file');
      return;
    }

    setValidationError('');
    setIsSubmitting(true);

    try {
      if (useResumeUpload && resumeFile) {
        // Use resume upload for AI-powered roadmap generation
        await onAddGoal(newGoal.trim(), resumeFile);
      } else {
        // Create goal without resume upload
        await onAddGoal(newGoal.trim());
      }
      
      setNewGoal('');
      setResumeFile(null);
      setUseResumeUpload(false);
      
      toast.success('Goal added!', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#0052CC',
          color: 'white',
          fontWeight: '600',
        },
      });
    } catch (error) {
      toast.error('Failed to add goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setNewGoal(e.target.value);
    if (validationError) {
      setValidationError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Your Learning Goals</h1>
          <p className="text-lg text-gray-600">Set your career objectives and start your learning journey</p>
        </div>

        {/* Add Goal Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add a New Goal</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="goal-input" className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to learn or achieve?
              </label>
              <input
                id="goal-input"
                type="text"
                value={newGoal}
                onChange={handleInputChange}
                placeholder="e.g., Become a full-stack developer, Learn data science..."
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  validationError 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                disabled={isSubmitting}
                aria-invalid={validationError ? 'true' : 'false'}
                aria-describedby={validationError ? 'goal-error' : undefined}
              />
              {validationError && (
                <p id="goal-error" className="mt-2 text-sm text-red-600" role="alert">
                  {validationError}
                </p>
              )}
            </div>

            {/* Resume Upload Toggle */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-3 mb-3">
                <input
                  id="resume-toggle"
                  type="checkbox"
                  checked={useResumeUpload}
                  onChange={(e) => {
                    setUseResumeUpload(e.target.checked);
                    if (!e.target.checked) {
                      setResumeFile(null);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="resume-toggle" className="text-sm font-medium text-gray-700">
                  Upload resume for AI-powered roadmap generation
                </label>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Upload your resume to get a personalized learning roadmap based on your current skills and experience.
              </p>
              
              {useResumeUpload && (
                <div>
                  <label htmlFor="resume-file" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Resume (PDF)
                  </label>
                  <input
                    id="resume-file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setResumeFile(e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    disabled={isSubmitting}
                  />
                  {resumeFile && (
                    <p className="mt-2 text-sm text-green-600">
                      ✓ {resumeFile.name} selected
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || !newGoal.trim()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold
                       hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
            >
              {isSubmitting ? 'Adding Goal...' : 'Add Goal'}
            </button>
          </form>
        </div>

        {/* Goals List or Empty State */}
        {goals.length === 0 ? (
          <div className="text-center py-16">
            {/* Empty State Illustration */}
            <div className="mb-8">
              <svg className="w-32 h-32 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-600 mb-4">No goals yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Start your learning journey by adding your first goal above. Define what you want to achieve and we'll help you get there!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-800">Your Goals</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="bg-white rounded-xl shadow-lg p-6 relative group
                           hover:shadow-xl hover:scale-105 transition-all duration-200
                           border-2 border-transparent hover:border-blue-200"
                >
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete the goal "${goal.goal}"?`)) {
                        onDeleteGoal(goal.id);
                      }
                    }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                             bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-full
                             focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                    aria-label={`Delete goal: ${goal.goal}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  {/* Goal Content - Clickable */}
                  <div
                    onClick={() => onGoalSelect(goal)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start space-x-4">
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
                            stroke="#0052CC"
                            strokeWidth="3"
                            strokeDasharray={`${goal.completed_steps ? Math.round((goal.completed_steps.length / (goal.roadmap?.length || 1)) * 100) : 0}, 100`}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-800">
                            {goal.completed_steps ? Math.round((goal.completed_steps.length / (goal.roadmap?.length || 1)) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <h4 className="font-semibold text-gray-800 truncate">{goal.goal}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Created {new Date(goal.updated_at).toLocaleDateString()}
                        </p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {goal.completed_steps?.length || 0} of {goal.roadmap?.length || 0} steps completed
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsPage;

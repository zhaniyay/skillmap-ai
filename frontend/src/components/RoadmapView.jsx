import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

const RoadmapView = ({ result, onToggleStep, goal }) => {
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    coreSkills: true,
    interview: true,
    tips: true,
    learning: true
  });

  // Parse roadmap into structured sections
  const coreSkills = [
    'Version Control (Git)',
    'Test-Driven Development (TDD)',
    'Continuous Integration/Continuous Deployment (CI/CD)',
    'Agile Methodologies',
    'Cloud Computing Services'
  ];

  const interviewPrep = [
    'Data Structures and Algorithms',
    'Problem-Solving Skills'
  ];

  const additionalTips = [
    'Quantify Results',
    'Tailor to ATS Systems',
    'Formatting Best Practices',
    'Include Relevant Projects'
  ];

  // Calculate total steps for completion check
  const totalSteps = coreSkills.length + interviewPrep.length + additionalTips.length;
  const completedSteps = result?.completed_steps?.length || 0;
  const allStepsCompleted = completedSteps === totalSteps && totalSteps > 0;

  // Trigger confetti when all steps are completed
  useEffect(() => {
    if (allStepsCompleted) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      toast.success('Well done! 🎉', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#0052CC',
          color: 'white',
          fontWeight: '600',
        },
      });
    }
  }, [allStepsCompleted]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your roadmap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <div className="max-w-6xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Skills to Learn</h1>
          <p className="text-lg text-gray-700">Your personalized learning roadmap for: <span className="font-semibold text-blue-600">{goal}</span></p>
        </div>

        <div className="space-y-6">
          {/* Overview Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div 
              className="flex items-center justify-between p-6 cursor-pointer"
              onClick={() => toggleSection('overview')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📋</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Overview</h2>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                  expandedSections.overview ? 'rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {expandedSections.overview && (
              <div className="px-6 pb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <p className="text-gray-700 leading-relaxed">
                    A great CV for a Software Engineering (SWE) intern role highlights a strong foundation in programming languages, 
                    demonstrates experience with relevant software tools, and showcases a track record of problem-solving and project work.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Core Skills to Master */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div 
              className="flex items-center justify-between p-6 cursor-pointer"
              onClick={() => toggleSection('coreSkills')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">⚙️</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Core Skills to Master</h2>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                  expandedSections.coreSkills ? 'rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {expandedSections.coreSkills && (
              <div className="px-6 pb-6">
                <div className="space-y-3">
                  {coreSkills.map((skill, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                      <input
                        type="checkbox"
                        id={`core-${index}`}
                        checked={result.completed_steps?.includes(index) || false}
                        onChange={() => onToggleStep(index)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        style={{ accentColor: '#0056b3' }}
                      />
                      <label 
                        htmlFor={`core-${index}`} 
                        className={`flex-1 cursor-pointer transition-colors duration-200 ${
                          result.completed_steps?.includes(index) 
                            ? 'text-gray-500 line-through' 
                            : 'text-gray-800'
                        }`}
                      >
                        {skill}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interview Preparation */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div 
              className="flex items-center justify-between p-6 cursor-pointer"
              onClick={() => toggleSection('interview')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">✅</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Interview Preparation</h2>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                  expandedSections.interview ? 'rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {expandedSections.interview && (
              <div className="px-6 pb-6">
                <div className="space-y-3">
                  {interviewPrep.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                      <input
                        type="checkbox"
                        id={`interview-${index}`}
                        checked={result.completed_steps?.includes(coreSkills.length + index) || false}
                        onChange={() => onToggleStep(coreSkills.length + index)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        style={{ accentColor: '#0056b3' }}
                      />
                      <label 
                        htmlFor={`interview-${index}`} 
                        className={`flex-1 cursor-pointer transition-colors duration-200 ${
                          result.completed_steps?.includes(coreSkills.length + index) 
                            ? 'text-gray-500 line-through' 
                            : 'text-gray-800'
                        }`}
                      >
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Additional CV Tips */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div 
              className="flex items-center justify-between p-6 cursor-pointer"
              onClick={() => toggleSection('tips')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">💡</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Additional Tips</h2>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                  expandedSections.tips ? 'rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {expandedSections.tips && (
              <div className="px-6 pb-6">
                <div className="space-y-3">
                  {additionalTips.map((tip, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                      <input
                        type="checkbox"
                        id={`tip-${index}`}
                        checked={result.completed_steps?.includes(coreSkills.length + interviewPrep.length + index) || false}
                        onChange={() => onToggleStep(coreSkills.length + interviewPrep.length + index)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        style={{ accentColor: '#0056b3' }}
                      />
                      <label 
                        htmlFor={`tip-${index}`} 
                        className={`flex-1 cursor-pointer transition-colors duration-200 ${
                          result.completed_steps?.includes(coreSkills.length + interviewPrep.length + index) 
                            ? 'text-gray-500 line-through' 
                            : 'text-gray-800'
                        }`}
                      >
                        {tip}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Continuous Learning */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div 
              className="flex items-center justify-between p-6 cursor-pointer"
              onClick={() => toggleSection('learning')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">🔄</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Continuous Learning</h2>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                  expandedSections.learning ? 'rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {expandedSections.learning && (
              <div className="px-6 pb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <p className="text-gray-700 leading-relaxed">
                    Keep your skills sharp: add online courses, meetups, and books here. 
                    Consider platforms like Coursera, Udemy, or attending local tech meetups to stay current with industry trends.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapView;

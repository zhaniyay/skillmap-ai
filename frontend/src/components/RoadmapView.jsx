import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { FiChevronDown, FiChevronUp, FiCheckCircle, FiAlertCircle, FiInfo, FiAward } from 'react-icons/fi';

const RoadmapView = ({ result, onToggleStep, goal }) => {
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    skillGaps: true,
    learningPath: true,
    cvTips: true
  });

  // Debug log the received props
  useEffect(() => {
    console.log('\n=== ROADMAPVIEW DEBUG START ===');
    console.log('🔍 RoadmapView Mounted with:', { 
      hasResult: !!result, 
      resultKeys: result ? Object.keys(result) : 'no result',
      goal,
      resultType: typeof result
    });
    
    if (result) {
      console.log('📊 Full Result Object:', result);
      console.log('📊 Roadmap Data Structure:', {
        cv_assessment: result.cv_assessment,
        cv_assessment_type: typeof result.cv_assessment,
        cv_assessment_length: result.cv_assessment?.length,
        skill_gaps: result.skill_gaps,
        skill_gaps_type: typeof result.skill_gaps,
        skill_gaps_length: result.skill_gaps?.length,
        learning_path: result.learning_path,
        learning_path_type: typeof result.learning_path,
        learning_path_length: result.learning_path?.length,
        cv_tips: result.cv_tips,
        cv_tips_type: typeof result.cv_tips,
        cv_tips_length: result.cv_tips?.length,
        completed_steps: result.completed_steps,
        completed_steps_type: typeof result.completed_steps,
        completed_steps_length: result.completed_steps?.length
      });
    } else {
      console.log('⚠️ RoadmapView: No result data received!');
    }
    console.log('=== ROADMAPVIEW DEBUG END ===\n');
  }, [result, goal]);
  
  // Extract different sections from the roadmap with fallbacks
  const roadmapSections = {
    // CV Overview - handle both string and object formats
    overview: result?.cv_assessment ? [
      { 
        text: typeof result.cv_assessment === 'string' 
          ? result.cv_assessment 
          : result.cv_assessment.text || 'No CV assessment available',
        type: 'overview' 
      }
    ] : [],
    
    // Skill Gaps - handle both array of strings and array of objects
    skillGaps: result?.skill_gaps?.length ? result.skill_gaps.map(gap => ({
      text: typeof gap === 'string' ? gap : gap.text || 'Skill gap',
      type: 'skillGap'
    })) : [],
    
    // Learning Path - handle both array of strings and array of objects
    learningPath: result?.learning_path?.length ? result.learning_path.map((step, index) => ({
      text: typeof step === 'string' ? step : step.text || `Step ${index + 1}`,
      type: 'learning'
    })) : [],
    
    // CV Tips - handle both array of strings and array of objects
    cvTips: result?.cv_tips?.length ? result.cv_tips.map((tip, index) => ({
      text: typeof tip === 'string' ? tip : tip.text || `Tip ${index + 1}`,
      type: 'tip'
    })) : []
  };
  
  // Only learning path steps are trackable/checkable for progress
  const trackableSteps = React.useMemo(() => {
    try {
      return [
        ...(roadmapSections.learningPath || [])
      ];
    } catch (error) {
      console.error('Error processing trackable steps:', error);
      return [];
    }
  }, [roadmapSections]);
  
  // All steps for display purposes (but only learning path is trackable)
  const allDisplaySteps = React.useMemo(() => {
    try {
      return [
        ...(roadmapSections.overview || []),
        ...(roadmapSections.skillGaps || []),
        ...(roadmapSections.learningPath || []),
        ...(roadmapSections.cvTips || [])
      ];
    } catch (error) {
      console.error('Error processing display steps:', error);
      return [];
    }
  }, [roadmapSections]);
  
  const totalTrackableSteps = trackableSteps.length;
  const completedStepIndices = Array.isArray(result?.completed_steps) 
    ? result.completed_steps 
    : [];
  const completedSteps = completedStepIndices.length;
  const allLearningPathCompleted = totalTrackableSteps > 0 && completedSteps === totalTrackableSteps;
  
  // Debug log the processed data
  console.log('📊 Processed Roadmap Data:', {
    totalTrackableSteps,
    totalDisplaySteps: allDisplaySteps.length,
    completedSteps,
    completedStepIndices,
    allLearningPathCompleted,
    sectionCounts: {
      overview: roadmapSections.overview?.length,
      skillGaps: roadmapSections.skillGaps?.length,
      learningPath: roadmapSections.learningPath?.length,
      cvTips: roadmapSections.cvTips?.length
    }
  });
  
  console.log('📊 Progress:', { totalTrackableSteps, completedSteps, completedStepIndices }); // Debug log

  // Celebration effect when all learning path steps are completed
  useEffect(() => {
    if (allLearningPathCompleted && totalTrackableSteps > 0) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Show success toast
      toast.success('🎉 Congratulations! You\'ve completed your learning path!', {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#10B981',
          color: 'white',
          fontWeight: '600',
        },
      });
    }
  }, [allLearningPathCompleted, totalTrackableSteps]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header with Progress Circle */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{goal}</h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {completedSteps} of {totalTrackableSteps} learning steps completed
              </div>
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeDasharray={`${totalTrackableSteps > 0 ? (completedSteps / totalTrackableSteps) * 100 : 0}, 100`}
                    className="transition-all duration-300 ease-in-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">
                    {totalTrackableSteps > 0 ? Math.round((completedSteps / totalTrackableSteps) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {goal || 'Your Learning Path'}
          </h1>
          <p className="text-gray-600">
            Track your progress through the learning roadmap
          </p>
        </div>

        {/* Roadmap Sections */}
        <div className="space-y-8">
          {/* CV Overview Section */}
          {roadmapSections.overview.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div 
                className="flex items-center justify-between p-6 cursor-pointer"
                onClick={() => setExpandedSections(prev => ({ ...prev, overview: !prev.overview }))}
              >
                <h2 className="text-xl font-semibold text-gray-800">CV Overview</h2>
                {expandedSections.overview ? <FiChevronUp /> : <FiChevronDown />}
              </div>
              {expandedSections.overview && (
                <div className="p-6 bg-gray-50">
                  <div className="bg-white rounded-lg p-6 border-l-4 border-blue-400 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiInfo className="text-blue-600 text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 font-medium leading-relaxed">
                          {roadmapSections.overview[0]?.text || 'No CV assessment available'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <FiInfo className="inline mr-2" />
                      This assessment provides an overview of your current CV strengths and areas for improvement.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skill Gaps Section - Display as Headboxes */}
          {roadmapSections.skillGaps.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div 
                className="flex items-center justify-between p-6 cursor-pointer bg-gradient-to-r from-orange-50 to-red-50"
                onClick={() => setExpandedSections(prev => ({ ...prev, skillGaps: !prev.skillGaps }))}
              >
                <div className="flex items-center space-x-3">
                  <FiAlertCircle className="text-orange-600 text-xl" />
                  <h2 className="text-xl font-semibold text-gray-800">Skills to Develop</h2>
                </div>
                {expandedSections.skillGaps ? <FiChevronUp className="text-orange-600" /> : <FiChevronDown className="text-orange-600" />}
              </div>
              {expandedSections.skillGaps && (
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roadmapSections.skillGaps.map((skill, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white rounded-lg p-4 border-l-4 border-orange-400 shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-semibold text-sm">{idx + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-800 font-medium leading-relaxed">{skill.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-700">
                      <FiInfo className="inline mr-2" />
                      These are skills identified as gaps in your current profile. Focus on developing these to strengthen your candidacy.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Learning Path Section */}
          {roadmapSections.learningPath.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div 
                className="flex items-center justify-between p-6 cursor-pointer"
                onClick={() => setExpandedSections(prev => ({ ...prev, learningPath: !prev.learningPath }))}
              >
                <h2 className="text-xl font-semibold text-gray-800">Learning Path</h2>
                {expandedSections.learningPath ? <FiChevronUp /> : <FiChevronDown />}
              </div>
              {expandedSections.learningPath && (
                <div className="px-6 pb-6">
                  {roadmapSections.learningPath.map((item, idx) => {
                    // Only learning path steps are trackable, so use direct index
                    const stepIndex = idx;
                    return (
                      <div key={idx} className="mb-4">
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={completedStepIndices.includes(stepIndex)}
                            onChange={() => onToggleStep(stepIndex)}
                            className="mt-1.5 h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <div className="ml-3 flex-1">
                            <p className="text-gray-800 font-medium leading-relaxed">{item.text}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CV Tips Section */}
          {roadmapSections.cvTips.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div 
                className="flex items-center justify-between p-6 cursor-pointer"
                onClick={() => setExpandedSections(prev => ({ ...prev, cvTips: !prev.cvTips }))}
              >
                <h2 className="text-xl font-semibold text-gray-800">CV Enhancement Tips</h2>
                {expandedSections.cvTips ? <FiChevronUp /> : <FiChevronDown />}
              </div>
              {expandedSections.cvTips && (
                <div className="p-6 bg-gray-50">
                  <div className="space-y-4">
                    {roadmapSections.cvTips.map((tip, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white rounded-lg p-4 border-l-4 border-green-400 shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <FiAward className="text-green-600 text-sm" />
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-800 font-medium leading-relaxed">{tip.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700">
                      <FiInfo className="inline mr-2" />
                      Apply these tips to enhance your CV and make it more appealing to employers.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Completion Celebration */}
        {allLearningPathCompleted && (
          <div className="text-center py-12">
            <div className="inline-block p-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl shadow-2xl">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-white mb-2">Congratulations!</h3>
              <p className="text-green-100">You've completed your learning path!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadmapView;

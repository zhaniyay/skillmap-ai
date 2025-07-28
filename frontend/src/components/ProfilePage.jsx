import React from 'react';
import HeroBanner from './HeroBanner';

const ProfilePage = ({ username, goals }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero Banner */}
        <HeroBanner username={username} />
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{goals.length}</div>
            <div className="text-gray-600 font-medium">Active Goals</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {goals.reduce((total, goal) => total + (goal.completed_steps?.length || 0), 0)}
            </div>
            <div className="text-gray-600 font-medium">Steps Completed</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {goals.length > 0 ? Math.round(
                goals.reduce((total, goal) => 
                  total + (goal.completed_steps?.length || 0) / (goal.roadmap?.length || 1), 0
                ) / goals.length * 100
              ) : 0}%
            </div>
            <div className="text-gray-600 font-medium">Average Progress</div>
          </div>
        </div>

        {/* Recent Goals */}
        {goals.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Goals</h2>
            <div className="space-y-4">
              {goals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="relative">
                    <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
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
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-800">
                        {goal.completed_steps ? Math.round((goal.completed_steps.length / (goal.roadmap?.length || 1)) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{goal.goal}</h3>
                    <p className="text-sm text-gray-500">
                      {goal.completed_steps?.length || 0} of {goal.roadmap?.length || 0} steps completed
                    </p>
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

export default ProfilePage;

import React from 'react';
import { useNavigate } from 'react-router-dom';

const HeroBanner = ({ username }) => {
  const navigate = useNavigate();

  const handleYesClick = () => {
    navigate('/goals');
  };

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 px-6 rounded-2xl shadow-xl mb-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Hero Text */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Hello, {username}!
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 font-medium">
              Ready to learn?
            </p>
          </div>
          
          {/* CTA Button */}
          <div className="flex justify-center lg:justify-end">
            <button
              onClick={handleYesClick}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg 
                       hover:bg-blue-50 hover:shadow-lg transform hover:scale-105 
                       focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50
                       transition-all duration-200 ease-in-out"
              aria-label="Start learning journey"
            >
              Yes, let's go!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;

import React from 'react';
import { useApp } from '../context/AppContext';

const DebugInfo = () => {
  const { goals, selectedGoalId, result, goal } = useApp();

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <h4>🐛 Debug Info</h4>
      <div><strong>Goals Count:</strong> {goals?.length || 0}</div>
      <div><strong>Selected Goal ID:</strong> {selectedGoalId || 'none'}</div>
      <div><strong>Current Goal:</strong> {goal || 'none'}</div>
      <div><strong>Has Result:</strong> {result ? 'Yes' : 'No'}</div>
      {result && (
        <div>
          <div><strong>CV Assessment:</strong> {result.cv_assessment ? 'Yes' : 'No'}</div>
          <div><strong>Skill Gaps:</strong> {result.skill_gaps?.length || 0}</div>
          <div><strong>Learning Path:</strong> {result.learning_path?.length || 0}</div>
          <div><strong>CV Tips:</strong> {result.cv_tips?.length || 0}</div>
        </div>
      )}
    </div>
  );
};

export default DebugInfo;

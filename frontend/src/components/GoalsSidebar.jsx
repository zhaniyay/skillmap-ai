import React, { useEffect, useState } from 'react';
import API from '../api';

export default function GoalsSidebar({ onGoalSelect }) {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');
  // Read token from localStorage on each render
  const token = localStorage.getItem('token');

  // Fetch goals when token changes
  useEffect(() => {
    if (!token) {
      setGoals([]);
      return;
    }
    const fetchGoals = async () => {
      try {
        const { data } = await API.get('/goals');
        setGoals(data);
      } catch (err) {
        setGoals([]);
      }
    };
    fetchGoals();
  }, [token]);

  // Create a new goal and refetch goals
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    try {
      await API.post('/goals', { title: newGoal });
      setNewGoal('');
      // Refetch goals after creating
      const { data } = await API.get('/goals');
      setGoals(data);
    } catch (err) {
      // handle error
    }
  };

  return (
    <aside>
      <h2>Your Goals</h2>
      <form onSubmit={handleCreateGoal} style={{ marginBottom: 12 }}>
        <input
          value={newGoal}
          onChange={e => setNewGoal(e.target.value)}
          placeholder="New goal"
        />
        <button type="submit">Add</button>
      </form>
      <ul>
        {goals.map(goal => (
          <li key={goal.id}>
            <button onClick={() => onGoalSelect(goal)}>{goal.title}</button>
          </li>
        ))}
      </ul>
    </aside>
  );
} 
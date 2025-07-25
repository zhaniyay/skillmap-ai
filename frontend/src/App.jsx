// src/App.jsx
import { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import { uploadResume, getProgress, saveProgress, getAllProgress, deleteProgress, renameProgress, toggleStep } from './api';

export default function App() {
  // Robust token state management
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [goal, setGoal] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({});
  const [error, setError] = useState(null);
  const [goals, setGoals] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingGoalValue, setEditingGoalValue] = useState('');

  // Listen for token changes in localStorage (e.g., from other tabs)
  useEffect(() => {
    const onStorage = () => {
      const t = localStorage.getItem('token');
      setToken(t);
      console.log('Token changed (storage event):', t);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // On app startup, fetch all progress entries and pre-fill state
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data: allProgress } = await getAllProgress();
        setGoals(allProgress);
        if (allProgress.length > 0) {
          setSelectedGoalId(allProgress[0].id);
          setGoal(allProgress[0].goal || '');
          setResult({
            extracted_skills: allProgress[0].skills || [],
            roadmap: (allProgress[0].roadmap || []).join('\n'),
            recommended_courses: []
          });
        }
      } catch (err) {
        if (err.response && err.response.status !== 404) {
          setError('Ошибка при загрузке прогресса. Проверьте консоль.');
        }
      }
    })();
  }, [token]);

  // When a goal is selected, update the main display
  useEffect(() => {
    if (!selectedGoalId || !goals.length) return;
    const entry = goals.find(g => g.id === selectedGoalId);
    if (entry) {
      setGoal(entry.goal || '');
      setResult({
        extracted_skills: entry.skills || [],
        roadmap: (entry.roadmap || []).join('\n'),
        recommended_courses: []
      });
    }
  }, [selectedGoalId]);

  // Debug logging for state
  useEffect(() => {
    console.log('Token:', token);
    console.log('Goal:', goal);
    console.log('File:', file);
    console.log('Result:', result);
    console.log('Progress:', progress);
  }, [token, goal, file, result, progress]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setResult(null);
    setGoal('');
    setFile(null);
    setProgress({});
    setError(null);
  };

  // Handle resume upload + roadmap generation
  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await uploadResume(file, goal);
      setResult(data);
      await saveProgress(goal, data.extracted_skills, data.roadmap.split('\n').map(s => s.trim()).filter(Boolean));
      // Fetch all progress and update goals bar
      const { data: allProgress } = await getAllProgress();
      setGoals(allProgress);
      // Select the most recent goal
      if (allProgress.length > 0) {
        setSelectedGoalId(allProgress[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Ошибка при запросе. Проверьте консоль.');
    } finally {
      setLoading(false);
    }
  };

  // Remove toggleStep and patchProgress logic

  // Delete a goal
  const handleDeleteGoal = async (id) => {
    await deleteProgress(id);
    const { data: allProgress } = await getAllProgress();
    setGoals(allProgress);
    if (allProgress.length > 0) {
      setSelectedGoalId(allProgress[0].id);
    } else {
      setSelectedGoalId(null);
      setGoal('');
      setResult(null);
    }
  };

  // Start editing a goal
  const handleEditGoal = (id, currentValue) => {
    setEditingGoalId(id);
    setEditingGoalValue(currentValue);
  };

  // Save renamed goal
  const handleRenameGoal = async (id) => {
    if (editingGoalValue.trim()) {
      await renameProgress(id, editingGoalValue.trim());
      const { data: allProgress } = await getAllProgress();
      setGoals(allProgress);
      setEditingGoalId(null);
    }
  };

  // Toggle one roadmap step’s done/undone
  const handleToggleStep = async (stepIdx) => {
    if (!selectedGoalId) return;
    await toggleStep(selectedGoalId, stepIdx, !(result.completed_steps || []).includes(stepIdx));
    // Fetch the latest progress for this goal
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
  };

  // Show AuthForm if not logged in
  if (!token) {
    return (
      <AuthForm
        onLogin={() => {
          const t = localStorage.getItem('token');
          setToken(t);
          setResult(null);
          setGoal('');
          setFile(null);
          setProgress({});
          setError(null);
          console.log('Logged in, token:', t);
        }}
      />
    );
  }

  // Fallback UI for error or blank state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Вернуться к авторизации
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex py-10">
      {/* Goals sidebar */}
      <div className="w-64 bg-white shadow rounded-lg p-4 mr-8">
        <h3 className="text-lg font-semibold mb-4">Ваши цели</h3>
        <ul>
          {goals.map(g => (
            <li key={g.id} className="flex items-center mb-2">
              {editingGoalId === g.id ? (
                <input
                  className="border rounded px-1 py-0.5 mr-2 flex-1"
                  value={editingGoalValue}
                  autoFocus
                  onChange={e => setEditingGoalValue(e.target.value)}
                  onBlur={() => handleRenameGoal(g.id)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRenameGoal(g.id); }}
                />
              ) : (
                <button
                  className={`flex-1 text-left px-2 py-1 rounded ${selectedGoalId === g.id ? 'bg-blue-100 font-bold' : 'hover:bg-gray-100'}`}
                  onClick={() => setSelectedGoalId(g.id)}
                >
                  {g.goal}
                </button>
              )}
              <span className="text-xs text-gray-400 ml-2">{new Date(g.updated_at).toLocaleString()}</span>
              <button
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Переименовать"
                onClick={() => handleEditGoal(g.id, g.goal)}
              >✏️</button>
              <button
                className="ml-1 text-red-500 hover:text-red-700"
                title="Удалить"
                onClick={() => handleDeleteGoal(g.id)}
              >🗑️</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="w-full max-w-3xl space-y-8">
        {/* Logout Button */}
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Log out
          </button>
        </div>
        {/* Header + Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-6">SkillMap AI Agent</h1>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Цель:</label>
            <input
              type="text"
              placeholder="e.g. ML Engineer at Meta"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Резюме (PDF):</label>
            <input
              type="file"
              accept=".pdf"
              onChange={e => setFile(e.target.files[0])}
              className="block"
            />
          </div>
          <button
            onClick={onSubmit}
            disabled={!goal || !file || loading}
            className={`px-6 py-2 rounded text-white ${
              loading || !goal || !file
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Загружаем…' : 'Сгенерировать'}
          </button>
        </div>

        {result && result.extracted_skills && (
          <>
            {/* Extracted Skills */}
            <section className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Извлечённые скиллы</h2>
              <ul className="list-disc list-inside space-y-1">
                {result.extracted_skills.map(skill => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </section>

            {/* Roadmap with Progress */}
            {result.roadmap && (
              <section className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Roadmap</h2>
                <ol className="list-decimal list-inside space-y-2">
                  {result.roadmap
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line)
                    .map((step, idx) => {
                      const done = (result.completed_steps || []).includes(idx);
                      console.log('Rendering step', idx, step, 'done:', done, 'completed_steps:', result.completed_steps);
                      return (
                        <li key={idx} className="flex items-start">
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => handleToggleStep(idx)}
                            style={{
                              accentColor: done ? '#22c55e' : '#2563eb', // green if done, blue if not
                              background: '#fff',
                              border: '1px solid #888',
                              width: '1.2em',
                              height: '1.2em',
                            }}
                          />
                          <span className={done ? 'line-through text-gray-400' : ''}>
                            {step.replace(/^\d+\.\s*/, '')}
                          </span>
                        </li>
                      );
                    })}
                </ol>
              </section>
            )}

            {/* Recommended Courses */}
            {result.recommended_courses && (
              <section className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Рекомендуемые курсы</h2>
                <ul className="list-disc list-inside space-y-2">
                  {result.recommended_courses.map(course => (
                    <li key={course.url}>
                      <a
                        href={course.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {course.title}
                      </a>
                      <p className="text-gray-700 ml-6">{course.desc}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

      </div>
    </div>
  );
}

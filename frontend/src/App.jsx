// src/App.jsx
import { useState } from 'react';
import AuthForm from './components/AuthForm';
import { uploadResume, getProgress, patchProgress } from './api';

export default function App() {
  // Track whether the user is authenticated by presence of a token
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Once logged in, we show the main UI
  if (!token) {
    return (
      <AuthForm
        onLogin={() => {
          setToken(localStorage.getItem('token'));
          window.location.reload(); // reload so that interceptor picks up the new token
        }}
      />
    );
  }

  // Main app state
  const [goal, setGoal] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({});

  // Handle resume upload + roadmap generation
  const onSubmit = async () => {
    setLoading(true);
    try {
      // 1) upload resume & get AI result
      const { data } = await uploadResume(file, goal);
      setResult(data);

      // 2) fetch saved progress for this user
      const resp = await getProgress();
      const progMap = resp.data.reduce(
        (acc, p) => ({ ...acc, [p.step]: p.done }),
        {}
      );
      setProgress(progMap);
    } catch (err) {
      console.error(err);
      alert('Ошибка при запросе. Проверьте консоль.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle one roadmap step’s done/undone
  const toggleStep = async (step) => {
    const done = !progress[step];
    try {
      await patchProgress(step, done);
      setProgress(prev => ({ ...prev, [step]: done }));
    } catch (err) {
      console.error('Could not update progress:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10">
      <div className="w-full max-w-3xl space-y-8">

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

        {result && (
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
            <section className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Roadmap</h2>
              <ol className="list-decimal list-inside space-y-2">
                {result.roadmap
                  .split('\n')
                  .map(line => line.trim())
                  .filter(line => line)
                  .map(step => {
                    const done = !!progress[step];
                    return (
                      <li key={step} className="flex items-start">
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggleStep(step)}
                          className="mt-1 mr-3"
                        />
                        <span className={done ? 'line-through text-gray-400' : ''}>
                          {step.replace(/^\d+\.\s*/, '')}
                        </span>
                      </li>
                    );
                  })}
              </ol>
            </section>

            {/* Recommended Courses */}
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
          </>
        )}

      </div>
    </div>
  );
}

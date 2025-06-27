import React, { useState } from 'react';

function App() {
  const [text, setText] = useState('');
  const [goal, setGoal] = useState('');
  const [result, setResult] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRoadmap(null);              // clear any previous roadmap
    try {
      const res = await fetch('http://127.0.0.1:8000/extract_skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, goal }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ error: 'Failed to fetch skills.' });
    }
    setLoading(false);
  };

  const generateRoadmap = async () => {
    if (!result?.skills) return;
    setLoadingRoadmap(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/generate_roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: result.skills, goal }),
      });
      const data = await res.json();
      setRoadmap(data.weeks);
    } catch (err) {
      console.error(err);
      setRoadmap([{ title: 'Error', topics: [err.message], resources: [] }]);
    }
    setLoadingRoadmap(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h1>SkillMap AI</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Resume / Profile Text</label>
          <textarea
            rows={5}
            style={{ width: '100%' }}
            value={text}
            onChange={e => setText(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: '1rem' }}>
          <label>Career Goal</label>
          <input
            type="text"
            style={{ width: '100%' }}
            value={goal}
            onChange={e => setGoal(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Analyzing…' : 'Analyze Skills'}
        </button>
      </form>

      {result && !result.error && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Extracted Skills</h2>
          <ul>{result.skills.map(s => <li key={s}>{s}</li>)}</ul>
          <h2>Skills to Learn</h2>
          <ul>{result.needed.map(n => <li key={n}>{n}</li>)}</ul>

          {/* Roadmap button */}
          {!roadmap && (
            <button
              onClick={generateRoadmap}
              disabled={loadingRoadmap}
              style={{ marginTop: '1.5rem' }}
            >
              {loadingRoadmap ? 'Generating Roadmap…' : 'Generate Learning Roadmap'}
            </button>
          )}
        </div>
      )}

      {result?.error && (
        <div style={{ marginTop: '2rem' }}>
          <p style={{ color: 'red' }}>{result.error}</p>
        </div>
      )}

      {roadmap && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Learning Roadmap</h2>
          {roadmap.map((wk) => (
            <div
              key={wk.title}
              style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '1rem',
                marginBottom: '1rem'
              }}
            >
              <h3 style={{ margin: 0 }}>{wk.title}</h3>
              <ul style={{ margin: '0.5rem 0' }}>
                {wk.topics.map((topic) => <li key={topic}>{topic}</li>)}
              </ul>
              <p style={{ margin: '0.5rem 0 0', fontWeight: 'bold' }}>Resources:</p>
              <ul style={{ margin: '0.25rem 0 0' }}>
                {wk.resources.map((resUrl) => (
                  <li key={resUrl}>
                    <a href={resUrl} target="_blank" rel="noopener noreferrer">
                      {resUrl}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;

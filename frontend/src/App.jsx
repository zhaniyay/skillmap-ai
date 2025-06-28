import React, { useState } from 'react';

function App() {
  const [text, setText] = useState('');
  const [goal, setGoal] = useState('');
  const [result, setResult] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [shareLink, setShareLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setRoadmap(null);
    setShareLink('');

    if (text.trim().length < 30 || goal.trim().length < 3) {
      setResult({ error: 'Please provide a more complete resume and valid career goal.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/extract_skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, goal }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Server error');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ error: err.message });
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

  const saveRoadmap = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/save_roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roadmap }),
      });
      const data = await res.json();
      setShareLink(`${window.location.origin}/shared/${data.id}`);
    } catch (err) {
      console.error('Error saving roadmap:', err);
    }
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
        <div style={{ marginTop: '2rem', color: 'red' }}>
          <p>{result.error}</p>
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
              <h3>{wk.title}</h3>
              <ul>{wk.topics.map(topic => <li key={topic}>{topic}</li>)}</ul>
              <p><strong>Resources:</strong></p>
              <ul>
                {wk.resources.map(res => (
                  <li key={res}>
                    <a href={res} target="_blank" rel="noopener noreferrer">{res}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Save and share button */}
          <button
            onClick={saveRoadmap}
            style={{ marginTop: '1rem' }}
          >
            Save & Generate Shareable Link
          </button>

          {/* Shareable link */}
          {shareLink && (
            <div style={{ marginTop: '1rem' }}>
              <p><strong>Shareable Link:</strong></p>
              <a href={shareLink} target="_blank" rel="noopener noreferrer">{shareLink}</a>
            </div>
          )}
        </div>
      )}

      <footer style={{ textAlign: 'center', marginTop: '3rem', color: '#999' }}>
        Built with ❤️ using FastAPI + React
      </footer>
    </div>
  );
}

export default App;


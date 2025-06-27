import React, { useState } from 'react';

function App() {
  const [text, setText] = useState('');
  const [goal, setGoal] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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

      {result && (
        <div style={{ marginTop: '2rem' }}>
          {result.error ? (
            <p style={{ color: 'red' }}>{result.error}</p>
          ) : (
            <>
              <h2>Extracted Skills</h2>
              <ul>{result.skills.map(s => <li key={s}>{s}</li>)}</ul>
              <h2>Skills to Learn</h2>
              <ul>{result.needed.map(n => <li key={n}>{n}</li>)}</ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

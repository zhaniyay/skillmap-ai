// frontend/src/SharedView.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function SharedView() {
  const { id } = useParams();
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/shared/${id}`);
        if (!res.ok) throw new Error('Roadmap not found');
        const data = await res.json();
        setRoadmap(data.weeks);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchRoadmap();
  }, [id]);

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h1>Shared Roadmap</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {roadmap && roadmap.map((wk) => (
        <div
          key={wk.title}
          style={{
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '1rem',
            marginBottom: '1rem',
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
    </div>
  );
}

export default SharedView;

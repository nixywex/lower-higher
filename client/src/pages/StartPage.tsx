import { useState } from 'react';
import './StartPage.css';
import { useNavigate } from 'react-router-dom';

function StartPage() {
  const navigate = useNavigate();
  const [hardcore, setHardcore] = useState(() => localStorage.getItem('hardcoreMode') === 'true');

  const toggleHardcore = () => {
    const next = !hardcore;
    setHardcore(next);
    localStorage.setItem('hardcoreMode', String(next));
  };

  return (
    <div className="container">
      <div className="bg-shapes">
        <div className="bg-shape s1" />
        <div className="bg-shape s2" />
        <div className="bg-shape s3" />
        <div className="bg-shape s4" />
      </div>
      <div className="card">
        <div className="logo">
          <span className="arrow-up">▲</span>
          <h1 className="logo-title">
            Higher-<span className="highlight">Lower</span>
          </h1>
          <span className="arrow-down">▼</span>
        </div>
        <h2>Willkommen beim Higher-Lower-Spiel!</h2>
        <p className="subtitle">Stelle dein Gespür auf die Probe und erziele die längste Serie.</p>
        <div className="divider" />
        <div className="hardcore-row">
          <div className="hardcore-labels">
            <span className="hardcore-name">Hardcore Mode</span>
            <span className="hardcore-hint">
              Kein Umplatzieren, 60 Sekunden — leere Slots werden zufällig gefüllt.
            </span>
          </div>
          <button
            className={`toggle-btn ${hardcore ? 'active' : ''}`}
            onClick={toggleHardcore}
            aria-pressed={hardcore}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
        <div className="divider" />
        <button className="start-button" onClick={() => navigate('/game')}>
          <span className="btn-icon">👤</span>
          Singleplayer
          <span className="btn-arrow">›</span>
        </button>
        <button
          className="start-button multiplayer-button"
          onClick={() => navigate('/multiplayer')}
        >
          <span className="btn-icon">👥</span>
          Multiplayer
          <span className="btn-arrow">›</span>
        </button>
        <p className="press-start">· Drücke Start, um das Spiel zu starten ·</p>
      </div>
    </div>
  );
}

export default StartPage;

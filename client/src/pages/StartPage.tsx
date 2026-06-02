import './StartPage.css';
import { useNavigate } from 'react-router-dom';

function StartPage() {
  const navigate = useNavigate();

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
        <button className="start-button" onClick={() => navigate('/game')}>
          <span className="btn-icon">👤</span>
          Singleplayer
          <span className="btn-arrow">›</span>
        </button>
        <p className="press-start">· Drücke Start, um das Spiel zu starten ·</p>
      </div>
    </div>
  );
}

export default StartPage;

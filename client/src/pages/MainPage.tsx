import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

interface Fact {
  id: number;
  question: string;
  answer: number;
  unit: string;
}

function MainPage() {
  const navigate = useNavigate();
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [sortedAnswers, setSortedAnswers] = useState<(Fact | null)[]>([]);
  const [dragItem, setDragItem] = useState<Fact | null>(null);
  const dragOverSlot = useRef<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/facts/round')
      .then((res) => res.json())
      .then((data: Fact[]) => {
        setFacts(data);
        setSortedAnswers(new Array(data.length).fill(null));
        setLoading(false);
      });
  }, []);

  const allAnswered = sortedAnswers.every((slot) => slot !== null);

  const handleNextQuestion = () => {
    if (currentIndex >= facts.length - 1) return;
    setSliding(true);
    setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setSliding(false);
    }, 400);
  };

  const handleDragStart = (fact: Fact) => {
    setDragItem(fact);
  };

  const handleDropOnSlot = (slotIndex: number) => {
    if (!dragItem) return;

    const updated = [...sortedAnswers];

    // Remove dragItem from any existing slot
    const existingSlot = updated.findIndex((f) => f?.id === dragItem.id);
    if (existingSlot !== -1) updated[existingSlot] = null;

    // If slot is occupied, swap
    const occupant = updated[slotIndex];
    if (occupant && existingSlot !== -1) {
      updated[existingSlot] = occupant;
    }

    updated[slotIndex] = dragItem;
    setSortedAnswers(updated);
    setDragItem(null);
  };

  const handleDropBackToPool = () => {
    if (!dragItem) return;
    const updated = sortedAnswers.map((f) => (f?.id === dragItem.id ? null : f));
    setSortedAnswers(updated);
    setDragItem(null);
  };

  const placedIds = new Set(sortedAnswers.filter(Boolean).map((f) => f!.id));
  const poolFacts = facts.filter((f) => !placedIds.has(f.id));

  const handleSubmit = () => {
    const ids = sortedAnswers.filter(Boolean).map((f) => f!.id);
    fetch('http://localhost:3000/api/facts/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
      .then((res) => res.json())
      .then((data) => {
        setScore(data.score ?? 1234);
        setShowPopup(true);
      });
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="game-wrapper">
      {/* X Button */}
      <button className="exit-btn" onClick={() => navigate('/')}>
        ✕
      </button>

      {/* Question Stack */}
      <div className="question-stack">
        {facts.slice(currentIndex, currentIndex + 3).map((fact, i) => (
          <div
            key={fact.id}
            className={`question-card ${i === 0 ? (sliding ? 'slide-out' : 'active') : ''}`}
            style={{
              zIndex: 3 - i,
              transform: `translateY(${i * 6}px) scale(${1 - i * 0.03})`,
            }}
          >
            {i === 0 && <p>{fact.question}</p>}
          </div>
        ))}
        <div className="question-counter">
          {currentIndex + 1} / {facts.length}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="game-area">
        {/* Answer Pool */}
        <div
          className="answer-pool"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropBackToPool}
        >
          {poolFacts.map((fact) => (
            <div
              key={fact.id}
              className="answer-chip"
              draggable
              onDragStart={() => handleDragStart(fact)}
            >
              {fact.answer}
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="timeline-area">
          <span className="timeline-label top">max</span>
          <div className="timeline-slots">
            {sortedAnswers.map((slot, i) => (
              <div
                key={i}
                className={`timeline-slot ${slot ? 'filled' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  dragOverSlot.current = i;
                }}
                onDrop={() => handleDropOnSlot(i)}
              >
                {slot ? (
                  <div
                    className="answer-chip placed"
                    draggable
                    onDragStart={() => handleDragStart(slot)}
                  >
                    {slot.answer}
                  </div>
                ) : (
                  <span className="slot-placeholder">—</span>
                )}
              </div>
            ))}
          </div>
          <span className="timeline-label bottom">min</span>
        </div>

        {/* Right Side Buttons */}
        <div className="action-buttons">
          <button
            className="next-btn"
            onClick={handleNextQuestion}
            disabled={currentIndex >= facts.length - 1}
          >
            Next Question
          </button>
          <button className="submit-btn" onClick={handleSubmit} disabled={!allAnswered}>
            Submit
          </button>
        </div>
      </div>
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Ergebnis</h2>
            <p className="popup-score">{score ?? 1234}</p>
            <p className="popup-label">Punkte</p>
            <div className="popup-buttons">
              <button className="popup-btn secondary" onClick={() => navigate('/')}>
                Exit
              </button>
              <button className="popup-btn primary" onClick={() => window.location.reload()}>
                Next Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainPage;

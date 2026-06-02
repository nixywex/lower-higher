import { useEffect, useState } from 'react';
import './MainPage.css';

interface Fact {
  id: number;
  question: string;
  answer: number;
  unit: string;
}

function MainPage() {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/facts/round')
      .then((res) => res.json())
      .then((data) => {
        setFacts(data);
        setLoading(false);
      });
  }, []);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null) return;
    const updated = [...facts];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setFacts(updated);
    setDragIndex(null);
  };

  const handleSubmit = () => {
    const ids = facts.map((f) => f.id);
    fetch('http://localhost:3000/api/facts/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
      .then((res) => res.json())
      .then((data) => console.log(data));
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="game-container">
      <h1 className="game-title">
        Sort from <span>Highest</span> to Lowest
      </h1>
      <div className="facts-list">
        {facts.map((fact, index) => (
          <div
            key={fact.id}
            className="fact-card"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
          >
            <span className="fact-number">{index + 1}</span>
            <p className="fact-question">{fact.question}</p>
          </div>
        ))}
      </div>
      <button className="submit-button" onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
}

export default MainPage;

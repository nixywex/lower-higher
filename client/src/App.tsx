import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StartPage from './pages/StartPage';
import MainPage from './pages/MainPage';
import MultiplayerPage from './pages/MultiplayerPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/game" element={<MainPage />} />
        <Route path="/multiplayer" element={<MultiplayerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

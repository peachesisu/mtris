import { Routes, Route } from 'react-router-dom';
import Game from './components/Game';
import Admin from './components/Admin';

const App: React.FC = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/spectator" element={<Admin />} />
      </Routes>
    </div>
  );
};

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Intro from './pages/Intro';
import Landing from './pages/Landing';
import Predictor from './pages/Predictor';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/predict" element={<Predictor />} />
      </Routes>
    </Router>
  );
};

export default App;

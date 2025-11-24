import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SimpleInterview from './SimpleInterviewNew.jsx';
import ConfigPage from './ConfigPage.jsx';

// Wrapper component to pass navigate function
function SimpleInterviewWrapper() {
  const navigate = useNavigate();
  return <SimpleInterview onNavigateToConfig={() => navigate('/config')} />;
}

function ConfigPageWrapper() {
  const navigate = useNavigate();
  return <ConfigPage onNavigateToInterview={() => navigate('/')} />;
}

function Router() {
  return (
    <BrowserRouter basename="/aiinterview">
      <Routes>
        <Route path="/" element={<SimpleInterviewWrapper />} />
        <Route path="/config" element={<ConfigPageWrapper />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;

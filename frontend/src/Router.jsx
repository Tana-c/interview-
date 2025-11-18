import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import SimpleInterview from './SimpleInterviewNew.jsx';
import ConfigPage from './ConfigPage.jsx';

const InterviewRoute = () => {
  const navigate = useNavigate();
  return <SimpleInterview onNavigateToConfig={() => navigate('/config')} />;
};

const ConfigRoute = () => {
  const navigate = useNavigate();
  return <ConfigPage onNavigateToInterview={() => navigate('/')} />;
};

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InterviewRoute />} />
        <Route path="/config" element={<ConfigRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;

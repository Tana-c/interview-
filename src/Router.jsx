import React, { useState } from 'react';
import SimpleInterview from './SimpleInterviewNew.jsx';
import ConfigPage from './ConfigPage.jsx';

function Router() {
  const [currentPage, setCurrentPage] = useState('interview'); // 'interview' or 'config'

  return (
    <>
      {currentPage === 'interview' && <SimpleInterview onNavigateToConfig={() => setCurrentPage('config')} />}
      {currentPage === 'config' && <ConfigPage onNavigateToInterview={() => setCurrentPage('interview')} />}
    </>
  );
}

export default Router;

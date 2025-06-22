import React from 'react';
import Dashboard from './components/Dashboard';
import LightPollutionChart from './components/LightPollutionChart';
import './App.css';

function App() {
  return (
    <div className="App">
      <Dashboard />
      <div className="dashboard-section">
        <LightPollutionChart />
      </div>
    </div>
  );
}

export default App;

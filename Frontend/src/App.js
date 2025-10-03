// Example for App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AmbulanceTraker from './components/AmbulanceTraker';
import TrafficSignal from './components/TrafficSignal'; // Assuming you have a TrafficSignal component
import HelmetViolation from './components/HelmetViolation';
import ChallanHistory from './components/ChallanHistory';
import Login from './components/Login';
import Signup from './components/Signup';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/ambulance-tracker" element={<AmbulanceTraker />} />
        <Route path="/traffic-signal" element={<TrafficSignal />} />
        <Route path="/helmet-violation" element={<HelmetViolation />} />
        <Route path="/challan-history" element={<ChallanHistory />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
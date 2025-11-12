// Example for App.js
import ProtectedRoute from './components/ProtectedRoute';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AmbulanceTraker from './components/AmbulanceTraker';
import TrafficSignal from './components/TrafficSignal'; // Assuming you have a TrafficSignal component
import HelmetViolation from './components/HelmetViolation';
import ChallanHistory from './components/ChallanHistory';
import Login from './components/Login';
import Signup from './components/Signup';
import PublicRoute from './components/PublicRoute';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import MapView from './components/MapView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={< ProtectedRoute ><Dashboard /> </ProtectedRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password/:id/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/ambulance-tracker" element={<ProtectedRoute><AmbulanceTraker /></ProtectedRoute>} />
        <Route path="/map-view/:id" element={<MapView />} />
        <Route path="/traffic-signal" element={<ProtectedRoute><TrafficSignal /></ProtectedRoute>} />
        <Route path="/helmet-violation" element={<ProtectedRoute><HelmetViolation /></ProtectedRoute>} />
        <Route path="/challan-history" element={<ProtectedRoute><ChallanHistory /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
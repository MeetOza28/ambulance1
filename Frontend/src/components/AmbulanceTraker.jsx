// AmbulanceTracker.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Phone, AlertTriangle, Navigation, Activity } from 'lucide-react';
import '../styles/AmbulanceTraker.css';

const AmbulanceTracker = () => {
    const navigate = useNavigate();
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock ambulance data
  const [ambulances] = useState([
    {
      id: 'AMB001',
      status: 'En Route',
      priority: 'High',
      location: 'Ring Road, Varachha',
      destination: 'Civil Hospital',
      eta: '8 min',
      distance: '3.2 km',
      driver: 'Rajesh Patel',
      patient: 'Emergency Case #1247',
      speed: '45 km/h',
      fuel: '78%',
      lastUpdate: '2 min ago',
      coordinates: { lat: 21.1702, lng: 72.8311 }
    },
    {
      id: 'AMB002',
      status: 'Available',
      priority: 'Normal',
      location: 'Athwa Lines',
      destination: '-',
      eta: '-',
      distance: '-',
      driver: 'Amit Kumar',
      patient: '-',
      speed: '0 km/h',
      fuel: '92%',
      lastUpdate: '1 min ago',
      coordinates: { lat: 21.1594, lng: 72.7847 }
    },
    {
      id: 'AMB003',
      status: 'Emergency',
      priority: 'Critical',
      location: 'Citylight Area',
      destination: 'SMIMER Hospital',
      eta: '12 min',
      distance: '5.8 km',
      driver: 'Priya Shah',
      patient: 'Cardiac Emergency #1251',
      speed: '62 km/h',
      fuel: '65%',
      lastUpdate: 'Just now',
      coordinates: { lat: 21.2180, lng: 72.8339 }
    },
    {
      id: 'AMB004',
      status: 'Returning',
      priority: 'Low',
      location: 'New Civil Hospital',
      destination: 'Base Station',
      eta: '15 min',
      distance: '7.1 km',
      driver: 'Kiran Joshi',
      patient: 'Patient Delivered',
      speed: '35 km/h',
      fuel: '43%',
      lastUpdate: '3 min ago',
      coordinates: { lat: 21.1938, lng: 72.8123 }
    }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case 'Emergency': return 'emergency';
      case 'En Route': return 'en-route';
      case 'Available': return 'available';
      case 'Returning': return 'returning';
      default: return 'available';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'Critical': return 'priority-critical';
      case 'High': return 'priority-high';
      case 'Normal': return 'priority-normal';
      case 'Low': return 'priority-low';
      default: return 'priority-normal';
    }
  };

  const handleBackToDashboard = () => {
    // Navigation logic to go back to dashboard
    console.log('Navigate back to dashboard');
  };

  const handleContactAmbulance = (ambulance) => {
    console.log('Contact ambulance:', ambulance.id);
  };

  const handleTrackLive = (ambulance) => {
    console.log('Track ambulance live:', ambulance.id);
  };

  return (
    <div className="ambulance-tracker">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">SurakshaPath</h1>
          <p className="sidebar-subtitle">Traffic Management System</p>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-item back" onClick={() => navigate('/')}>
            <ArrowLeft className="stat-indicator" />
            <span>Back to Dashboard</span>
          </div>
          <div className="nav-item active" >
            {/* <Activity className="stat-indicator" /> */}
            <span className="nav-icon">📍</span>
            <span>Ambulance Tracker</span>
          </div>
          <div className="nav-item inactive" onClick={() => navigate('/traffic-signal')}>
            {/* <Navigation className="stat-indicator" /> */}
            <span className="nav-icon">⚡</span>
            <span>Traffic Signals</span>
          </div>
          <div className="nav-item inactive" onClick={() => navigate('/helmet-violation')}>
            {/* <AlertTriangle className="stat-indicator" /> */}
            <span className="nav-icon">🛡️</span>
            <span>Helmet Violations</span>
          </div>
          <div className="nav-item" onClick={() => navigate('/challan-history') }>
            <span className="nav-icon">📄</span>
            <span>Challan History</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="last-updated">
            <p>Last Updated</p>
            <p>{currentTime.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Ambulance Tracker</h1>
          <p className="page-subtitle">Real-time ambulance monitoring and dispatch system</p>
        </div>

        

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card emergency">
            <div className="stat-header">
              <Activity className="stat-icon" />
              <AlertTriangle className="stat-indicator" />
            </div>
            <div className="stat-number">2</div>
            <div className="stat-label">Emergency Active</div>
          </div>
          
          <div className="stat-card en-route">
            <div className="stat-header">
              <Navigation className="stat-icon" />
              <ArrowLeft className="stat-indicator" style={{ transform: 'rotate(45deg)' }} />
            </div>
            <div className="stat-number">1</div>
            <div className="stat-label">En Route</div>
          </div>
          
          <div className="stat-card available">
            <div className="stat-header">
              <MapPin className="stat-icon" />
              <div className="pulse-dot"></div>
            </div>
            <div className="stat-number">1</div>
            <div className="stat-label">Available</div>
          </div>
          
          <div className="stat-card average">
            <div className="stat-header">
              <Clock className="stat-icon" />
              <span className="avg-badge">AVG</span>
            </div>
            <div className="stat-number">11.7</div>
            <div className="stat-label">Avg Response (min)</div>
          </div>
        </div>

        {/* Ambulance List */}
        <div className="ambulance-list">
          <div className="list-header">
            <h2 className="list-title">Active Ambulances</h2>
          </div>
          
          <div>
            {ambulances.map((ambulance) => (
              <div 
                key={ambulance.id}
                className={`ambulance-item ${selectedAmbulance?.id === ambulance.id ? 'selected' : ''}`}
                onClick={() => setSelectedAmbulance(ambulance)}
              >
                <div className="ambulance-header">
                  <div className="ambulance-basic-info">
                    <div className={`status-dot ${getStatusClass(ambulance.status)}`}></div>
                    <div>
                      <div className="ambulance-id">{ambulance.id}</div>
                      <div className="ambulance-driver">{ambulance.driver}</div>
                    </div>
                  </div>
                  
                  <div className="ambulance-details">
                    <div className="detail-group">
                      <div className="detail-primary">{ambulance.status}</div>
                      <span className={`priority-badge ${getPriorityClass(ambulance.priority)}`}>
                        {ambulance.priority}
                      </span>
                    </div>
                    
                    <div className="detail-group">
                      <div className="detail-primary">{ambulance.location}</div>
                      <div className="detail-secondary">{ambulance.lastUpdate}</div>
                    </div>
                    
                    <div className="detail-group">
                      <div className="detail-primary">{ambulance.eta}</div>
                      <div className="detail-secondary">{ambulance.distance}</div>
                    </div>
                    
                    <div className="detail-group">
                      <div className="detail-primary">{ambulance.speed}</div>
                      <div className="detail-secondary">Fuel: {ambulance.fuel}</div>
                    </div>
                  </div>
                </div>
                
                {ambulance.patient !== '-' && (
                  <div className="patient-info">
                    <p><strong>Patient:</strong> {ambulance.patient}</p>
                    <p><strong>Destination:</strong> {ambulance.destination}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Ambulance Details */}
        {selectedAmbulance && (
          <div className="detailed-view">
            <div className="detailed-header">
              <h2 className="detailed-title">
                {selectedAmbulance.id} - Detailed View
              </h2>
              <div className="action-buttons">
                <button 
                  className="action-btn btn-contact"
                  onClick={() => handleContactAmbulance(selectedAmbulance)}
                >
                  <Phone size={16} />
                  Contact
                </button>
                <button 
                  className="action-btn btn-track"
                  onClick={() => handleTrackLive(selectedAmbulance)}
                >
                  <MapPin size={16} />
                  Track Live
                </button>
              </div>
            </div>
            
            <div className="detailed-content">
              <div className="details-grid">
                <div className="detail-section">
                  <h3>Vehicle Information</h3>
                  <div className="detail-list">
                    <p><strong>ID:</strong> {selectedAmbulance.id}</p>
                    <p><strong>Driver:</strong> {selectedAmbulance.driver}</p>
                    <p>
                      <strong>Status:</strong> 
                      <span className={`status-badge status-${getStatusClass(selectedAmbulance.status)}`}>
                        {selectedAmbulance.status}
                      </span>
                    </p>
                    <p><strong>Speed:</strong> {selectedAmbulance.speed}</p>
                    <p><strong>Fuel Level:</strong> {selectedAmbulance.fuel}</p>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Location Details</h3>
                  <div className="detail-list">
                    <p><strong>Current Location:</strong> {selectedAmbulance.location}</p>
                    <p><strong>Destination:</strong> {selectedAmbulance.destination}</p>
                    <p><strong>Distance:</strong> {selectedAmbulance.distance}</p>
                    <p><strong>ETA:</strong> {selectedAmbulance.eta}</p>
                    <p><strong>Last Updated:</strong> {selectedAmbulance.lastUpdate}</p>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Emergency Details</h3>
                  <div className="detail-list">
                    <p>
                      <strong>Priority:</strong> 
                      <span className={`priority-badge ${getPriorityClass(selectedAmbulance.priority)}`}>
                        {selectedAmbulance.priority}
                      </span>
                    </p>
                    <p><strong>Case:</strong> {selectedAmbulance.patient}</p>
                    <p><strong>Coordinates:</strong> {selectedAmbulance.coordinates.lat}, {selectedAmbulance.coordinates.lng}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmbulanceTracker;
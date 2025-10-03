// TrafficSignals.jsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Activity, 
  Navigation, 
  AlertTriangle, 
  FileText, 
  Zap, 
  RefreshCw, 
  Calendar, 
  BarChart3,
  Settings,
  X,
  Clock,
  MapPin,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/TrafficSignal.css';

const TrafficSignals = () => {
    const navigate = useNavigate();
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock traffic signals data
  const [signals, setSignals] = useState([
    {
      id: 'TS001',
      location: 'Ring Road & VIP Road Junction',
      status: 'Active',
      currentLight: 'green',
      timer: 45,
      maxTimer: 60,
      coordinates: { lat: 21.1702, lng: 72.8311 },
      lastMaintenance: '2024-07-15',
      avgWaitTime: '2.3 min',
      trafficFlow: 'High',
      emergencyOverride: false,
      faultStatus: 'Normal',
      powerStatus: 'Online',
      connectivity: 'Strong'
    },
    {
      id: 'TS002', 
      location: 'Athwa Lines Main Road',
      status: 'Active',
      currentLight: 'red',
      timer: 25,
      maxTimer: 45,
      coordinates: { lat: 21.1594, lng: 72.7847 },
      lastMaintenance: '2024-07-20',
      avgWaitTime: '1.8 min',
      trafficFlow: 'Medium',
      emergencyOverride: false,
      faultStatus: 'Normal',
      powerStatus: 'Online',
      connectivity: 'Strong'
    },
    {
      id: 'TS003',
      location: 'Citylight Area Circle',
      status: 'Maintenance',
      currentLight: 'yellow',
      timer: 0,
      maxTimer: 30,
      coordinates: { lat: 21.2180, lng: 72.8339 },
      lastMaintenance: '2024-07-10',
      avgWaitTime: '4.2 min',
      trafficFlow: 'Low',
      emergencyOverride: false,
      faultStatus: 'Sensor Issue',
      powerStatus: 'Online',
      connectivity: 'Weak'
    },
    {
      id: 'TS004',
      location: 'Dumas Road Junction',
      status: 'Offline',
      currentLight: 'red',
      timer: 0,
      maxTimer: 50,
      coordinates: { lat: 21.1030, lng: 72.6694 },
      lastMaintenance: '2024-07-25',
      avgWaitTime: 'N/A',
      trafficFlow: 'High',
      emergencyOverride: false,
      faultStatus: 'Power Failure',
      powerStatus: 'Offline',
      connectivity: 'None'
    },
    {
      id: 'TS005',
      location: 'Piplod Main Road',
      status: 'Active',
      currentLight: 'yellow',
      timer: 8,
      maxTimer: 15,
      coordinates: { lat: 21.2284, lng: 72.8383 },
      lastMaintenance: '2024-07-22',
      avgWaitTime: '1.5 min',
      trafficFlow: 'Medium',
      emergencyOverride: true,
      faultStatus: 'Normal',
      powerStatus: 'Online',
      connectivity: 'Strong'
    },
    {
      id: 'TS006',
      location: 'Varachha Road Cross',
      status: 'Active',
      currentLight: 'green',
      timer: 35,
      maxTimer: 55,
      coordinates: { lat: 21.1810, lng: 72.8408 },
      lastMaintenance: '2024-07-18',
      avgWaitTime: '2.1 min',
      trafficFlow: 'High',
      emergencyOverride: false,
      faultStatus: 'Normal',
      powerStatus: 'Online',
      connectivity: 'Strong'
    }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Update traffic light timers
      setSignals(prevSignals => 
        prevSignals.map(signal => {
          if (signal.status === 'Active' && signal.timer > 0) {
            let newTimer = signal.timer - 1;
            let newLight = signal.currentLight;
            
            if (newTimer === 0) {
              // Cycle through lights
              switch (signal.currentLight) {
                case 'green':
                  newLight = 'yellow';
                  newTimer = 15;
                  break;
                case 'yellow':
                  newLight = 'red';
                  newTimer = signal.id === 'TS002' ? 45 : 60;
                  break;
                case 'red':
                  newLight = 'green';
                  newTimer = signal.maxTimer;
                  break;
              }
            }
            
            return {
              ...signal,
              timer: newTimer,
              currentLight: newLight
            };
          }
          return signal;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Maintenance': return 'status-maintenance';
      case 'Offline': return 'status-offline';
      default: return 'status-active';
    }
  };

  const handleBackToDashboard = () => {
    console.log('Navigate back to dashboard');
  };

  const handleSignalClick = (signal) => {
    setSelectedSignal(signal);
    setShowModal(true);
  };

  const handleEmergencyOverride = () => {
    console.log('Emergency override activated');
  };

  const handleSyncAll = () => {
    console.log('Syncing all signals');
  };

  const handleScheduleUpdate = () => {
    console.log('Opening schedule update');
  };

  const handleGenerateReport = () => {
    console.log('Generating traffic report');
  };

  const handleOverrideSignal = (signalId) => {
    setSignals(prevSignals =>
      prevSignals.map(signal =>
        signal.id === signalId
          ? { ...signal, emergencyOverride: !signal.emergencyOverride }
          : signal
      )
    );
  };

  const handleResetSignal = (signalId) => {
    setSignals(prevSignals =>
      prevSignals.map(signal =>
        signal.id === signalId
          ? { 
              ...signal, 
              timer: signal.maxTimer,
              currentLight: 'green',
              emergencyOverride: false
            }
          : signal
      )
    );
  };

  const activeSignals = signals.filter(s => s.status === 'Active').length;
  const maintenanceSignals = signals.filter(s => s.status === 'Maintenance').length;
  const offlineSignals = signals.filter(s => s.status === 'Offline').length;

  return (
    <div className="traffic-signals">
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
                    <div className="nav-item inactive" onClick={() => navigate('/ambulance-tracker')}>
                      {/* <Activity className="stat-indicator" /> */}
                      <span className="nav-icon">📍</span>
                      <span>Ambulance Tracker</span>
                    </div>
                    <div className="nav-item active" onClick={() => navigate('/traffic-signal')}>
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
          <h1 className="page-title">Traffic Signals Management</h1>
          <p className="page-subtitle">Real-time traffic signal monitoring and control system</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card total-signals">
            <div className="stat-header">
              <Navigation className="stat-icon" />
              <div className="pulse-dot"></div>
            </div>
            <div className="stat-number">{signals.length}</div>
            <div className="stat-label">Total Signals</div>
          </div>
          
          <div className="stat-card active-signals">
            <div className="stat-header">
              <Wifi className="stat-icon" />
              <div className="pulse-dot"></div>
            </div>
            <div className="stat-number">{activeSignals}</div>
            <div className="stat-label">Active Signals</div>
          </div>
          
          <div className="stat-card maintenance">
            <div className="stat-header">
              <Settings className="stat-icon" />
              <AlertTriangle className="stat-indicator" />
            </div>
            <div className="stat-number">{maintenanceSignals}</div>
            <div className="stat-label">Under Maintenance</div>
          </div>
          
          <div className="stat-card offline">
            <div className="stat-header">
              <WifiOff className="stat-icon" />
              <X className="stat-indicator" />
            </div>
            <div className="stat-number">{offlineSignals}</div>
            <div className="stat-label">Offline Signals</div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="control-panel">
          <div className="control-header">
            <div>
              <h2 className="control-title">System Controls</h2>
              <p className="control-subtitle">Manage traffic signals across the city</p>
            </div>
          </div>
          
          <div className="control-actions">
            <button className="action-btn btn-emergency" onClick={handleEmergencyOverride}>
              <Zap size={16} />
              Emergency Override
            </button>
            <button className="action-btn btn-sync" onClick={handleSyncAll}>
              <RefreshCw size={16} />
              Sync All Signals
            </button>
            <button className="action-btn btn-schedule" onClick={handleScheduleUpdate}>
              <Calendar size={16} />
              Update Schedule
            </button>
            <button className="action-btn btn-report" onClick={handleGenerateReport}>
              <BarChart3 size={16} />
              Generate Report
            </button>
          </div>
        </div>

        {/* Traffic Signals Grid */}
        <div className="signals-container">
          {signals.map((signal) => (
            <div 
              key={signal.id} 
              className={`signal-card ${selectedSignal?.id === signal.id ? 'selected' : ''}`}
              onClick={() => handleSignalClick(signal)}
            >
              <div className="signal-header">
                <div className="signal-title">
                  <span className="signal-id">{signal.id}</span>
                  <span className={`status-badge ${getStatusClass(signal.status)}`}>
                    {signal.status}
                  </span>
                </div>
                <div className="signal-location">{signal.location}</div>
              </div>
              
              <div className="signal-content">
                <div className="traffic-light">
                  <div className="traffic-light-container">
                    <div className={`light red ${signal.currentLight === 'red' ? 'active' : ''}`}></div>
                    <div className={`light yellow ${signal.currentLight === 'yellow' ? 'active' : ''}`}></div>
                    <div className={`light green ${signal.currentLight === 'green' ? 'active' : ''}`}></div>
                  </div>
                </div>
                
                <div className="signal-info">
                  <div className="info-item">
                    <div className="info-label">Current Timer</div>
                    <div className="info-value">
                      {signal.status === 'Active' ? (
                        <span className="timer-display">{signal.timer}s</span>
                      ) : (
                        <span>--</span>
                      )}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Traffic Flow</div>
                    <div className="info-value">{signal.trafficFlow}</div>
                  </div>
                </div>
                
                <div className="signal-controls">
                  <button 
                    className="control-btn btn-override"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOverrideSignal(signal.id);
                    }}
                  >
                    Override
                  </button>
                  <button 
                    className="control-btn btn-reset"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetSignal(signal.id);
                    }}
                  >
                    Reset
                  </button>
                  <button className="control-btn btn-config">
                    Config
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signal Details Modal */}
      {showModal && selectedSignal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedSignal.id} - Signal Details</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-section">
                  <h3>Signal Information</h3>
                  <div className="detail-list">
                    <p><strong>ID:</strong> <span>{selectedSignal.id}</span></p>
                    <p><strong>Location:</strong> <span>{selectedSignal.location}</span></p>
                    <p><strong>Status:</strong> <span>{selectedSignal.status}</span></p>
                    <p><strong>Current Light:</strong> <span style={{textTransform: 'capitalize'}}>{selectedSignal.currentLight}</span></p>
                    <p><strong>Timer:</strong> <span>{selectedSignal.timer}s</span></p>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>System Status</h3>
                  <div className="detail-list">
                    <p><strong>Power:</strong> <span>{selectedSignal.powerStatus}</span></p>
                    <p><strong>Connectivity:</strong> <span>{selectedSignal.connectivity}</span></p>
                    <p><strong>Fault Status:</strong> <span>{selectedSignal.faultStatus}</span></p>
                    <p><strong>Emergency Override:</strong> <span>{selectedSignal.emergencyOverride ? 'Yes' : 'No'}</span></p>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Performance Metrics</h3>
                  <div className="detail-list">
                    <p><strong>Traffic Flow:</strong> <span>{selectedSignal.trafficFlow}</span></p>
                    <p><strong>Avg Wait Time:</strong> <span>{selectedSignal.avgWaitTime}</span></p>
                    <p><strong>Last Maintenance:</strong> <span>{selectedSignal.lastMaintenance}</span></p>
                    <p><strong>Coordinates:</strong> <span>{selectedSignal.coordinates.lat}, {selectedSignal.coordinates.lng}</span></p>
                  </div>
                </div>
              </div>
              
              <div className="control-actions" style={{marginTop: '24px'}}>
                <button 
                  className="action-btn btn-emergency"
                  onClick={() => handleOverrideSignal(selectedSignal.id)}
                >
                  <Zap size={16} />
                  {selectedSignal.emergencyOverride ? 'Disable Override' : 'Enable Override'}
                </button>
                <button 
                  className="action-btn btn-sync"
                  onClick={() => handleResetSignal(selectedSignal.id)}
                >
                  <RefreshCw size={16} />
                  Reset Signal
                </button>
                <button className="action-btn btn-schedule">
                  <Settings size={16} />
                  Configure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficSignals;
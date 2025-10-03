import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="logo">SurakshaPath</h1>
          <p className="subtitle">Traffic Management System</p>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-item active">
            <span className="nav-icon">⊞</span>
            <span>Dashboard</span>
          </div>
          <div className="nav-item" onClick={() => navigate('/ambulance-tracker') }>
            <span className="nav-icon">📍</span>
            <span>Ambulance Tracker</span>
          </div>
          <div className="nav-item" onClick={() => navigate('/traffic-signal') }>
            <span className="nav-icon">⚡</span>
            <span>Traffic Signals</span>
          </div>
          <div className="nav-item" onClick={() => navigate('/helmet-violation') }>
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
        {/* Header */}
        <div className="main-header">
          <div className="header-left">
            <h1>Traffic Control Dashboard</h1>
            <p>Real-time monitoring and management system</p>
          </div>
          <div className="header-right">
            <div className="notification-icon">
              <span>🔔</span>
              <span className="notification-badge">3</span>
            </div>
            <div className="profile-avatar">A</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-content">
                <div>
                    <h3 className="stat-label">Active Ambulances</h3>
                    <div className="stat-number">12</div>
                </div>
            </div>
            <div className="stat-icon">📍</div>
          </div>
          
          <div className="stat-card green">
            <div className="stat-content">
                <div>
              <h3 className="stat-label">Traffic Signals</h3>
              <div className="stat-number">45</div>
              </div>
            </div>
            <div className="stat-icon">⚡</div>
          </div>
          
          <div className="stat-card red">
            <div className="stat-content">
                <div>
              <h3 className="stat-label">Violations Today</h3>
              <div className="stat-number">117</div>
              </div>
            </div>
            <div className="stat-icon">⚠️</div>
          </div>
          
          <div className="stat-card purple">
            <div className="stat-content">
                <div>
              <h3 className="stat-label">Revenue Today</h3>
              <div className="stat-number">₹25,400</div>
              </div>
            </div>
            <div className="stat-icon">📊</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs">
            <div className="tab active">Overview</div>
            <div className="tab">Analytics</div>
            <div className="tab">Live Monitoring</div>
          </div>
        </div>

        {/* Live System Status */}
        <div className="status-section">
          <div className="section-header">
            <span className="pulse-icon">📈</span>
            <h2>Live System Status</h2>
          </div>
          
          <div className="status-grid">
            <div className="status-card health">
              <h3>System Health</h3>
              <div className="status-value">98.5%</div>
              <p>All systems operational</p>
            </div>
            
            <div className="status-card connections">
              <h3>Active Connections</h3>
              <div className="status-value">245</div>
              <p>Devices connected</p>
            </div>
            
            <div className="status-card processing">
              <h3>Data Processing</h3>
              <div className="status-value">1.2K</div>
              <p>Events per minute</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
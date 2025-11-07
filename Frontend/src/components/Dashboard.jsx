import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
    useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
  const checkToken = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      Swal.fire({
        icon: 'info',
        title: 'Session Expired',
        text: 'You have been logged out!',
        confirmButtonColor: '#3085d6',
      });
      navigate('/login', { replace: true });
    }
  };

  // Check token immediately and every second
  checkToken();
  const interval = setInterval(checkToken, 1000);

  // Cleanup on unmount
  return () => clearInterval(interval);
}, [navigate]);

  // 👤 Fetch user profile using stored token
  useEffect(() => {
    const fetchUser = async () => {
      const token =
        localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        Swal.fire({
          icon: 'info',
          title: 'Session Expired',
          text: 'Please log in again.',
          confirmButtonColor: '#3085d6',
        });
        navigate('/login', { replace: true });
        return;
      }

      try {
        const response = await fetch('http://localhost:5001/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `Welcome back, ${data.name}! 🎉`,
            showConfirmButton: false,
            timer: 2000,
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch user data');
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Authentication Failed',
          text: 'Your session has expired. Please log in again.',
        });
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // ------------------- Logout handler -------------------
    const handleLogout = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      // If no token, just clear storage and redirect
      if (!token) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/login', { replace: true });
        return;
      }

      try {
        // Call the logout route (protected) to blacklist the token on server
        const response = await fetch('http://localhost:5001/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        // We don't need to strictly check response.ok — even if token expired,
        // we will remove it client-side to guarantee logout.
        // But we can show server message if needed.
        const resData = await response.json().catch(() => ({}));

        // Clear storage
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');

        Swal.fire({
          icon: 'success',
          title: 'Logged out',
          text: resData?.message || 'You have been logged out successfully.',
          confirmButtonColor: '#3085d6',
        });

        navigate('/login', { replace: true });
      } catch (err) {
        // If the logout API call fails (network), still remove tokens client-side.
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');

        Swal.fire({
          icon: 'warning',
          title: 'Logged out locally',
          text: 'Could not contact server but you are logged out locally.',
          confirmButtonColor: '#3085d6',
        });

        navigate('/login', { replace: true });
      }
    };

  
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

          {/* Logout button */}
       
<div className="logout-container">
  <button onClick={handleLogout} className="logout-button">
    <span className="logout-icon">🔒</span>
    Logout
  </button>
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
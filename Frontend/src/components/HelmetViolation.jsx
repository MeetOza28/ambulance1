import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, AlertTriangle, Calendar, MapPin, Clock, Search, Filter, Download, Eye } from 'lucide-react';
import '../styles/HelmetViolation.css';

const HelmetViolations = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState('Overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const violationsData = [
    {
      id: 'HV001',
      location: 'Ring Road Junction',
      time: '14:32:15',
      date: '2024-07-28',
      vehicleNumber: 'GJ-05-AB-1234',
      vehicleType: 'Motorcycle',
      fineAmount: '₹500',
      status: 'Pending',
      severity: 'High',
      image: 'violation_001.jpg'
    },
    {
      id: 'HV002',
      location: 'Textile Market Square',
      time: '15:45:22',
      date: '2024-07-28',
      vehicleNumber: 'GJ-05-CD-5678',
      vehicleType: 'Scooter',
      fineAmount: '₹500',
      status: 'Resolved',
      severity: 'Medium',
      image: 'violation_002.jpg'
    },
    {
      id: 'HV003',
      location: 'Diamond Market Road',
      time: '16:21:08',
      date: '2024-07-28',
      vehicleNumber: 'GJ-05-EF-9012',
      vehicleType: 'Motorcycle',
      fineAmount: '₹500',
      status: 'Under Review',
      severity: 'High',
      image: 'violation_003.jpg'
    },
    {
      id: 'HV004',
      location: 'Station Road',
      time: '17:10:45',
      date: '2024-07-28',
      vehicleNumber: 'GJ-05-GH-3456',
      vehicleType: 'Scooter',
      fineAmount: '₹500',
      status: 'Pending',
      severity: 'Medium',
      image: 'violation_004.jpg'
    },
    {
      id: 'HV005',
      location: 'Piplod Main Road',
      time: '18:05:33',
      date: '2024-07-28',
      vehicleNumber: 'GJ-05-IJ-7890',
      vehicleType: 'Motorcycle',
      fineAmount: '₹500',
      status: 'Resolved',
      severity: 'Low',
      image: 'violation_005.jpg'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Resolved': return 'status-resolved';
      case 'Under Review': return 'status-under-review';
      default: return 'status-default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'severity-high';
      case 'Medium': return 'severity-medium';
      case 'Low': return 'severity-low';
      default: return 'severity-default';
    }
  };

  const filteredViolations = violationsData.filter(violation => {
    const matchesSearch = violation.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         violation.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || violation.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="helmet-violations-page">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="brand-title">SurakshaPath</h1>
          <p className="brand-subtitle">Traffic Management System</p>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-items">
            <Link to="/" className="nav-item">
                <span className="nav-icon">⊞</span>
                Dashboard
            </Link>

            <Link to="/ambulance-tracker" className="nav-item">
                <span className="nav-icon">📍</span>
                Ambulance Tracker
            </Link>

            <Link to="/traffic-signal" className="nav-item">
                <span className="nav-icon">⚡</span>
                Traffic Signals
            </Link>
            <a href="#" className="nav-item active">
              <Shield className="nav-icon-svg"/>
              Helmet Violations
            </a>
            <Link to="/challan-history" className="nav-item">
                <span className="nav-icon">📄</span>
                Challan History
            </Link>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="last-updated">
            <p>Last Updated</p>
            <p className="update-time">{currentTime.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="page-header">
          <div className="header-info">
            <h1 className="page-title">Helmet Violations</h1>
            <p className="page-subtitle">Real-time helmet violation monitoring and management</p>
          </div>
          <div className="header-actions">
            <div className="notification-icon">
              <AlertTriangle className="icon" />
            </div>
            <div className="user-avatar">
              A
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card violations-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-label">Total Violations Today</h3>
                <p className="stat-value">117</p>
              </div>
              <Shield className="stat-icon" />
            </div>
          </div>

          <div className="stat-card pending-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-label">Pending Actions</h3>
                <p className="stat-value">43</p>
              </div>
              <Clock className="stat-icon" />
            </div>
          </div>

          <div className="stat-card resolved-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-label">Resolved Today</h3>
                <p className="stat-value">74</p>
              </div>
              <div className="stat-icon-custom resolved-icon"></div>
            </div>
          </div>

          <div className="stat-card revenue-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-label">Fine Collected</h3>
                <p className="stat-value">₹37,000</p>
              </div>
              <div className="stat-icon-custom revenue-icon"></div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          {['Overview', 'Analytics', 'Live Monitoring'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`tab-button ${selectedTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search and Filter Bar */}
        <div className="search-filter-bar">
          <div className="search-controls">
            <div className="search-input-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search by vehicle number or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Under Review">Under Review</option>
            </select>
          </div>
          <div className="action-buttons">
            <button className="filter-button">
              <Filter className="button-icon" />
              Filter
            </button>
            <button className="export-button">
              <Download className="button-icon" />
              Export
            </button>
          </div>
        </div>

        {/* Violations Table */}
        <div className="violations-table-container">
          <div className="table-wrapper">
            <table className="violations-table">
              <thead className="table-head">
                <tr>
                  <th className="table-header">Violation ID</th>
                  <th className="table-header">Vehicle Details</th>
                  <th className="table-header">Location</th>
                  <th className="table-header">Time</th>
                  <th className="table-header">Fine Amount</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Severity</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredViolations.map((violation, index) => (
                  <tr key={violation.id} className="table-row">
                    <td className="table-cell">
                      <span className="violation-id">{violation.id}</span>
                    </td>
                    <td className="table-cell">
                      <div className="vehicle-details">
                        <p className="vehicle-number">{violation.vehicleNumber}</p>
                        <p className="vehicle-type">{violation.vehicleType}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="location-info">
                        <MapPin className="location-icon" />
                        <span className="location-text">{violation.location}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="time-info">
                        <p className="time">{violation.time}</p>
                        <p className="date">{violation.date}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="fine-amount">{violation.fineAmount}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`status-badge ${getStatusColor(violation.status)}`}>
                        {violation.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`severity ${getSeverityColor(violation.severity)}`}>
                        {violation.severity}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="action-buttons-cell">
                        <button className="action-button view-button">
                          <Eye className="action-icon" />
                        </button>
                        <button className="action-button download-button">
                          <Download className="action-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <p className="pagination-info">Showing {filteredViolations.length} of {violationsData.length} violations</p>
          <div className="pagination-controls">
            <button className="pagination-button">Previous</button>
            <button className="pagination-button active">1</button>
            <button className="pagination-button">2</button>
            <button className="pagination-button">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelmetViolations;
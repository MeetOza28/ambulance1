import React, { useState, useEffect} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ArrowLeft, 
  Activity, 
  Navigation,
  Shield,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import '../styles/ChallanHistory.css';

const ChallanHistory = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
    
  const [selectedTab, setSelectedTab] = useState('All Challans');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateFilter, setDateFilter] = useState('Today');

  const challanData = [
    {
      id: 'CH001',
      challanNumber: 'GJ-TR-2024-001234',
      vehicleNumber: 'GJ-05-AB-1234',
      violation: 'No Helmet',
      location: 'Ring Road Junction',
      date: '2024-07-28',
      time: '14:32:15',
      fineAmount: 500,
      status: 'Paid',
      paymentMethod: 'Online',
      officerName: 'Constable R. Patel',
      dueDate: '2024-08-28'
    },
    {
      id: 'CH002',
      challanNumber: 'GJ-TR-2024-001235',
      vehicleNumber: 'GJ-05-CD-5678',
      violation: 'Signal Jump',
      location: 'Textile Market Square',
      date: '2024-07-28',
      time: '15:45:22',
      fineAmount: 1000,
      status: 'Pending',
      paymentMethod: '-',
      officerName: 'Constable S. Shah',
      dueDate: '2024-08-28'
    },
    {
      id: 'CH003',
      challanNumber: 'GJ-TR-2024-001236',
      vehicleNumber: 'GJ-05-EF-9012',
      violation: 'Over Speeding',
      location: 'Diamond Market Road',
      date: '2024-07-28',
      time: '16:21:08',
      fineAmount: 1500,
      status: 'Overdue',
      paymentMethod: '-',
      officerName: 'Constable M. Joshi',
      dueDate: '2024-07-28'
    },
    {
      id: 'CH004',
      challanNumber: 'GJ-TR-2024-001237',
      vehicleNumber: 'GJ-05-GH-3456',
      violation: 'No Helmet',
      location: 'Station Road',
      date: '2024-07-27',
      time: '17:10:45',
      fineAmount: 500,
      status: 'Disputed',
      paymentMethod: '-',
      officerName: 'Constable K. Desai',
      dueDate: '2024-08-27'
    },
    {
      id: 'CH005',
      challanNumber: 'GJ-TR-2024-001238',
      vehicleNumber: 'GJ-05-IJ-7890',
      violation: 'Wrong Parking',
      location: 'Piplod Main Road',
      date: '2024-07-27',
      time: '18:05:33',
      fineAmount: 200,
      status: 'Paid',
      paymentMethod: 'Cash',
      officerName: 'Constable A. Sharma',
      dueDate: '2024-08-27'
    },
    {
      id: 'CH006',
      challanNumber: 'GJ-TR-2024-001239',
      vehicleNumber: 'GJ-05-KL-2468',
      violation: 'Triple Riding',
      location: 'Udhna Darwaja',
      date: '2024-07-26',
      time: '19:15:20',
      fineAmount: 1000,
      status: 'Pending',
      paymentMethod: '-',
      officerName: 'Constable P. Modi',
      dueDate: '2024-08-26'
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
      case 'Paid': return 'status-paid';
      case 'Pending': return 'status-pending';
      case 'Overdue': return 'status-overdue';
      case 'Disputed': return 'status-disputed';
      default: return 'status-default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid': return <CheckCircle className="status-icon" />;
      case 'Pending': return <Clock className="status-icon" />;
      case 'Overdue': return <XCircle className="status-icon" />;
      case 'Disputed': return <AlertCircle className="status-icon" />;
      default: return <Clock className="status-icon" />;
    }
  };

  const filteredChallans = challanData.filter(challan => {
    const matchesSearch = challan.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challan.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challan.violation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || challan.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const totalChallans = challanData.length;
  const paidChallans = challanData.filter(c => c.status === 'Paid').length;
  const pendingChallans = challanData.filter(c => c.status === 'Pending').length;
  const overdueChallans = challanData.filter(c => c.status === 'Overdue').length;
  const totalRevenue = challanData.filter(c => c.status === 'Paid').reduce((sum, c) => sum + c.fineAmount, 0);

  return (
    <div className="challan-history-page">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="brand-title">SurakshaPath</h1>
          <p className="brand-subtitle">Traffic Management System</p>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-items">
            <div className="nav-item back" onClick={() => navigate('/')}>
              <ArrowLeft className="stat-indicator" />
              <span>Back to Dashboard</span>
            </div>
            
            <Link to="/ambulance-tracker" className="nav-item">
                <span className="nav-icon">📍</span>
                Ambulance Tracker
            </Link>

            <Link to="/traffic-signal" className="nav-item">
                <span className="nav-icon">⚡</span>
                Traffic Signals
            </Link>
            <Link to="/helmet-violation" className="nav-item">
              <Shield className="nav-icon-svg"/>
              Helmet Violations
            </Link>
            <a href="#" className="nav-item active">
              <span className="nav-icon">📄</span>
              Challan History
            </a>
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
            <h1 className="page-title">Challan History</h1>
            <p className="page-subtitle">Complete record of traffic challans and payments</p>
          </div>
          <div className="header-actions">
            <div className="notification-icon">
              <AlertTriangle className="icon" />
              <span className="notification-count">3</span>
            </div>
            <div className="user-avatar">
              A
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card total-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-label">Total Challans</h3>
                <p className="stat-value">{totalChallans}</p>
                <div className="stat-change positive">+12% from last week</div>
              </div>
              <FileText className="stat-icon" />
            </div>
          </div>

          <div className="stat-card paid-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-label">Paid Challans</h3>
                <p className="stat-value">{paidChallans}</p>
                <div className="stat-change positive">+8% this month</div>
              </div>
              <CheckCircle className="stat-icon" />
            </div>
          </div>

          <div className="stat-card pending-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-label">Pending</h3>
                <p className="stat-value">{pendingChallans + overdueChallans}</p>
                <div className="stat-change negative">-3% from yesterday</div>
              </div>
              <Clock className="stat-icon" />
            </div>
          </div>

          <div className="stat-card revenue-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-label">Revenue Collected</h3>
                <p className="stat-value">₹{totalRevenue.toLocaleString()}</p>
                <div className="stat-change positive">+15% this month</div>
              </div>
              <DollarSign className="stat-icon" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          {['All Challans', 'Paid', 'Pending', 'Overdue', 'Analytics'].map((tab) => (
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
                placeholder="Search by challan number, vehicle number, or violation..."
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
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
              <option value="Disputed">Disputed</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Last 3 Months">Last 3 Months</option>
            </select>
          </div>
          <div className="action-buttons">
            <button className="filter-button">
              <Filter className="button-icon" />
              Advanced Filter
            </button>
            <button className="export-button">
              <Download className="button-icon" />
              Export Report
            </button>
          </div>
        </div>

        {/* Challans Table */}
        <div className="challans-table-container">
          <div className="table-wrapper">
            <table className="challans-table">
              <thead className="table-head">
                <tr>
                  <th className="table-header">Challan Details</th>
                  <th className="table-header">Vehicle Info</th>
                  <th className="table-header">Violation</th>
                  <th className="table-header">Location & Time</th>
                  <th className="table-header">Fine Amount</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Officer</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredChallans.map((challan) => (
                  <tr key={challan.id} className="table-row">
                    <td className="table-cell">
                      <div className="challan-details">
                        <span className="challan-number">{challan.challanNumber}</span>
                        <span className="challan-date">{challan.date}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="vehicle-info">
                        <span className="vehicle-number">{challan.vehicleNumber}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="violation-type">{challan.violation}</span>
                    </td>
                    <td className="table-cell">
                      <div className="location-time">
                        <div className="location-info">
                          <MapPin className="location-icon" />
                          <span className="location-text">{challan.location}</span>
                        </div>
                        <span className="time-text">{challan.time}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="fine-info">
                        <span className="fine-amount">₹{challan.fineAmount}</span>
                        {challan.paymentMethod !== '-' && (
                          <span className="payment-method">{challan.paymentMethod}</span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className={`status-badge ${getStatusColor(challan.status)}`}>
                        {getStatusIcon(challan.status)}
                        <span>{challan.status}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="officer-name">{challan.officerName}</span>
                    </td>
                    <td className="table-cell">
                      <div className="action-buttons-cell">
                        <button className="action-button view-button" title="View Details">
                          <Eye className="action-icon" />
                        </button>
                        <button className="action-button download-button" title="Download Receipt">
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

        {/* Summary Footer */}
        <div className="summary-footer">
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-label">Showing:</span>
              <span className="summary-value">{filteredChallans.length} of {totalChallans} challans</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Fine Amount:</span>
              <span className="summary-value">₹{filteredChallans.reduce((sum, c) => sum + c.fineAmount, 0).toLocaleString()}</span>
            </div>
          </div>
          
          <div className="pagination-controls">
            <button className="pagination-button">Previous</button>
            <button className="pagination-button active">1</button>
            <button className="pagination-button">2</button>
            <button className="pagination-button">3</button>
            <button className="pagination-button">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallanHistory;
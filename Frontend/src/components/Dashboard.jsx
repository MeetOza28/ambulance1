import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/Dashboard.css';

// import the services
import { getStats as getAmbulanceStats } from '../services/ambulanceServices';
import { getTrafficStats } from '../services/trafficServices';
import { getHelmetStats } from '../services/helmetServices';
import { getChallanStats } from '../services/challanServices';

const Dashboard = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


// NEW state for stats
  const [stats, setStats] = useState({
    ambulances: null,
    trafficSignals: null,
    violations: null,
    revenue: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // format INR
  const fmtINR = (n) => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
    } catch {
      return `₹${Number(n || 0).toLocaleString()}`;
    }
  };

  // inside Dashboard.jsx - replace the fetchAllStats function with this

// const fetchAllStats = async () => {
//   setStatsLoading(true);
//   setStatsError(null);
//   try {
//     // call shallow counts for speed
//     const [
//       ambRes,
//       trafficRes,
//       helmetRes,
//       challanRes
//     ] = await Promise.allSettled([
//       getAmbulanceStats({ shallow: true }),   // returns { data: { totalActive: N, ... } }
//       getTrafficStats({ shallow: true }),     // returns { data: { totalSignals: N, ... } }
//       getHelmetStats?.() ?? Promise.resolve({ data: { totalViolations: 0 } }), // keep existing
//       getChallanStats?.() ?? Promise.resolve({ data: { revenue: 0 } })
//     ]);

//     const next = { ambulances: null, trafficSignals: null, violations: null, revenue: null };

//     if (ambRes.status === 'fulfilled') {
//       const data = ambRes.value?.data || ambRes.value || {};
//       // try common keys
//       next.ambulances = data?.totalActive ?? data?.total ?? data?.count ?? null;
//     } else {
//       console.warn('Amb stats failed', ambRes.reason);
//       next.ambulances = null;
//     }

//     if (trafficRes.status === 'fulfilled') {
//       const data = trafficRes.value?.data || trafficRes.value || {};
//       next.trafficSignals = data?.totalSignals ?? data?.total ?? data?.count ?? null;
//     } else {
//       console.warn('Traffic stats failed', trafficRes.reason);
//       next.trafficSignals = null;
//     }

//     if (helmetRes.status === 'fulfilled') {
//       const data = helmetRes.value?.data || helmetRes.value || {};
//       next.violations = data?.totalViolations ?? data?.count ?? data?.total ?? null;
//     } else {
//       console.warn('Helmet stats failed', helmetRes.reason);
//       next.violations = null;
//     }

//     if (challanRes.status === 'fulfilled') {
//   const data = challanRes.value?.data || challanRes.value || {};
//   const revenueRaw = data?.revenue ?? data?.totalRevenue ?? data?.totalFine ?? data?.revenueCollected ?? null;
//   next.revenue = typeof revenueRaw === 'number' ? revenueRaw : (revenueRaw ? Number(String(revenueRaw).replace(/[^\d.-]/g, '')) : null);
// } else if (helmetRes.status === 'fulfilled') {
//   const data = helmetRes.value?.data || helmetRes.value || {};
//   const revenueRaw = data?.revenue ?? data?.totalFine ?? data?.totalRevenue ?? null;
//   next.revenue = typeof revenueRaw === 'number' ? revenueRaw : (revenueRaw ? Number(String(revenueRaw).replace(/[^\d.-]/g, '')) : null);
// } else {
//   console.warn('Revenue lookup failed (no challan & no helmet revenue)');
//   next.revenue = null;
// }



//     setStats(next);
//   } catch (err) {
//     console.error('Failed to fetch stats', err);
//     setStatsError(err.message || 'Failed to load stats');
//   } finally {
//     setStatsLoading(false);
//   }
// };

// replace your fetchAllStats with this in Dashboard.jsx
const fetchAllStats = async () => {
  setStatsLoading(true);
  setStatsError(null);

  try {
    // 1) quickly call ambulance & traffic in parallel (these are small)
    const [ambRes, trafficRes] = await Promise.allSettled([
      getAmbulanceStats({ shallow: true }),
      getTrafficStats({ shallow: true })
    ]);

    // 2) call helmet stats standalone so we can inspect it easily
    let helmetResult;
    try {
      helmetResult = await getHelmetStats();
      console.log('[DEBUG] getHelmetStats() returned ->', helmetResult);
      // expect shape: { data: { totalViolations, revenue, ... } }
    } catch (e) {
      console.warn('[DEBUG] getHelmetStats() threw', e);
      helmetResult = null;
    }

    // 3) try challan stats too (optional)
    let challanResult;
    try {
      challanResult = await getChallanStats?.();
      console.log('[DEBUG] getChallanStats() returned ->', challanResult);
    } catch (e) {
      console.warn('[DEBUG] getChallanStats() threw', e);
      challanResult = null;
    }

    // prepare next
    const next = { ambulances: null, trafficSignals: null, violations: null, revenue: null };

    // ambulances
    if (ambRes?.status === 'fulfilled') {
      const d = ambRes.value?.data || ambRes.value || {};
      next.ambulances = d?.totalActive ?? d?.total ?? d?.count ?? null;
    }

    // traffic
    if (trafficRes?.status === 'fulfilled') {
      const d = trafficRes.value?.data || trafficRes.value || {};
      next.trafficSignals = d?.totalSignals ?? d?.total ?? d?.count ?? null;
    }

    // helmet violations count (from helmetResult if present)
    if (helmetResult && (helmetResult.data || helmetResult.totalViolations != null || helmetResult.total != null)) {
      const d = helmetResult.data || helmetResult;
      next.violations = d?.totalViolations ?? d?.count ?? d?.total ?? null;
    }

    // Try revenue resolution order:
    // 1) challanResult.data.revenue (if present)
    // 2) helmetResult.data.revenue (if present)
    // 3) fallback: fetch /api/violations and sum known fields including fine_amount (snake_case)
    const safeNumber = (v) => {
      if (v == null) return 0;
      if (typeof v === 'number') return v;
      const n = Number(String(v).replace(/[^\d.-]/g, ''));
      return Number.isFinite(n) ? n : 0;
    };

    const extractRevenueFrom = (obj) => {
      if (!obj) return null;
      const d = obj.data ?? obj;
      const cand =
        d?.revenue ??
        d?.totalRevenue ??
        d?.totalFine ??
        d?.revenueCollected ??
        d?.fineTotal ??
        d?.fine_amount ?? // snake_case
        d?.total ?? null;
      return cand != null ? safeNumber(cand) : null;
    };

    // 1) challan
    const challanRev = extractRevenueFrom(challanResult);
    if (challanRev != null && challanRev !== 0) {
      next.revenue = challanRev;
    } else {
      // 2) helmetResult
      const helmetRev = extractRevenueFrom(helmetResult);
      if (helmetRev != null && helmetRev !== 0) {
        next.revenue = helmetRev;
      } else {
        // 3) fallback: fetch violations and sum (explicitly include snake_case fine_amount)
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const headers = { 'Content-Type': 'application/json' };
          if (token) headers.Authorization = `Bearer ${token}`;

          const res = await fetch('http://localhost:5001/api/violations', { headers });
          if (res.ok) {
            const json = await res.json().catch(() => null);
            const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : (json?.violations || []));
            // debug
            console.log('[DEBUG] /api/violations list length', list.length, 'sample[0]:', list[0]);
            let sum = 0;
            for (const it of list) {
              const raw =
                it?.fine_amount ?? // snake_case from DB screenshot
                it?.fineAmount ??
                it?.fine ??
                it?.amount ??
                it?.totalFine ??
                0;
              sum += safeNumber(raw);
            }
            next.revenue = sum;
          } else {
            console.warn('[DEBUG] fallback /api/violations returned not ok', res.status);
            next.revenue = null;
          }
        } catch (e) {
          console.error('[DEBUG] fallback summing failed', e);
          next.revenue = null;
        }
      }
    }

    // Finally set stats
    setStats(next);
  } catch (err) {
    console.error('Failed to fetch stats', err);
    setStatsError(err.message || 'Failed to load stats');
  } finally {
    setStatsLoading(false);
  }
};


  useEffect(() => {
    fetchAllStats();
    const interval = setInterval(fetchAllStats, 15 * 1000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);


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
          {/* <div className="nav-item" onClick={() => navigate('/challan-history') }>
            <span className="nav-icon">📄</span>
            <span>Challan History</span>
          </div> */}
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
                    {/* <div className="stat-number">12</div> */}
                    <div className="stat-number">
                      {statsLoading && stats.ambulances === null ? '—' : (stats.ambulances ?? '0')}
                    </div>
                </div>
            </div>
            <div className="stat-icon">📍</div>
          </div>
          
          <div className="stat-card green">
            <div className="stat-content">
                <div>
              <h3 className="stat-label">Traffic Signals</h3>
              {/* <div className="stat-number">45</div> */}
              <div className="stat-number">
                    {statsLoading && stats.trafficSignals === null ? '—' : (stats.trafficSignals ?? '0')}
                  </div>
              </div>
            </div>
            <div className="stat-icon">⚡</div>
          </div>
          
          <div className="stat-card red">
            <div className="stat-content">
                <div>
              <h3 className="stat-label">Total Violations</h3>
              {/* <div className="stat-number">117</div> */}
              <div className="stat-number">
                    {statsLoading && stats.violations === null ? '—' : (stats.violations ?? '0')}
                  </div>
              </div>
            </div>
            <div className="stat-icon">⚠️</div>
          </div>
          
          <div className="stat-card purple">
            <div className="stat-content">
                <div>
              <h3 className="stat-label">Revenue</h3>
              {/* <div className="stat-number">₹25,400</div> */}
              <div className="stat-number">
  {statsLoading && stats.revenue === null ? '—' : (typeof stats.revenue === 'number' ? fmtINR(stats.revenue) : (stats.revenue ? fmtINR(Number(stats.revenue)) : '₹0'))}
</div>


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
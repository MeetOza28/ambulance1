// import React, {useState, useEffect} from 'react';
// import { useNavigate } from 'react-router-dom';
// import Swal from 'sweetalert2';
// import '../styles/Dashboard.css';

// // import the services
// import { getStats as getAmbulanceStats } from '../services/ambulanceServices';
// import { getTrafficStats } from '../services/trafficServices';
// import { getHelmetStats } from '../services/helmetServices';
// import { getChallanStats } from '../services/challanServices';

// const Dashboard = () => {
//     const navigate = useNavigate();
//     const [currentTime, setCurrentTime] = useState(new Date());
//     const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);


// // NEW state for stats
//   const [stats, setStats] = useState({
//     ambulances: null,
//     trafficSignals: null,
//     violations: null,
//     revenue: null,
//   });
//   const [statsLoading, setStatsLoading] = useState(true);
//   const [statsError, setStatsError] = useState(null);

//   // format INR
//   const fmtINR = (n) => {
//     try {
//       return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
//     } catch {
//       return `₹${Number(n || 0).toLocaleString()}`;
//     }
//   };

//   // inside Dashboard.jsx - replace the fetchAllStats function with this

// // const fetchAllStats = async () => {
// //   setStatsLoading(true);
// //   setStatsError(null);
// //   try {
// //     // call shallow counts for speed
// //     const [
// //       ambRes,
// //       trafficRes,
// //       helmetRes,
// //       challanRes
// //     ] = await Promise.allSettled([
// //       getAmbulanceStats({ shallow: true }),   // returns { data: { totalActive: N, ... } }
// //       getTrafficStats({ shallow: true }),     // returns { data: { totalSignals: N, ... } }
// //       getHelmetStats?.() ?? Promise.resolve({ data: { totalViolations: 0 } }), // keep existing
// //       getChallanStats?.() ?? Promise.resolve({ data: { revenue: 0 } })
// //     ]);

// //     const next = { ambulances: null, trafficSignals: null, violations: null, revenue: null };

// //     if (ambRes.status === 'fulfilled') {
// //       const data = ambRes.value?.data || ambRes.value || {};
// //       // try common keys
// //       next.ambulances = data?.totalActive ?? data?.total ?? data?.count ?? null;
// //     } else {
// //       console.warn('Amb stats failed', ambRes.reason);
// //       next.ambulances = null;
// //     }

// //     if (trafficRes.status === 'fulfilled') {
// //       const data = trafficRes.value?.data || trafficRes.value || {};
// //       next.trafficSignals = data?.totalSignals ?? data?.total ?? data?.count ?? null;
// //     } else {
// //       console.warn('Traffic stats failed', trafficRes.reason);
// //       next.trafficSignals = null;
// //     }

// //     if (helmetRes.status === 'fulfilled') {
// //       const data = helmetRes.value?.data || helmetRes.value || {};
// //       next.violations = data?.totalViolations ?? data?.count ?? data?.total ?? null;
// //     } else {
// //       console.warn('Helmet stats failed', helmetRes.reason);
// //       next.violations = null;
// //     }

// //     if (challanRes.status === 'fulfilled') {
// //   const data = challanRes.value?.data || challanRes.value || {};
// //   const revenueRaw = data?.revenue ?? data?.totalRevenue ?? data?.totalFine ?? data?.revenueCollected ?? null;
// //   next.revenue = typeof revenueRaw === 'number' ? revenueRaw : (revenueRaw ? Number(String(revenueRaw).replace(/[^\d.-]/g, '')) : null);
// // } else if (helmetRes.status === 'fulfilled') {
// //   const data = helmetRes.value?.data || helmetRes.value || {};
// //   const revenueRaw = data?.revenue ?? data?.totalFine ?? data?.totalRevenue ?? null;
// //   next.revenue = typeof revenueRaw === 'number' ? revenueRaw : (revenueRaw ? Number(String(revenueRaw).replace(/[^\d.-]/g, '')) : null);
// // } else {
// //   console.warn('Revenue lookup failed (no challan & no helmet revenue)');
// //   next.revenue = null;
// // }



// //     setStats(next);
// //   } catch (err) {
// //     console.error('Failed to fetch stats', err);
// //     setStatsError(err.message || 'Failed to load stats');
// //   } finally {
// //     setStatsLoading(false);
// //   }
// // };

// // replace your fetchAllStats with this in Dashboard.jsx
// const fetchAllStats = async () => {
//   setStatsLoading(true);
//   setStatsError(null);

//   try {
//     // 1) quickly call ambulance & traffic in parallel (these are small)
//     const [ambRes, trafficRes] = await Promise.allSettled([
//       getAmbulanceStats({ shallow: true }),
//       getTrafficStats({ shallow: true })
//     ]);

//     // 2) call helmet stats standalone so we can inspect it easily
//     let helmetResult;
//     try {
//       helmetResult = await getHelmetStats();
//       console.log('[DEBUG] getHelmetStats() returned ->', helmetResult);
//       // expect shape: { data: { totalViolations, revenue, ... } }
//     } catch (e) {
//       console.warn('[DEBUG] getHelmetStats() threw', e);
//       helmetResult = null;
//     }

//     // 3) try challan stats too (optional)
//     let challanResult;
//     try {
//       challanResult = await getChallanStats?.();
//       console.log('[DEBUG] getChallanStats() returned ->', challanResult);
//     } catch (e) {
//       console.warn('[DEBUG] getChallanStats() threw', e);
//       challanResult = null;
//     }

//     // prepare next
//     const next = { ambulances: null, trafficSignals: null, violations: null, revenue: null };

//     // ambulances
//     if (ambRes?.status === 'fulfilled') {
//       const d = ambRes.value?.data || ambRes.value || {};
//       next.ambulances = d?.totalActive ?? d?.total ?? d?.count ?? null;
//     }

//     // traffic
//     if (trafficRes?.status === 'fulfilled') {
//       const d = trafficRes.value?.data || trafficRes.value || {};
//       next.trafficSignals = d?.totalSignals ?? d?.total ?? d?.count ?? null;
//     }

//     // helmet violations count (from helmetResult if present)
//     if (helmetResult && (helmetResult.data || helmetResult.totalViolations != null || helmetResult.total != null)) {
//       const d = helmetResult.data || helmetResult;
//       next.violations = d?.totalViolations ?? d?.count ?? d?.total ?? null;
//     }

//     // Try revenue resolution order:
//     // 1) challanResult.data.revenue (if present)
//     // 2) helmetResult.data.revenue (if present)
//     // 3) fallback: fetch /api/violations and sum known fields including fine_amount (snake_case)
//     const safeNumber = (v) => {
//       if (v == null) return 0;
//       if (typeof v === 'number') return v;
//       const n = Number(String(v).replace(/[^\d.-]/g, ''));
//       return Number.isFinite(n) ? n : 0;
//     };

//     const extractRevenueFrom = (obj) => {
//       if (!obj) return null;
//       const d = obj.data ?? obj;
//       const cand =
//         d?.revenue ??
//         d?.totalRevenue ??
//         d?.totalFine ??
//         d?.revenueCollected ??
//         d?.fineTotal ??
//         d?.fine_amount ?? // snake_case
//         d?.total ?? null;
//       return cand != null ? safeNumber(cand) : null;
//     };

//     // 1) challan
//     const challanRev = extractRevenueFrom(challanResult);
//     if (challanRev != null && challanRev !== 0) {
//       next.revenue = challanRev;
//     } else {
//       // 2) helmetResult
//       const helmetRev = extractRevenueFrom(helmetResult);
//       if (helmetRev != null && helmetRev !== 0) {
//         next.revenue = helmetRev;
//       } else {
//         // 3) fallback: fetch violations and sum (explicitly include snake_case fine_amount)
//         try {
//           const token = localStorage.getItem('token') || sessionStorage.getItem('token');
//           const headers = { 'Content-Type': 'application/json' };
//           if (token) headers.Authorization = `Bearer ${token}`;

//           const res = await fetch('http://localhost:5001/api/violations', { headers });
//           if (res.ok) {
//             const json = await res.json().catch(() => null);
//             const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : (json?.violations || []));
//             // debug
//             console.log('[DEBUG] /api/violations list length', list.length, 'sample[0]:', list[0]);
//             let sum = 0;
//             for (const it of list) {
//               const raw =
//                 it?.fine_amount ?? // snake_case from DB screenshot
//                 it?.fineAmount ??
//                 it?.fine ??
//                 it?.amount ??
//                 it?.totalFine ??
//                 0;
//               sum += safeNumber(raw);
//             }
//             next.revenue = sum;
//           } else {
//             console.warn('[DEBUG] fallback /api/violations returned not ok', res.status);
//             next.revenue = null;
//           }
//         } catch (e) {
//           console.error('[DEBUG] fallback summing failed', e);
//           next.revenue = null;
//         }
//       }
//     }

//     // Finally set stats
//     setStats(next);
//   } catch (err) {
//     console.error('Failed to fetch stats', err);
//     setStatsError(err.message || 'Failed to load stats');
//   } finally {
//     setStatsLoading(false);
//   }
// };


//   useEffect(() => {
//     fetchAllStats();
//     const interval = setInterval(fetchAllStats, 15 * 1000); // refresh every 15s
//     return () => clearInterval(interval);
//   }, []);


//     useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   useEffect(() => {
//   const checkToken = () => {
//     const token = localStorage.getItem('token') || sessionStorage.getItem('token');
//     if (!token) {
//       Swal.fire({
//         icon: 'info',
//         title: 'Session Expired',
//         text: 'You have been logged out!',
//         confirmButtonColor: '#3085d6',
//       });
//       navigate('/login', { replace: true });
//     }
//   };

//   // Check token immediately and every second
//   checkToken();
//   const interval = setInterval(checkToken, 1000);

//   // Cleanup on unmount
//   return () => clearInterval(interval);
// }, [navigate]);

//   // 👤 Fetch user profile using stored token
//   useEffect(() => {
//     const fetchUser = async () => {
//       const token =
//         localStorage.getItem('token') || sessionStorage.getItem('token');

//       if (!token) {
//         Swal.fire({
//           icon: 'info',
//           title: 'Session Expired',
//           text: 'Please log in again.',
//           confirmButtonColor: '#3085d6',
//         });
//         navigate('/login', { replace: true });
//         return;
//       }

//       try {
//         const response = await fetch('http://localhost:5001/api/auth/me', {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         if (response.ok) {
//           const data = await response.json();
//           setUser(data);
//           Swal.fire({
//             toast: true,
//             position: 'top-end',
//             icon: 'success',
//             title: `Welcome back, ${data.name}! 🎉`,
//             showConfirmButton: false,
//             timer: 2000,
//           });
//         } else {
//           const errorData = await response.json();
//           throw new Error(errorData.message || 'Failed to fetch user data');
//         }
//       } catch (error) {
//         Swal.fire({
//           icon: 'error',
//           title: 'Authentication Failed',
//           text: 'Your session has expired. Please log in again.',
//         });
//         localStorage.removeItem('token');
//         sessionStorage.removeItem('token');
//         navigate('/login', { replace: true });
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUser();
//   }, [navigate]);

// // -------- Live System Status (derived dynamic values) ----------
// const systemHealth = React.useMemo(() => {
//   if (statsLoading) return '—';

//   // Example logic:
//   // 98–100% health if data is coming properly.
//   const base = 98.0 + (Math.random() * 0.6);  
//   return base.toFixed(1) + '%';
// }, [statsLoading, stats]);

// const activeConnections = React.useMemo(() => {
//   if (statsLoading) return '—';

//   // Use traffic signals count as base or fall back random
//   const base = stats.trafficSignals ?? Math.floor(200 + Math.random() * 100);
//   return base;
// }, [statsLoading, stats]);

// const dataProcessing = React.useMemo(() => {
//   if (statsLoading) return '—';

//   // If revenue exists, scale events per minute using it
//   const base = Math.floor(1000 + Math.random() * 500);
//   return base.toLocaleString(); // e.g. "1,240"
// }, [statsLoading, stats]);



//   // ------------------- Logout handler -------------------
//     const handleLogout = async () => {
//       const token = localStorage.getItem('token') || sessionStorage.getItem('token');

//       // If no token, just clear storage and redirect
//       if (!token) {
//         localStorage.removeItem('token');
//         sessionStorage.removeItem('token');
//         navigate('/login', { replace: true });
//         return;
//       }

//       try {
//         // Call the logout route (protected) to blacklist the token on server
//         const response = await fetch('http://localhost:5001/api/auth/logout', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         // We don't need to strictly check response.ok — even if token expired,
//         // we will remove it client-side to guarantee logout.
//         // But we can show server message if needed.
//         const resData = await response.json().catch(() => ({}));

//         // Clear storage
//         localStorage.removeItem('token');
//         sessionStorage.removeItem('token');

//         Swal.fire({
//           icon: 'success',
//           title: 'Logged out',
//           text: resData?.message || 'You have been logged out successfully.',
//           confirmButtonColor: '#3085d6',
//         });

//         navigate('/login', { replace: true });
//       } catch (err) {
//         // If the logout API call fails (network), still remove tokens client-side.
//         localStorage.removeItem('token');
//         sessionStorage.removeItem('token');

//         Swal.fire({
//           icon: 'warning',
//           title: 'Logged out locally',
//           text: 'Could not contact server but you are logged out locally.',
//           confirmButtonColor: '#3085d6',
//         });

//         navigate('/login', { replace: true });
//       }
//     };
// // Updated Analytics handler (close modal then navigate reliably)
// const handleOpenAnalytics = async () => {
//   const container = document.createElement('div');
//   container.innerHTML = `
//     <div style="text-align:left">
//       <div style="display:flex; gap:12px; justify-content:space-between; align-items:center;">
//         <div>
//           <div style="font-size:13px; color:#6b7280">Active Ambulances</div>
//           <div id="a-ambulances" style="font-weight:700; font-size:20px">${statsLoading && stats.ambulances === null ? '—' : (stats.ambulances ?? '0')}</div>
//         </div>
//         <div>
//           <div style="font-size:13px; color:#6b7280">Traffic Signals</div>
//           <div id="a-signals" style="font-weight:700; font-size:20px">${statsLoading && stats.trafficSignals === null ? '—' : (stats.trafficSignals ?? '0')}</div>
//         </div>
//         <div>
//           <div style="font-size:13px; color:#6b7280">Violations</div>
//           <div id="a-violations" style="font-weight:700; font-size:20px">${statsLoading && stats.violations === null ? '—' : (stats.violations ?? '0')}</div>
//         </div>
//         <div>
//           <div style="font-size:13px; color:#6b7280">Revenue</div>
//           <div id="a-revenue" style="font-weight:700; font-size:20px">${statsLoading && stats.revenue === null ? '—' : (typeof stats.revenue === 'number' ? fmtINR(stats.revenue) : (stats.revenue ? fmtINR(Number(stats.revenue)) : '₹0'))}</div>
//         </div>
//       </div>

//       <div style="margin-top:12px; display:flex; gap:8px; align-items:center;">
//         <button id="analytics-refresh" style="padding:8px 10px; border-radius:8px; border:none; cursor:pointer; background:#7c3aed; color:white;">Refresh</button>
        
//         <div style="flex:1"></div>
//       </div>

//       <p style="margin-top:10px; color:#6b7280; font-size:13px">Quick snapshot. Use Refresh for latest values or open full analytics for deeper charts.</p>
//     </div>
//   `;

//   await Swal.fire({
//     title: '<strong>Analytics Summary</strong>',
//     html: container,
//     showConfirmButton: false,
//     showCloseButton: true,
//     customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' },
//     willOpen: () => {
//       const refreshBtn = container.querySelector('#analytics-refresh');
//       const openBtn = container.querySelector('#analytics-open');

//       if (refreshBtn) {
//         refreshBtn.addEventListener('click', async () => {
//           refreshBtn.disabled = true;
//           refreshBtn.textContent = 'Refreshing...';
//           try {
//             await fetchAllStats();
//             const aEl = container.querySelector('#a-ambulances');
//             const tEl = container.querySelector('#a-signals');
//             const vEl = container.querySelector('#a-violations');
//             const rEl = container.querySelector('#a-revenue');
//             if (aEl) aEl.textContent = stats.ambulances ?? '0';
//             if (tEl) tEl.textContent = stats.trafficSignals ?? '0';
//             if (vEl) vEl.textContent = stats.violations ?? '0';
//             if (rEl) rEl.textContent = (typeof stats.revenue === 'number' ? fmtINR(stats.revenue) : (stats.revenue ? fmtINR(Number(stats.revenue)) : '₹0'));
//             Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Analytics refreshed', showConfirmButton: false, timer: 1200 });
//           } catch {
//             Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Refresh failed', showConfirmButton: false, timer: 1400 });
//           } finally {
//             refreshBtn.disabled = false;
//             refreshBtn.textContent = 'Refresh';
//           }
//         });
//       }

//       if (openBtn) {
//         openBtn.addEventListener('click', () => {
//           // robust close -> navigate sequence
//           Swal.close();
//           // short delay to let Swal teardown finish, then navigate
//           setTimeout(() => {
//             try {
//               navigate('/analytics');
//             } catch (e) {
//               // fallback if navigate is unavailable for any reason
//               window.location.href = '/analytics';
//             }
//           }, 150);
//         });
//       }
//     }
//   });
// };

// // Updated Live Monitoring handler with the same close->navigate safety
// const handleOpenLiveMonitoring = async () => {
//   const container = document.createElement('div');
//   container.innerHTML = `
//     <div style="text-align:left">
//       <div style="display:flex; gap:12px; justify-content:space-between;">
//         <div style="flex:1">
//           <div style="font-size:13px; color:#6b7280">System Health</div>
//           <div id="live-health" style="font-weight:700; font-size:22px; margin-top:6px">--%</div>
//           <div style="margin-top:6px; color:#6b7280; font-size:13px">All systems operational</div>
//         </div>
//         <div style="flex:1">
//           <div style="font-size:13px; color:#6b7280">Active Connections</div>
//           <div id="live-connections" style="font-weight:700; font-size:22px; margin-top:6px">--</div>
//           <div style="margin-top:6px; color:#6b7280; font-size:13px">Devices connected</div>
//         </div>
//         <div style="flex:1">
//           <div style="font-size:13px; color:#6b7280">Events / min</div>
//           <div id="live-events" style="font-weight:700; font-size:22px; margin-top:6px">--</div>
//           <div style="margin-top:6px; color:#6b7280; font-size:13px">Live processing</div>
//         </div>
//       </div>

//       <div style="margin-top:12px; display:flex; gap:8px; align-items:center;">
//         <button id="live-toggle" style="padding:8px 10px; border-radius:8px; border:none; cursor:pointer; background:#ef4444; color:white;">Pause</button>
        
//         <div style="flex:1"></div>
//       </div>

//       <div style="margin-top:12px">
//         <div style="font-size:13px; color:#6b7280">Recent Log</div>
//         <pre id="live-log" style="background:#f3f4f6; padding:8px; border-radius:8px; height:90px; overflow:auto; margin-top:6px;">Initializing live feed...</pre>
//       </div>
//     </div>
//   `;

//   let paused = false;
//   let intervalId = null;

//   await Swal.fire({
//     title: '<strong>Live Monitoring Preview</strong>',
//     html: container,
//     showCloseButton: true,
//     showConfirmButton: false,
//     customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' },
//     willOpen: () => {
//       const healthEl = container.querySelector('#live-health');
//       const connEl = container.querySelector('#live-connections');
//       const eventsEl = container.querySelector('#live-events');
//       const logEl = container.querySelector('#live-log');
//       const toggleBtn = container.querySelector('#live-toggle');
//       const openBtn = container.querySelector('#live-open');

//       const updateLive = () => {
//         const health = stats && stats.ambulances != null ? `${(98.5 + (Math.random() - 0.5) * 0.6).toFixed(1)}%` : `${(90 + Math.random() * 10).toFixed(1)}%`;
//         const connections = stats && stats.trafficSignals != null ? (stats.trafficSignals + Math.round(Math.random() * 5)) : Math.round(200 + Math.random() * 100);
//         const events = stats && stats.revenue != null ? `${(1000 + Math.round(Math.random() * 500))} / min` : `${Math.round(800 + Math.random() * 700)} / min`;
//         if (healthEl) healthEl.textContent = health;
//         if (connEl) connEl.textContent = connections;
//         if (eventsEl) eventsEl.textContent = events;
//         if (logEl) {
//           const ts = new Date().toLocaleTimeString();
//           const line = `[${ts}] health ${health}, connections ${connections}\n`;
//           logEl.textContent = (line + logEl.textContent).split('\n').slice(0, 12).join('\n');
//         }
//       };

//       updateLive();
//       intervalId = setInterval(() => {
//         if (!paused) updateLive();
//       }, 1000);

//       if (toggleBtn) {
//         toggleBtn.addEventListener('click', () => {
//           paused = !paused;
//           toggleBtn.textContent = paused ? 'Resume' : 'Pause';
//           toggleBtn.style.background = paused ? '#10b981' : '#ef4444';
//           Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: paused ? 'Live preview paused' : 'Live preview resumed', showConfirmButton: false, timer: 1000 });
//         });
//       }

//       if (openBtn) {
//         openBtn.addEventListener('click', () => {
//           // close -> wait -> navigate
//           Swal.close();
//           setTimeout(() => {
//             try {
//               navigate('/live-monitoring');
//             } catch (e) {
//               window.location.href = '/live-monitoring';
//             }
//           }, 150);
//         });
//       }
//     },
//     willClose: () => {
//       if (intervalId) clearInterval(intervalId);
//       intervalId = null;
//     }
//   });
// };




//   return (
//     <div className="dashboard-container">
//       {/* Sidebar */}
//       <div className="sidebar">
//         <div className="sidebar-header">
//           <h1 className="logo">SurakshaPath</h1>
//           <p className="subtitle">Traffic Management System</p>
//         </div>
        
//         <nav className="sidebar-nav">
//           <div className="nav-item active">
//             <span className="nav-icon">⊞</span>
//             <span>Dashboard</span>
//           </div>
//           <div className="nav-item" onClick={() => navigate('/ambulance-tracker') }>
//             <span className="nav-icon">📍</span>
//             <span>Ambulance Tracker</span>
//           </div>
//           <div className="nav-item" onClick={() => navigate('/traffic-signal') }>
//             <span className="nav-icon">⚡</span>
//             <span>Traffic Signals</span>
//           </div>
//           <div className="nav-item" onClick={() => navigate('/helmet-violation') }>
//             <span className="nav-icon">🛡️</span>
//             <span>Helmet Violations</span>
//           </div>
//           {/* <div className="nav-item" onClick={() => navigate('/challan-history') }>
//             <span className="nav-icon">📄</span>
//             <span>Challan History</span>
//           </div> */}
//         </nav>
        
//         <div className="sidebar-footer">
//           <div className="last-updated">
//             <p>Last Updated</p>
//             <p>{currentTime.toLocaleTimeString()}</p>
//           </div>

//           {/* Logout button */}
       
// <div className="logout-container">
//   <button onClick={handleLogout} className="logout-button">
//     <span className="logout-icon">🔒</span>
//     Logout
//   </button>
// </div>


            
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="main-content">
//         {/* Header */}
//         <div className="main-header">
//           <div className="header-left">
//             <h1>Traffic Control Dashboard</h1>
//             <p>Real-time monitoring and management system</p>
//           </div>
//           <div className="header-right">
//             <div className="notification-icon">
//               <span>🔔</span>
//               <span className="notification-badge">3</span>
//             </div>
//             <div className="profile-avatar">A</div>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         <div className="stats-grid">
//           <div className="stat-card blue">
//             <div className="stat-content">
//                 <div>
//                     <h3 className="stat-label">Active Ambulances</h3>
//                     {/* <div className="stat-number">12</div> */}
//                     <div className="stat-number">
//                       {statsLoading && stats.ambulances === null ? '—' : (stats.ambulances ?? '0')}
//                     </div>
//                 </div>
//             </div>
//             <div className="stat-icon">📍</div>
//           </div>
          
//           <div className="stat-card green">
//             <div className="stat-content">
//                 <div>
//               <h3 className="stat-label">Traffic Signals</h3>
//               {/* <div className="stat-number">45</div> */}
//               <div className="stat-number">
//                     {statsLoading && stats.trafficSignals === null ? '—' : (stats.trafficSignals ?? '0')}
//                   </div>
//               </div>
//             </div>
//             <div className="stat-icon">⚡</div>
//           </div>
          
//           <div className="stat-card red">
//             <div className="stat-content">
//                 <div>
//               <h3 className="stat-label">Total Violations</h3>
//               {/* <div className="stat-number">117</div> */}
//               <div className="stat-number">
//                     {statsLoading && stats.violations === null ? '—' : (stats.violations ?? '0')}
//                   </div>
//               </div>
//             </div>
//             <div className="stat-icon">⚠️</div>
//           </div>
          
//           <div className="stat-card purple">
//             <div className="stat-content">
//                 <div>
//               <h3 className="stat-label">Revenue</h3>
//               {/* <div className="stat-number">₹25,400</div> */}
//               <div className="stat-number">
//   {statsLoading && stats.revenue === null ? '—' : (typeof stats.revenue === 'number' ? fmtINR(stats.revenue) : (stats.revenue ? fmtINR(Number(stats.revenue)) : '₹0'))}
// </div>


//               </div>
//             </div>
//             <div className="stat-icon">📊</div>
//           </div>
//         </div>

//         {/* Tabs
//         <div className="tabs-container">
//           <div className="tabs">
//             <div className="tab active">Overview</div>
//             <div className="tab">Analytics</div>
//             <div className="tab">Live Monitoring</div>
//           </div>
//         </div> */}
//         {/* Tabs */}
//         <div className="tabs-container">
//           <div className="tabs">
//             <div className="tab active">Overview</div>
//             {/* bind click handlers to the tabs */}
//             <div className="tab" onClick={handleOpenAnalytics}>Analytics</div>
//             <div className="tab" onClick={handleOpenLiveMonitoring}>Live Monitoring</div>
//           </div>
//         </div>

//         {/* Live System Status */}
//         <div className="status-section">
//           <div className="section-header">
//             <span className="pulse-icon">📈</span>
//             <h2>Live System Status</h2>
//           </div>
          
//           <div className="status-grid">
//             <div className="status-card health">
//               <h3>System Health</h3>
//               {/* <div className="status-value">98.5%</div> */}
//               <div className="status-value">{systemHealth}</div>

//               <p>All systems operational</p>
//             </div>
            
//             <div className="status-card connections">
//               <h3>Active Connections</h3>
//               {/* <div className="status-value">245</div> */}
//               <div className="status-value">{activeConnections}</div>

//               <p>Devices connected</p>
//             </div>
            
//             <div className="status-card processing">
//               <h3>Data Processing</h3>
//               {/* <div className="status-value">1.2K</div> */}
//               <div className="status-value">
//   {dataProcessing} 
// </div>

//               <p>Events per minute</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;





// // src/pages/Dashboard.jsx
// import React, { useState, useEffect, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Swal from 'sweetalert2';
// import '../styles/Dashboard.css';

// // charts
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   CartesianGrid,
//   PieChart,
//   Pie,
//   Cell,
//   Legend
// } from 'recharts';

// // import the services
// import { getStats as getAmbulanceStats } from '../services/ambulanceServices';
// import { getTrafficStats } from '../services/trafficServices';
// import { getHelmetStats } from '../services/helmetServices';
// import { getChallanStats } from '../services/challanServices';

// const COLORS = ['#7c3aed', '#ef4444', '#10b981', '#06b6d4', '#f59e0b'];

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   // which tab is active: 'overview' | 'analytics' | 'live'
// const [activeTab, setActiveTab] = useState('overview');


//   // NEW state for stats
//   const [stats, setStats] = useState({
//     ambulances: null,
//     trafficSignals: null,
//     violations: null,
//     revenue: null,
//   });
//   const [statsLoading, setStatsLoading] = useState(true);
//   const [statsError, setStatsError] = useState(null);

//   // analytics UI state (rendered inside this page)
//   const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
//   const [analyticsLoading, setAnalyticsLoading] = useState(false);
//   const [range, setRange] = useState('12h'); // '12h' | '24h' | '7d'
//   const [timeseries, setTimeseries] = useState([]);
//   const [violationTypes, setViolationTypes] = useState([]);
//   const [recentList, setRecentList] = useState([]);

//   // format INR
//   const fmtINR = (n) => {
//     try {
//       return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
//     } catch {
//       return `₹${Number(n || 0).toLocaleString()}`;
//     }
//   };

//   // ------------------ fetchAllStats (keeps your original implementation) ------------------
//   const fetchAllStats = async () => {
//     setStatsLoading(true);
//     setStatsError(null);

//     try {
//       const [ambRes, trafficRes] = await Promise.allSettled([
//         getAmbulanceStats({ shallow: true }),
//         getTrafficStats({ shallow: true })
//       ]);

//       let helmetResult = null;
//       try {
//         helmetResult = await getHelmetStats();
//         console.log('[DEBUG] getHelmetStats() returned ->', helmetResult);
//       } catch (e) {
//         console.warn('[DEBUG] getHelmetStats() threw', e);
//         helmetResult = null;
//       }

//       let challanResult = null;
//       try {
//         challanResult = await getChallanStats?.();
//         console.log('[DEBUG] getChallanStats() returned ->', challanResult);
//       } catch (e) {
//         console.warn('[DEBUG] getChallanStats() threw', e);
//         challanResult = null;
//       }

//       const next = { ambulances: null, trafficSignals: null, violations: null, revenue: null };

//       if (ambRes?.status === 'fulfilled') {
//         const d = ambRes.value?.data || ambRes.value || {};
//         next.ambulances = d?.totalActive ?? d?.total ?? d?.count ?? null;
//       }

//       if (trafficRes?.status === 'fulfilled') {
//         const d = trafficRes.value?.data || trafficRes.value || {};
//         next.trafficSignals = d?.totalSignals ?? d?.total ?? d?.count ?? null;
//       }

//       if (helmetResult && (helmetResult.data || helmetResult.totalViolations != null || helmetResult.total != null)) {
//         const d = helmetResult.data || helmetResult;
//         next.violations = d?.totalViolations ?? d?.count ?? d?.total ?? null;
//       }

//       const safeNumber = (v) => {
//         if (v == null) return 0;
//         if (typeof v === 'number') return v;
//         const n = Number(String(v).replace(/[^\d.-]/g, ''));
//         return Number.isFinite(n) ? n : 0;
//       };

//       const extractRevenueFrom = (obj) => {
//         if (!obj) return null;
//         const d = obj.data ?? obj;
//         const cand =
//           d?.revenue ??
//           d?.totalRevenue ??
//           d?.totalFine ??
//           d?.revenueCollected ??
//           d?.fineTotal ??
//           d?.fine_amount ??
//           d?.total ?? null;
//         return cand != null ? safeNumber(cand) : null;
//       };

//       const challanRev = extractRevenueFrom(challanResult);
//       if (challanRev != null && challanRev !== 0) {
//         next.revenue = challanRev;
//       } else {
//         const helmetRev = extractRevenueFrom(helmetResult);
//         if (helmetRev != null && helmetRev !== 0) {
//           next.revenue = helmetRev;
//         } else {
//           try {
//             const token = localStorage.getItem('token') || sessionStorage.getItem('token');
//             const headers = { 'Content-Type': 'application/json' };
//             if (token) headers.Authorization = `Bearer ${token}`;

//             const res = await fetch('http://localhost:5001/api/violations', { headers });
//             if (res.ok) {
//               const json = await res.json().catch(() => null);
//               const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : (json?.violations || []));
//               let sum = 0;
//               for (const it of list) {
//                 const raw =
//                   it?.fine_amount ??
//                   it?.fineAmount ??
//                   it?.fine ??
//                   it?.amount ??
//                   it?.totalFine ??
//                   0;
//                 sum += safeNumber(raw);
//               }
//               next.revenue = sum;
//             } else {
//               console.warn('[DEBUG] fallback /api/violations returned not ok', res.status);
//               next.revenue = null;
//             }
//           } catch (e) {
//             console.error('[DEBUG] fallback summing failed', e);
//             next.revenue = null;
//           }
//         }
//       }

//       setStats(next);
//     } catch (err) {
//       console.error('Failed to fetch stats', err);
//       setStatsError(err.message || 'Failed to load stats');
//     } finally {
//       setStatsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAllStats();
//     const interval = setInterval(fetchAllStats, 15 * 1000); // refresh every 15s
//     return () => clearInterval(interval);
//   }, []);

//   // ------------------ clock ------------------
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   // ------------------ token check ------------------
//   useEffect(() => {
//     const checkToken = () => {
//       const token = localStorage.getItem('token') || sessionStorage.getItem('token');
//       if (!token) {
//         Swal.fire({
//           icon: 'info',
//           title: 'Session Expired',
//           text: 'You have been logged out!',
//           confirmButtonColor: '#3085d6',
//         });
//         navigate('/login', { replace: true });
//       }
//     };

//     checkToken();
//     const interval = setInterval(checkToken, 1000);
//     return () => clearInterval(interval);
//   }, [navigate]);

//   // ------------------ fetch profile ------------------
//   useEffect(() => {
//     const fetchUser = async () => {
//       const token = localStorage.getItem('token') || sessionStorage.getItem('token');

//       if (!token) {
//         Swal.fire({
//           icon: 'info',
//           title: 'Session Expired',
//           text: 'Please log in again.',
//           confirmButtonColor: '#3085d6',
//         });
//         navigate('/login', { replace: true });
//         return;
//       }

//       try {
//         const response = await fetch('http://localhost:5001/api/auth/me', {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         if (response.ok) {
//           const data = await response.json();
//           setUser(data);
//           Swal.fire({
//             toast: true,
//             position: 'top-end',
//             icon: 'success',
//             title: `Welcome back, ${data.name}! 🎉`,
//             showConfirmButton: false,
//             timer: 2000,
//           });
//         } else {
//           const errorData = await response.json();
//           throw new Error(errorData.message || 'Failed to fetch user data');
//         }
//       } catch (error) {
//         Swal.fire({
//           icon: 'error',
//           title: 'Authentication Failed',
//           text: 'Your session has expired. Please log in again.',
//         });
//         localStorage.removeItem('token');
//         sessionStorage.removeItem('token');
//         navigate('/login', { replace: true });
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUser();
//   }, [navigate]);

//   // -------- Live System Status (derived dynamic values) ----------
//   const systemHealth = useMemo(() => {
//     if (statsLoading) return '—';
//     const base = 98.0 + (Math.random() * 0.6);
//     return base.toFixed(1) + '%';
//   }, [statsLoading, stats]);

//   const activeConnections = useMemo(() => {
//     if (statsLoading) return '—';
//     const base = stats.trafficSignals ?? Math.floor(200 + Math.random() * 100);
//     return base;
//   }, [statsLoading, stats]);

//   const dataProcessing = useMemo(() => {
//     if (statsLoading) return '—';
//     const base = Math.floor(1000 + Math.random() * 500);
//     return base.toLocaleString();
//   }, [statsLoading, stats]);

//   // ------------------ Analytics fetching (for inline panel) ------------------
//   const generateDemoTimeseries = (points = 12) => {
//     const now = Date.now();
//     return new Array(points).fill(0).map((_, i) => {
//       const t = new Date(now - (points - 1 - i) * 60 * 60 * 1000);
//       return {
//         timeLabel: t.getHours().toString().padStart(2, '0') + ':' + t.getMinutes().toString().padStart(2, '0'),
//         ambulances: Math.max(1, Math.round(3 + Math.sin(i / 2) * 1.5 + Math.random() * 1.5)),
//         signals: Math.max(3, Math.round(5 + Math.cos(i / 3) * 1.5 + Math.random() * 2)),
//         violations: Math.max(0, Math.round(5 + Math.sin(i / 3) * 3 + Math.random() * 4)),
//         events: Math.round(900 + Math.random() * 500)
//       };
//     });
//   };

//   const transformViolationTypes = (rawList = []) => {
//     if (!rawList || rawList.length === 0) {
//       return [
//         { name: 'Helmet', value: stats.violations ?? 1 },
//         { name: 'Signal Jump', value: Math.max(0, Math.round((stats.violations ?? 1) * 0.25)) },
//         { name: 'Speeding', value: Math.max(0, Math.round((stats.violations ?? 1) * 0.15)) }
//       ];
//     }
//     return rawList.map((r) => ({ name: r.type ?? r.name, value: Number(r.count ?? r.value ?? 0) }));
//   };

//   const fetchAnalytics = async (force = false) => {
//     // if analytics already loaded and not forced, just show
//     if (!force && timeseries.length > 0) {
//       return;
//     }

//     setAnalyticsLoading(true);

//     try {
//       const token = localStorage.getItem('token') || sessionStorage.getItem('token');
//       let ts = null;
//       let types = null;
//       let recent = [];

//       try {
//         const res = await fetch(`http://localhost:5001/api/analytics?range=${range}`, {
//           headers: token ? { Authorization: `Bearer ${token}` } : {}
//         });
//         if (res.ok) {
//           const json = await res.json().catch(() => null);
//           if (json?.timeseries) ts = json.timeseries;
//           if (json?.types) types = json.types;
//           if (json?.recent) recent = json.recent;
//         }
//       } catch (e) {
//         // ignore - fallback to demo
//         console.warn('No /api/analytics or fetch failed', e);
//       }

//       const points = range === '12h' ? 12 : range === '24h' ? 24 : 7;
//       if (!ts || !Array.isArray(ts) || ts.length === 0) {
//         ts = generateDemoTimeseries(points);
//       } else {
//         // ensure shape includes timeLabel
//         ts = ts.slice(-points).map((p, idx) => ({
//           timeLabel: p.timeLabel ?? (`t${idx}`),
//           ambulances: Number(p.ambulances ?? p.activeAmbulances ?? 0),
//           violations: Number(p.violations ?? p.totalViolations ?? 0),
//           events: Number(p.events ?? p.eventsPerMin ?? p.events_per_min ?? 0)
//         }));
//       }

//       if (!types || !Array.isArray(types) || types.length === 0) {
//         types = transformViolationTypes([]);
//       } else {
//         types = transformViolationTypes(types);
//       }

//       setTimeseries(ts);
//       setViolationTypes(types);
//       setRecentList(recent.slice(0, 8));
//     } catch (e) {
//       console.error('fetchAnalytics failed', e);
//     } finally {
//       setAnalyticsLoading(false);
//     }
//   };

//   // ------------------ Handlers ------------------
//   const handleOpenAnalytics = async () => {
//     setActiveTab('analytics');
//   setShowAnalyticsPanel(true);
//   await fetchAnalytics(true);
//     // open inline analytics panel below tabs
//     // setShowAnalyticsPanel(true);
//     // await fetchAnalytics(true);
//     // also keep the old small Swal snapshot available (optional)
//     // you can remove the Swal call below if you don't want the small modal at all
//     const container = document.createElement('div');
//     container.innerHTML = `
//       <div style="text-align:left">
//         <div style="display:flex; gap:12px; justify-content:space-between; align-items:center;">
//           <div>
//             <div style="font-size:13px; color:#6b7280">Active Ambulances</div>
//             <div style="font-weight:700; font-size:20px">${statsLoading && stats.ambulances === null ? '—' : (stats.ambulances ?? '0')}</div>
//           </div>
//           <div>
//             <div style="font-size:13px; color:#6b7280">Traffic Signals</div>
//             <div style="font-weight:700; font-size:20px">${statsLoading && stats.trafficSignals === null ? '—' : (stats.trafficSignals ?? '0')}</div>
//           </div>
//           <div>
//             <div style="font-size:13px; color:#6b7280">Violations</div>
//             <div style="font-weight:700; font-size:20px">${statsLoading && stats.violations === null ? '—' : (stats.violations ?? '0')}</div>
//           </div>
//           <div>
//             <div style="font-size:13px; color:#6b7280">Revenue</div>
//             <div style="font-weight:700; font-size:20px">${statsLoading && stats.revenue === null ? '—' : (typeof stats.revenue === 'number' ? fmtINR(stats.revenue) : (stats.revenue ? fmtINR(Number(stats.revenue)) : '₹0'))}</div>
//           </div>
//         </div>
//         <div style="margin-top:12px; display:flex; gap:8px; align-items:center;">
//           <button id="analytics-refresh" style="padding:8px 10px; border-radius:8px; border:none; cursor:pointer; background:#7c3aed; color:white;">Refresh</button>
//           <div style="flex:1"></div>
//         </div>
//         <p style="margin-top:10px; color:#6b7280; font-size:13px">Quick snapshot. Full analytics appears below.</p>
//       </div>
//     `;
//     await Swal.fire({
//       title: '<strong>Analytics Summary</strong>',
//       html: container,
//       showConfirmButton: false,
//       showCloseButton: true,
//       customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' },
//       willOpen: () => {
//         const refreshBtn = container.querySelector('#analytics-refresh');
//         if (refreshBtn) {
//           refreshBtn.addEventListener('click', async () => {
//             refreshBtn.disabled = true;
//             refreshBtn.textContent = 'Refreshing...';
//             try {
//               await fetchAllStats();
//               await fetchAnalytics(true);
//               Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Analytics refreshed', showConfirmButton: false, timer: 1200 });
//             } catch {
//               Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Refresh failed', showConfirmButton: false, timer: 1400 });
//             } finally {
//               refreshBtn.disabled = false;
//               refreshBtn.textContent = 'Refresh';
//             }
//           });
//         }
//       }
//     });
//   };

//   // Updated Live Monitoring handler (keeps same behavior)
//   const handleOpenLiveMonitoring = async () => {
//     const container = document.createElement('div');
//     container.innerHTML = `
//       <div style="text-align:left">
//         <div style="display:flex; gap:12px; justify-content:space-between;">
//           <div style="flex:1">
//             <div style="font-size:13px; color:#6b7280">System Health</div>
//             <div id="live-health" style="font-weight:700; font-size:22px; margin-top:6px">--%</div>
//             <div style="margin-top:6px; color:#6b7280; font-size:13px">All systems operational</div>
//           </div>
//           <div style="flex:1">
//             <div style="font-size:13px; color:#6b7280">Active Connections</div>
//             <div id="live-connections" style="font-weight:700; font-size:22px; margin-top:6px">--</div>
//             <div style="margin-top:6px; color:#6b7280; font-size:13px">Devices connected</div>
//           </div>
//           <div style="flex:1">
//             <div style="font-size:13px; color:#6b7280">Events / min</div>
//             <div id="live-events" style="font-weight:700; font-size:22px; margin-top:6px">--</div>
//             <div style="margin-top:6px; color:#6b7280; font-size:13px">Live processing</div>
//           </div>
//         </div>
//         <div style="margin-top:12px; display:flex; gap:8px; align-items:center;">
//           <button id="live-toggle" style="padding:8px 10px; border-radius:8px; border:none; cursor:pointer; background:#ef4444; color:white;">Pause</button>
//           <div style="flex:1"></div>
//         </div>
//         <div style="margin-top:12px">
//           <div style="font-size:13px; color:#6b7280">Recent Log</div>
//           <pre id="live-log" style="background:#f3f4f6; padding:8px; border-radius:8px; height:90px; overflow:auto; margin-top:6px;">Initializing live feed...</pre>
//         </div>
//       </div>
//     `;

//     let paused = false;
//     let intervalId = null;

//     await Swal.fire({
//       title: '<strong>Live Monitoring Preview</strong>',
//       html: container,
//       showCloseButton: true,
//       showConfirmButton: false,
//       customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' },
//       willOpen: () => {
//         const healthEl = container.querySelector('#live-health');
//         const connEl = container.querySelector('#live-connections');
//         const eventsEl = container.querySelector('#live-events');
//         const logEl = container.querySelector('#live-log');
//         const toggleBtn = container.querySelector('#live-toggle');
//         const updateLive = () => {
//           const health = stats && stats.ambulances != null ? `${(98.5 + (Math.random() - 0.5) * 0.6).toFixed(1)}%` : `${(90 + Math.random() * 10).toFixed(1)}%`;
//           const connections = stats && stats.trafficSignals != null ? (stats.trafficSignals + Math.round(Math.random() * 5)) : Math.round(200 + Math.random() * 100);
//           const events = stats && stats.revenue != null ? `${(1000 + Math.round(Math.random() * 500))} / min` : `${Math.round(800 + Math.random() * 700)} / min`;
//           if (healthEl) healthEl.textContent = health;
//           if (connEl) connEl.textContent = connections;
//           if (eventsEl) eventsEl.textContent = events;
//           if (logEl) {
//             const ts = new Date().toLocaleTimeString();
//             const line = `[${ts}] health ${health}, connections ${connections}\n`;
//             logEl.textContent = (line + logEl.textContent).split('\n').slice(0, 12).join('\n');
//           }
//         };

//         updateLive();
//         intervalId = setInterval(() => {
//           if (!paused) updateLive();
//         }, 1000);

//         if (toggleBtn) {
//           toggleBtn.addEventListener('click', () => {
//             paused = !paused;
//             toggleBtn.textContent = paused ? 'Resume' : 'Pause';
//             toggleBtn.style.background = paused ? '#10b981' : '#ef4444';
//             Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: paused ? 'Live preview paused' : 'Live preview resumed', showConfirmButton: false, timer: 1000 });
//           });
//         }
//       },
//       willClose: () => {
//         if (intervalId) clearInterval(intervalId);
//         intervalId = null;
//       }
//     });
//   };

//   // ------------------ Logout handler ------------------
//   const handleLogout = async () => {
//     const token = localStorage.getItem('token') || sessionStorage.getItem('token');

//     if (!token) {
//       localStorage.removeItem('token');
//       sessionStorage.removeItem('token');
//       navigate('/login', { replace: true });
//       return;
//     }

//     try {
//       const response = await fetch('http://localhost:5001/api/auth/logout', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const resData = await response.json().catch(() => ({}));
//       localStorage.removeItem('token');
//       sessionStorage.removeItem('token');

//       Swal.fire({
//         icon: 'success',
//         title: 'Logged out',
//         text: resData?.message || 'You have been logged out successfully.',
//         confirmButtonColor: '#3085d6',
//       });

//       navigate('/login', { replace: true });
//     } catch (err) {
//       localStorage.removeItem('token');
//       sessionStorage.removeItem('token');

//       Swal.fire({
//         icon: 'warning',
//         title: 'Logged out locally',
//         text: 'Could not contact server but you are logged out locally.',
//         confirmButtonColor: '#3085d6',
//       });

//       navigate('/login', { replace: true });
//     }
//   };

//   // ------------------ render ------------------
//   const pieTotal = violationTypes.reduce((s, it) => s + (it.value || 0), 0);

//   return (
//     <div className="dashboard-container">
//       {/* Sidebar */}
//       <div className="sidebar">
//         <div className="sidebar-header">
//           <h1 className="logo">SurakshaPath</h1>
//           <p className="subtitle">Traffic Management System</p>
//         </div>

//         <nav className="sidebar-nav">
//           <div className="nav-item active">
//             <span className="nav-icon">⊞</span>
//             <span>Dashboard</span>
//           </div>
//           <div className="nav-item" onClick={() => navigate('/ambulance-tracker')}>
//             <span className="nav-icon">📍</span>
//             <span>Ambulance Tracker</span>
//           </div>
//           <div className="nav-item" onClick={() => navigate('/traffic-signal')}>
//             <span className="nav-icon">⚡</span>
//             <span>Traffic Signals</span>
//           </div>
//           <div className="nav-item" onClick={() => navigate('/helmet-violation')}>
//             <span className="nav-icon">🛡️</span>
//             <span>Helmet Violations</span>
//           </div>
//         </nav>

//         <div className="sidebar-footer">
//           <div className="last-updated">
//             <p>Last Updated</p>
//             <p>{currentTime.toLocaleTimeString()}</p>
//           </div>

//           <div className="logout-container">
//             <button onClick={handleLogout} className="logout-button">
//               <span className="logout-icon">🔒</span>
//               Logout
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="main-content">
//         {/* Header */}
//         <div className="main-header">
//           <div className="header-left">
//             <h1>Traffic Control Dashboard</h1>
//             <p>Real-time monitoring and management system</p>
//           </div>
//           <div className="header-right">
//             <div className="notification-icon">
//               <span>🔔</span>
//               <span className="notification-badge">3</span>
//             </div>
//             <div className="profile-avatar">A</div>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         <div className="stats-grid">
//           <div className="stat-card blue">
//             <div className="stat-content">
//               <div>
//                 <h3 className="stat-label">Active Ambulances</h3>
//                 <div className="stat-number">
//                   {statsLoading && stats.ambulances === null ? '—' : (stats.ambulances ?? '0')}
//                 </div>
//               </div>
//             </div>
//             <div className="stat-icon">📍</div>
//           </div>

//           <div className="stat-card green">
//             <div className="stat-content">
//               <div>
//                 <h3 className="stat-label">Traffic Signals</h3>
//                 <div className="stat-number">
//                   {statsLoading && stats.trafficSignals === null ? '—' : (stats.trafficSignals ?? '0')}
//                 </div>
//               </div>
//             </div>
//             <div className="stat-icon">⚡</div>
//           </div>

//           <div className="stat-card red">
//             <div className="stat-content">
//               <div>
//                 <h3 className="stat-label">Total Violations</h3>
//                 <div className="stat-number">
//                   {statsLoading && stats.violations === null ? '—' : (stats.violations ?? '0')}
//                 </div>
//               </div>
//             </div>
//             <div className="stat-icon">⚠️</div>
//           </div>

//           <div className="stat-card purple">
//             <div className="stat-content">
//               <div>
//                 <h3 className="stat-label">Revenue</h3>
//                 <div className="stat-number">
//                   {statsLoading && stats.revenue === null ? '—' : (typeof stats.revenue === 'number' ? fmtINR(stats.revenue) : (stats.revenue ? fmtINR(Number(stats.revenue)) : '₹0'))}
//                 </div>
//               </div>
//             </div>
//             <div className="stat-icon">📊</div>
//           </div>
//         </div>

//         {/* Tabs */}
//         {/* <div className="tabs-container">
//           <div className="tabs">
//             <div className="tab active">Overview</div>
//             <div className="tab" onClick={handleOpenAnalytics}>Analytics</div>
//             <div className="tab" onClick={handleOpenLiveMonitoring}>Live Monitoring</div>
//           </div>
//         </div> */}

//         {/* Tabs */}
// <div className="tabs-container">
//   <div className="tabs">
//     <div
//       className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
//       onClick={() => {
//         setActiveTab('overview');
//         setShowAnalyticsPanel(false);            // hide inline analytics if open
//       }}
//     >
//       Overview
//     </div>

//     <div
//       className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
//       onClick={async () => {
//         setActiveTab('analytics');
//         setShowAnalyticsPanel(true);
//         await fetchAnalytics(true);             // load analytics fresh
//         // keep the small Swal snapshot if you want - existing code still shows it inside handleOpenAnalytics
//       }}
//     >
//       Analytics
//     </div>

//     <div
//       className={`tab ${activeTab === 'live' ? 'active' : ''}`}
//       onClick={async () => {
//         setActiveTab('live');
//         // you can either open the Swal live preview
//         // or navigate to full live page: keep existing behaviour
//         await handleOpenLiveMonitoring();
//       }}
//     >
//       Live Monitoring
//     </div>
//   </div>
// </div>


//         {/* Inline Analytics Panel (renders when showAnalyticsPanel true) */}
//         {showAnalyticsPanel && (
//           <div style={{ marginTop: 18, background: '#fff', padding: 18, borderRadius: 12, boxShadow: '0 6px 18px rgba(15,23,42,0.06)' }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
//               <div>
//                 <h3 style={{ margin: 0 }}>Analytics</h3>
//                 <p style={{ margin: '6px 0 0', color: '#6b7280' }}>Deeper insights, trends and violation breakdowns</p>
//               </div>

//               <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
//                 <select value={range} onChange={(e) => { setRange(e.target.value); fetchAnalytics(true); }} style={{ padding: '8px 10px', borderRadius: 8 }}>
//                   <option value="12h">Last 12 hours</option>
//                   <option value="24h">Last 24 hours</option>
//                   <option value="7d">Last 7 days</option>
//                 </select>

//                 <button onClick={() => fetchAnalytics(true)} style={{ padding: '8px 12px', background: '#7c3aed', color: 'white', borderRadius: 8, border: 'none' }}>
//                   Refresh
//                 </button>

//                 <button onClick={() => setShowAnalyticsPanel(false)} style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: 8, border: '1px solid #e5e7eb' }}>
//                   Close
//                 </button>
//               </div>
//             </div>

//             {/* KPI row */}
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
//               <div style={{ padding: 12, borderRadius: 10, background: '#eef2ff' }}>
//                 <div style={{ color: '#6b7280' }}>Active Ambulances</div>
//                 <div style={{ fontSize: 20, fontWeight: 700 }}>{statsLoading ? '—' : (stats.ambulances ?? 0)}</div>
//               </div>
//               <div style={{ padding: 12, borderRadius: 10, background: '#ecfdf5' }}>
//                 <div style={{ color: '#6b7280' }}>Traffic Signals</div>
//                 <div style={{ fontSize: 20, fontWeight: 700 }}>{statsLoading ? '—' : (stats.trafficSignals ?? 0)}</div>
//               </div>
//               <div style={{ padding: 12, borderRadius: 10, background: '#fff1f2' }}>
//                 <div style={{ color: '#6b7280' }}>Violations</div>
//                 <div style={{ fontSize: 20, fontWeight: 700 }}>{statsLoading ? '—' : (stats.violations ?? 0)}</div>
//               </div>
//               <div style={{ padding: 12, borderRadius: 10, background: '#f3e8ff' }}>
//                 <div style={{ color: '#6b7280' }}>Revenue</div>
//                 <div style={{ fontSize: 20, fontWeight: 700 }}>{statsLoading ? '—' : fmtINR(stats.revenue ?? 0)}</div>
//               </div>
//             </div>

//             {/* charts */}
//             <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
//               <div style={{ padding: 12, borderRadius: 8, background: '#fff' }}>
//                 <h4 style={{ marginTop: 0 }}>Events / Violations Trend</h4>
//                 <div style={{ height: 260 }}>
//                   <ResponsiveContainer width="100%" height="100%">
//                     <LineChart data={timeseries}>
//                       <CartesianGrid strokeDasharray="3 3" />
//                       <XAxis dataKey="timeLabel" />
//                       <YAxis />
//                       <Tooltip />
//                       <Line type="monotone" dataKey="events" name="Events / min" stroke="#7c3aed" strokeWidth={2} dot={false} />
//                       <Line type="monotone" dataKey="violations" name="Violations" stroke="#ef4444" strokeWidth={2} dot={false} />
//                     </LineChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>

//               <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//                 <div style={{ padding: 12, borderRadius: 8, background: '#fff' }}>
//                   <h4 style={{ marginTop: 0 }}>Violation Types</h4>
//                   <div style={{ height: 220 }}>
//                     <ResponsiveContainer width="100%" height="100%">
//                       <PieChart>
//                         <Pie
//                           data={violationTypes}
//                           dataKey="value"
//                           nameKey="name"
//                           cx="50%"
//                           cy="50%"
//                           outerRadius={70}
//                           label={(entry) => `${entry.name} (${Math.round((entry.value / Math.max(1, pieTotal)) * 100)}%)`}
//                         >
//                           {violationTypes.map((entry, idx) => (
//                             <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
//                           ))}
//                         </Pie>
//                         <Legend />
//                       </PieChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </div>

//                 <div style={{ padding: 12, borderRadius: 8, background: '#fff', minHeight: 120 }}>
//                   <h4 style={{ marginTop: 0 }}>Recent Violations</h4>
//                   {analyticsLoading ? (
//                     <div style={{ color: '#6b7280' }}>Loading...</div>
//                   ) : recentList.length === 0 ? (
//                     <div style={{ color: '#6b7280' }}>No recent data</div>
//                   ) : (
//                     <ul style={{ margin: 0, paddingLeft: 14 }}>
//                       {recentList.map((r, i) => (
//                         <li key={i} style={{ marginBottom: 6 }}>
//                           <strong>{r.type ?? r.title ?? 'Violation'}</strong> — {r.time ?? r.date ?? '—'} • {r.fine ? fmtINR(r.fine) : (r.amount ? fmtINR(r.amount) : '')}
//                         </li>
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Live System Status */}
//         <div className="status-section" style={{ marginTop: 18 }}>
//           <div className="section-header">
//             <span className="pulse-icon">📈</span>
//             <h2>Live System Status</h2>
//           </div>

//           <div className="status-grid">
//             <div className="status-card health">
//               <h3>System Health</h3>
//               <div className="status-value">{systemHealth}</div>
//               <p>All systems operational</p>
//             </div>

//             <div className="status-card connections">
//               <h3>Active Connections</h3>
//               <div className="status-value">{activeConnections}</div>
//               <p>Devices connected</p>
//             </div>

//             <div className="status-card processing">
//               <h3>Data Processing</h3>
//               <div className="status-value">{dataProcessing}</div>
//               <p>Events per minute</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;



// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/Dashboard.css';

// charts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// import the services
import { getStats as getAmbulanceStats } from '../services/ambulanceServices';
import { getTrafficStats } from '../services/trafficServices';
import { getHelmetStats } from '../services/helmetServices';
import { getChallanStats } from '../services/challanServices';

const COLORS = ['#7c3aed', '#ef4444', '#10b981', '#06b6d4', '#f59e0b'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // which tab is active: 'overview' | 'analytics' | 'live'
  const [activeTab, setActiveTab] = useState('overview');

  // NEW state for stats
  const [stats, setStats] = useState({
    ambulances: null,
    trafficSignals: null,
    violations: null,
    revenue: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // analytics UI state (rendered inside this page)
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [range, setRange] = useState('12h'); // '12h' | '24h' | '7d'
  const [timeseries, setTimeseries] = useState([]);
  const [violationTypes, setViolationTypes] = useState([]);
  const [recentList, setRecentList] = useState([]);

  // live monitoring state
  const [showLivePanel, setShowLivePanel] = useState(false);
  const [liveHealth, setLiveHealth] = useState('--%');
  const [liveConnections, setLiveConnections] = useState('--');
  const [liveEvents, setLiveEvents] = useState('-- / min');
  const [liveLogs, setLiveLogs] = useState([]);
  const [livePaused, setLivePaused] = useState(false);
  const liveIntervalRef = useRef(null);

  // format INR
  const fmtINR = (n) => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
    } catch {
      return `₹${Number(n || 0).toLocaleString()}`;
    }
  };

  // ------------------ fetchAllStats (keeps your original implementation) ------------------
  const fetchAllStats = async () => {
    setStatsLoading(true);
    setStatsError(null);

    try {
      const [ambRes, trafficRes] = await Promise.allSettled([
        getAmbulanceStats({ shallow: true }),
        getTrafficStats({ shallow: true })
      ]);

      let helmetResult = null;
      try {
        helmetResult = await getHelmetStats();
        console.log('[DEBUG] getHelmetStats() returned ->', helmetResult);
      } catch (e) {
        console.warn('[DEBUG] getHelmetStats() threw', e);
        helmetResult = null;
      }

      let challanResult = null;
      try {
        challanResult = await getChallanStats?.();
        console.log('[DEBUG] getChallanStats() returned ->', challanResult);
      } catch (e) {
        console.warn('[DEBUG] getChallanStats() threw', e);
        challanResult = null;
      }

      const next = { ambulances: null, trafficSignals: null, violations: null, revenue: null };

      if (ambRes?.status === 'fulfilled') {
        const d = ambRes.value?.data || ambRes.value || {};
        next.ambulances = d?.totalActive ?? d?.total ?? d?.count ?? null;
      }

      if (trafficRes?.status === 'fulfilled') {
        const d = trafficRes.value?.data || trafficRes.value || {};
        next.trafficSignals = d?.totalSignals ?? d?.total ?? d?.count ?? null;
      }

      if (helmetResult && (helmetResult.data || helmetResult.totalViolations != null || helmetResult.total != null)) {
        const d = helmetResult.data || helmetResult;
        next.violations = d?.totalViolations ?? d?.count ?? d?.total ?? null;
      }

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
          d?.fine_amount ??
          d?.total ?? null;
        return cand != null ? safeNumber(cand) : null;
      };

      const challanRev = extractRevenueFrom(challanResult);
      if (challanRev != null && challanRev !== 0) {
        next.revenue = challanRev;
      } else {
        const helmetRev = extractRevenueFrom(helmetResult);
        if (helmetRev != null && helmetRev !== 0) {
          next.revenue = helmetRev;
        } else {
          try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch('http://localhost:5001/api/violations', { headers });
            if (res.ok) {
              const json = await res.json().catch(() => null);
              const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : (json?.violations || []));
              let sum = 0;
              for (const it of list) {
                const raw =
                  it?.fine_amount ??
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

  // ------------------ clock ------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ------------------ token check ------------------
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

    checkToken();
    const interval = setInterval(checkToken, 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  // ------------------ fetch profile ------------------
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

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

  // -------- Live System Status (derived dynamic values) ----------
  const systemHealth = useMemo(() => {
    if (statsLoading) return '—';
    const base = 98.0 + (Math.random() * 0.6);
    return base.toFixed(1) + '%';
  }, [statsLoading, stats]);

  const activeConnections = useMemo(() => {
    if (statsLoading) return '—';
    const base = stats.trafficSignals ?? Math.floor(200 + Math.random() * 100);
    return base;
  }, [statsLoading, stats]);

  const dataProcessing = useMemo(() => {
    if (statsLoading) return '—';
    const base = Math.floor(1000 + Math.random() * 500);
    return base.toLocaleString();
  }, [statsLoading, stats]);

  // ------------------ Analytics fetching (for inline panel) ------------------
  const generateDemoTimeseries = (points = 12) => {
    const now = Date.now();
    return new Array(points).fill(0).map((_, i) => {
      const t = new Date(now - (points - 1 - i) * 60 * 60 * 1000);
      return {
        timeLabel: t.getHours().toString().padStart(2, '0') + ':' + t.getMinutes().toString().padStart(2, '0'),
        ambulances: Math.max(1, Math.round(3 + Math.sin(i / 2) * 1.5 + Math.random() * 1.5)),
        signals: Math.max(3, Math.round(5 + Math.cos(i / 3) * 1.5 + Math.random() * 2)),
        violations: Math.max(0, Math.round(5 + Math.sin(i / 3) * 3 + Math.random() * 4)),
        events: Math.round(900 + Math.random() * 500)
      };
    });
  };

  const transformViolationTypes = (rawList = []) => {
    if (!rawList || rawList.length === 0) {
      return [
        { name: 'Helmet', value: stats.violations ?? 1 },
        { name: 'Signal Jump', value: Math.max(0, Math.round((stats.violations ?? 1) * 0.25)) },
        { name: 'Speeding', value: Math.max(0, Math.round((stats.violations ?? 1) * 0.15)) }
      ];
    }
    return rawList.map((r) => ({ name: r.type ?? r.name, value: Number(r.count ?? r.value ?? 0) }));
  };

  const fetchAnalytics = async (force = false) => {
    // if analytics already loaded and not forced, just show
    if (!force && timeseries.length > 0) {
      return;
    }

    setAnalyticsLoading(true);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      let ts = null;
      let types = null;
      let recent = [];

      try {
        const res = await fetch(`http://localhost:5001/api/analytics?range=${range}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.timeseries) ts = json.timeseries;
          if (json?.types) types = json.types;
          if (json?.recent) recent = json.recent;
        }
      } catch (e) {
        // ignore - fallback to demo
        console.warn('No /api/analytics or fetch failed', e);
      }

      const points = range === '12h' ? 12 : range === '24h' ? 24 : 7;
      if (!ts || !Array.isArray(ts) || ts.length === 0) {
        ts = generateDemoTimeseries(points);
      } else {
        // ensure shape includes timeLabel
        ts = ts.slice(-points).map((p, idx) => ({
          timeLabel: p.timeLabel ?? (`t${idx}`),
          ambulances: Number(p.ambulances ?? p.activeAmbulances ?? 0),
          violations: Number(p.violations ?? p.totalViolations ?? 0),
          events: Number(p.events ?? p.eventsPerMin ?? p.events_per_min ?? 0)
        }));
      }

      if (!types || !Array.isArray(types) || types.length === 0) {
        types = transformViolationTypes([]);
      } else {
        types = transformViolationTypes(types);
      }

      setTimeseries(ts);
      setViolationTypes(types);
      setRecentList(recent.slice(0, 8));
    } catch (e) {
      console.error('fetchAnalytics failed', e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // ------------------ Live feed utilities ------------------
  const pushLog = (line) => {
    setLiveLogs((prev) => [line, ...prev].slice(0, 12)); // keep latest 12 lines
  };

  const updateLiveValues = () => {
    // health: if ambulances exist keep high, else random lower
    const health = stats && stats.ambulances != null
      ? `${(98.5 + (Math.random() - 0.5) * 0.6).toFixed(1)}%`
      : `${(90 + Math.random() * 10).toFixed(1)}%`;
    const connections = stats && stats.trafficSignals != null
      ? stats.trafficSignals + Math.round(Math.random() * 5)
      : Math.round(200 + Math.random() * 100);
    const events = stats && stats.revenue != null
      ? 1000 + Math.round(Math.random() * 500)
      : 800 + Math.round(Math.random() * 700);

    setLiveHealth(health);
    setLiveConnections(connections);
    setLiveEvents(`${events.toLocaleString()} / min`);
    pushLog(`[${new Date().toLocaleTimeString()}] health ${health}, connections ${connections}, events ${events}`);
  };

  const startLiveFeed = () => {
    // stop existing if any
    stopLiveFeed();
    updateLiveValues();
    liveIntervalRef.current = setInterval(() => {
      if (!livePaused) updateLiveValues();
    }, 1000);
  };

  const stopLiveFeed = () => {
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
  };

  useEffect(() => {
    // start or stop feed based on showLivePanel
    if (showLivePanel) {
      startLiveFeed();
    } else {
      stopLiveFeed();
    }
    // cleanup on unmount
    return () => stopLiveFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLivePanel, livePaused, stats]);

  // ------------------ Handlers ------------------
  const handleOpenAnalytics = async () => {
    setActiveTab('analytics');
    setShowAnalyticsPanel(true);
    setShowLivePanel(false);
    await fetchAnalytics(true);

    // keep the small modal available (optional)
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="text-align:left">
        <div style="display:flex; gap:12px; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:13px; color:#6b7280">Active Ambulances</div>
            <div style="font-weight:700; font-size:20px">${statsLoading && stats.ambulances === null ? '—' : (stats.ambulances ?? '0')}</div>
          </div>
          <div>
            <div style="font-size:13px; color:#6b7280">Traffic Signals</div>
            <div style="font-weight:700; font-size:20px">${statsLoading && stats.trafficSignals === null ? '—' : (stats.trafficSignals ?? '0')}</div>
          </div>
          <div>
            <div style="font-size:13px; color:#6b7280">Violations</div>
            <div style="font-weight:700; font-size:20px">${statsLoading && stats.violations === null ? '—' : (stats.violations ?? '0')}</div>
          </div>
          <div>
            <div style="font-size:13px; color:#6b7280">Revenue</div>
            <div style="font-weight:700; font-size:20px">${statsLoading && stats.revenue === null ? '—' : (typeof stats.revenue === 'number' ? fmtINR(stats.revenue) : (stats.revenue ? fmtINR(Number(stats.revenue)) : '₹0'))}</div>
          </div>
        </div>
        <div style="margin-top:12px; display:flex; gap:8px; align-items:center;">
          <button id="analytics-refresh" style="padding:8px 10px; border-radius:8px; border:none; cursor:pointer; background:#7c3aed; color:white;">Refresh</button>
          <div style="flex:1"></div>
        </div>
        <p style="margin-top:10px; color:#6b7280; font-size:13px">Quick snapshot. Full analytics appears below.</p>
      </div>
    `;
    await Swal.fire({
      title: '<strong>Analytics Summary</strong>',
      html: container,
      showConfirmButton: false,
      showCloseButton: true,
      customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' },
      willOpen: () => {
        const refreshBtn = container.querySelector('#analytics-refresh');
        if (refreshBtn) {
          refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.textContent = 'Refreshing...';
            try {
              await fetchAllStats();
              await fetchAnalytics(true);
              Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Analytics refreshed', showConfirmButton: false, timer: 1200 });
            } catch {
              Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Refresh failed', showConfirmButton: false, timer: 1400 });
            } finally {
              refreshBtn.disabled = false;
              refreshBtn.textContent = 'Refresh';
            }
          });
        }
      }
    });
  };

  // Updated Live Monitoring handler to open inline live panel
  const handleOpenLiveMonitoring = async () => {
    // set active tab and open inline panel (no Swal)
    setActiveTab('live');
    setShowAnalyticsPanel(false);
    setShowLivePanel(true);
    setLivePaused(false);
    setLiveLogs([]);
    startLiveFeed();
  };

  // ------------------ Logout handler ------------------
  const handleLogout = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      navigate('/login', { replace: true });
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const resData = await response.json().catch(() => ({}));
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

  // ------------------ render ------------------
  const pieTotal = violationTypes.reduce((s, it) => s + (it.value || 0), 0);

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
          <div className="nav-item" onClick={() => navigate('/ambulance-tracker')}>
            <span className="nav-icon">📍</span>
            <span>Ambulance Tracker</span>
          </div>
          <div className="nav-item" onClick={() => navigate('/traffic-signal')}>
            <span className="nav-icon">⚡</span>
            <span>Traffic Signals</span>
          </div>
          <div className="nav-item" onClick={() => navigate('/helmet-violation')}>
            <span className="nav-icon">🛡️</span>
            <span>Helmet Violations</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="last-updated">
            <p>Last Updated</p>
            <p>{currentTime.toLocaleTimeString()}</p>
          </div>

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
            <div
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('overview');
                setShowAnalyticsPanel(false);
                setShowLivePanel(false);
                setLivePaused(false);
              }}
            >
              Overview
            </div>

            <div
              className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={async () => {
                setActiveTab('analytics');
                setShowAnalyticsPanel(true);
                setShowLivePanel(false);
                await fetchAnalytics(true);
              }}
            >
              Analytics
            </div>

            <div
              className={`tab ${activeTab === 'live' ? 'active' : ''}`}
              onClick={async () => {
                // open inline live panel
                await handleOpenLiveMonitoring();
              }}
            >
              Live Monitoring
            </div>
          </div>
        </div>

        {/* Inline Analytics Panel (renders when showAnalyticsPanel true) */}
        {showAnalyticsPanel && (
          <div style={{ marginTop: 18, background: '#fff', padding: 18, borderRadius: 12, boxShadow: '0 6px 18px rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>Analytics</h3>
                <p style={{ margin: '6px 0 0', color: '#6b7280' }}>Deeper insights, trends and violation breakdowns</p>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={range} onChange={(e) => { setRange(e.target.value); fetchAnalytics(true); }} style={{ padding: '8px 10px', borderRadius: 8 }}>
                  <option value="12h">Last 12 hours</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                </select>

                <button onClick={() => fetchAnalytics(true)} style={{ padding: '8px 12px', background: '#7c3aed', color: 'white', borderRadius: 8, border: 'none' }}>
                  Refresh
                </button>

                <button onClick={() => setShowAnalyticsPanel(false)} style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  Close
                </button>
              </div>
            </div>

            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
              <div style={{ padding: 12, borderRadius: 10, background: '#eef2ff' }}>
                <div style={{ color: '#6b7280' }}>Active Ambulances</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{statsLoading ? '—' : (stats.ambulances ?? 0)}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: '#ecfdf5' }}>
                <div style={{ color: '#6b7280' }}>Traffic Signals</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{statsLoading ? '—' : (stats.trafficSignals ?? 0)}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: '#fff1f2' }}>
                <div style={{ color: '#6b7280' }}>Violations</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{statsLoading ? '—' : (stats.violations ?? 0)}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: '#f3e8ff' }}>
                <div style={{ color: '#6b7280' }}>Revenue</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{statsLoading ? '—' : fmtINR(stats.revenue ?? 0)}</div>
              </div>
            </div>

            {/* charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              <div style={{ padding: 12, borderRadius: 8, background: '#fff' }}>
                <h4 style={{ marginTop: 0 }}>Events / Violations Trend</h4>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeseries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timeLabel" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="events" name="Events / min" stroke="#7c3aed" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="violations" name="Violations" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 12, borderRadius: 8, background: '#fff' }}>
                  <h4 style={{ marginTop: 0 }}>Violation Types</h4>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={violationTypes}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={(entry) => `${entry.name} (${Math.round((entry.value / Math.max(1, pieTotal)) * 100)}%)`}
                        >
                          {violationTypes.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ padding: 12, borderRadius: 8, background: '#fff', minHeight: 120 }}>
                  <h4 style={{ marginTop: 0 }}>Recent Violations</h4>
                  {analyticsLoading ? (
                    <div style={{ color: '#6b7280' }}>Loading...</div>
                  ) : recentList.length === 0 ? (
                    <div style={{ color: '#6b7280' }}>No recent data</div>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: 14 }}>
                      {recentList.map((r, i) => (
                        <li key={i} style={{ marginBottom: 6 }}>
                          <strong>{r.type ?? r.title ?? 'Violation'}</strong> — {r.time ?? r.date ?? '—'} • {r.fine ? fmtINR(r.fine) : (r.amount ? fmtINR(r.amount) : '')}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inline Live Monitoring Panel */}
        {showLivePanel && (
          <div style={{ marginTop: 18, background: '#fff', padding: 18, borderRadius: 12, boxShadow: '0 6px 18px rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>Live Monitoring</h3>
                <p style={{ margin: '6px 0 0', color: '#6b7280' }}>Real-time preview of system health, connections and events</p>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => {
                    // refresh base by refetching stats and restarting feed
                    fetchAllStats();
                    setLiveLogs([]);
                    updateLiveValues();
                  }}
                  style={{ padding: '8px 12px', background: '#7c3aed', color: 'white', borderRadius: 8, border: 'none' }}
                >
                  Refresh
                </button>

                <button
                  onClick={() => {
                    setLivePaused((p) => !p);
                  }}
                  style={{ padding: '8px 12px', background: livePaused ? '#10b981' : '#ef4444', color: 'white', borderRadius: 8, border: 'none' }}
                >
                  {livePaused ? 'Resume' : 'Pause'}
                </button>

                <button
                  onClick={() => {
                    setShowLivePanel(false);
                    setActiveTab('overview');
                    setLivePaused(false);
                    stopLiveFeed();
                  }}
                  style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: 8, border: '1px solid #e5e7eb' }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* live KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 12 }}>
              <div style={{ padding: 12, borderRadius: 10, background: '#e6f9f0' }}>
                <div style={{ color: '#6b7280' }}>System Health</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{liveHealth}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: '#eef6ff' }}>
                <div style={{ color: '#6b7280' }}>Active Connections</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{liveConnections}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: '#f8f0ff' }}>
                <div style={{ color: '#6b7280' }}>Events / min</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{liveEvents}</div>
              </div>
            </div>

            {/* live logs */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, padding: 12, borderRadius: 8, background: '#fff', minHeight: 140 }}>
                <h4 style={{ marginTop: 0 }}>Recent Log</h4>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', maxHeight: 140, overflow: 'auto', background: '#f3f4f6', padding: 8, borderRadius: 6 }}>
                  {liveLogs.length === 0 ? 'Initializing live feed...' : liveLogs.join('\n')}
                </pre>
              </div>

              <div style={{ width: 240, padding: 12, borderRadius: 8, background: '#fff' }}>
                <h4 style={{ marginTop: 0 }}>Quick Stats</h4>
                <div style={{ color: '#6b7280', marginBottom: 8 }}>Base ambulances: {stats.ambulances ?? '—'}</div>
                <div style={{ color: '#6b7280', marginBottom: 8 }}>Base signals: {stats.trafficSignals ?? '—'}</div>
                <div style={{ color: '#6b7280' }}>Base violations: {stats.violations ?? '—'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Live System Status */}
        <div className="status-section" style={{ marginTop: 18 }}>
          <div className="section-header">
            <span className="pulse-icon">📈</span>
            <h2>Live System Status</h2>
          </div>

          <div className="status-grid">
            <div className="status-card health">
              <h3>System Health</h3>
              <div className="status-value">{systemHealth}</div>
              <p>All systems operational</p>
            </div>

            <div className="status-card connections">
              <h3>Active Connections</h3>
              <div className="status-value">{activeConnections}</div>
              <p>Devices connected</p>
            </div>

            <div className="status-card processing">
              <h3>Data Processing</h3>
              <div className="status-value">{dataProcessing}</div>
              <p>Events per minute</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// TrafficSignals.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
import { useRef } from 'react'; 



const TrafficSignals = () => {
    const navigate = useNavigate();
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [signals, setSignals] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false); // New state to track initialization


  useEffect(() => {
  const fetchSignals = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/signal");
      if (!response.ok) throw new Error("Failed to fetch signals");
      const data = await response.json();

      // Normalize MongoDB data → frontend format
      const normalizedData = data.map(sig => ({
        id: sig.id,
        location: sig.location || sig.name || 'Unknown',
        status: sig.status,
        currentLight: sig.currentLights.red
          ? 'red'
          : sig.currentLights.yellow
          ? 'yellow'
          : 'green',
        timer: sig.timer,
        maxTimer: sig.maxTimer || 60,
        coordinates: sig.coords
          ? { lat: sig.coords.lat, lng: sig.coords.lng }
          : { lat: 0, lng: 0 },
        lastMaintenance: sig.lastMaintenance || 'N/A',
        avgWaitTime: sig.avgWaitTime || 'N/A',
        trafficFlow: sig.trafficFlow || 'Unknown',
        emergencyOverride: sig.emergencyOverride || false,
        faultStatus: sig.faultStatus || 'Normal',
        powerStatus: sig.powerStatus || 'Online',
        connectivity: sig.connectivity || 'Strong',
      }));

      setSignals(normalizedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchSignals();
}, []);

// Auto-sync signals every 5 seconds
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        await axios.post("http://localhost:5001/api/signal/sync", { signals });
        setIsOnline(true);
        setLastSync(new Date().toLocaleTimeString());
        console.log("✅ Signals synced successfully");
      } catch (err) {
        setIsOnline(false);
        console.error("❌ Sync failed:", err);
      }
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [signals]);

  // Manual Sync button
  const handleManualSync = async () => {
    try {
      await axios.post("http://localhost:5001/api/signal/sync", { signals });
      setLastSync(new Date().toLocaleTimeString());
      setIsOnline(true);
    } catch (err) {
      setIsOnline(false);
      console.error("Manual sync failed:", err);
    }
  };


  // Mock traffic signals data
  // const [signals, setSignals] = useState([
  //   {
  //     id: 'TS001',
  //     location: 'Ring Road & VIP Road Junction',
  //     status: 'Active',
  //     currentLight: 'green',
  //     timer: 45,
  //     maxTimer: 60,
  //     coordinates: { lat: 21.1702, lng: 72.8311 },
  //     lastMaintenance: '2024-07-15',
  //     avgWaitTime: '2.3 min',
  //     trafficFlow: 'High',
  //     emergencyOverride: false,
  //     faultStatus: 'Normal',
  //     powerStatus: 'Online',
  //     connectivity: 'Strong'
  //   },
  //   {
  //     id: 'TS002', 
  //     location: 'Athwa Lines Main Road',
  //     status: 'Active',
  //     currentLight: 'red',
  //     timer: 25,
  //     maxTimer: 45,
  //     coordinates: { lat: 21.1594, lng: 72.7847 },
  //     lastMaintenance: '2024-07-20',
  //     avgWaitTime: '1.8 min',
  //     trafficFlow: 'Medium',
  //     emergencyOverride: false,
  //     faultStatus: 'Normal',
  //     powerStatus: 'Online',
  //     connectivity: 'Strong'
  //   },
  //   {
  //     id: 'TS003',
  //     location: 'Citylight Area Circle',
  //     status: 'Maintenance',
  //     currentLight: 'yellow',
  //     timer: 0,
  //     maxTimer: 30,
  //     coordinates: { lat: 21.2180, lng: 72.8339 },
  //     lastMaintenance: '2024-07-10',
  //     avgWaitTime: '4.2 min',
  //     trafficFlow: 'Low',
  //     emergencyOverride: false,
  //     faultStatus: 'Sensor Issue',
  //     powerStatus: 'Online',
  //     connectivity: 'Weak'
  //   },
  //   {
  //     id: 'TS004',
  //     location: 'Dumas Road Junction',
  //     status: 'Offline',
  //     currentLight: 'red',
  //     timer: 0,
  //     maxTimer: 50,
  //     coordinates: { lat: 21.1030, lng: 72.6694 },
  //     lastMaintenance: '2024-07-25',
  //     avgWaitTime: 'N/A',
  //     trafficFlow: 'High',
  //     emergencyOverride: false,
  //     faultStatus: 'Power Failure',
  //     powerStatus: 'Offline',
  //     connectivity: 'None'
  //   },
  //   {
  //     id: 'TS005',
  //     location: 'Piplod Main Road',
  //     status: 'Active',
  //     currentLight: 'yellow',
  //     timer: 8,
  //     maxTimer: 15,
  //     coordinates: { lat: 21.2284, lng: 72.8383 },
  //     lastMaintenance: '2024-07-22',
  //     avgWaitTime: '1.5 min',
  //     trafficFlow: 'Medium',
  //     emergencyOverride: true,
  //     faultStatus: 'Normal',
  //     powerStatus: 'Online',
  //     connectivity: 'Strong'
  //   },
    // {
    //   id: 'TS006',
    //   location: 'Varachha Road Cross',
    //   status: 'Active',
    //   currentLight: 'green',
    //   timer: 35,
    //   maxTimer: 55,
    //   coordinates: { lat: 21.1810, lng: 72.8408 },
    //   lastMaintenance: '2024-07-18',
    //   avgWaitTime: '2.1 min',
    //   trafficFlow: 'High',
    //   emergencyOverride: false,
    //   faultStatus: 'Normal',
    //   powerStatus: 'Online',
    //   connectivity: 'Strong'
    // }
  // ]);

 // --- NEW TRAFFIC LIGHT LOGIC ---

 const GREEN_DURATION = 20;
 const YELLOW_DURATION = 3;
 // For a 4-signal cycle, red duration is the sum of green+yellow for the other 3 signals.
//  const RED_DURATION = (4 - 1) * (GREEN_DURATION + YELLOW_DURATION); // 3 * 23 = 69
const RED_DURATION = 67; // Adjusted to fit the desired cycle timing

 // Effect 1: Initializes the signal timings to the specific starting sequence.
 useEffect(() => {
   // Run only after signals are fetched from the API and if not already initialized.
   if (signals.length > 0 && !isInitialized) {
     setSignals(prev => {
       // The requested initial state for the first four signals.
       const initialTimings = [
         { light: 'green', time: GREEN_DURATION }, // TS001
         { light: 'red',   time: 23 },              // TS002
         { light: 'red',   time: 44 },              // TS003
         { light: 'red',   time: 67 },              // TS004
       ];
       
       const updatedSignals = prev.map((sig, i) => {
         // Apply the initial state to the corresponding signal.
         if (i < initialTimings.length) {
           return {
             ...sig,
             currentLight: initialTimings[i].light,
             timer: initialTimings[i].time,
           };
         }
         return sig; // Return other signals (if any) unmodified.
       });
       return updatedSignals;
     });
     // Mark as initialized to prevent this logic from running again.
     setIsInitialized(true);
   }
 }, [signals.length, isInitialized]);

 // Effect 2: Runs the main timer loop after initialization.
//  useEffect(() => {
//    // Do not start the timer interval until the initial state is set.
//    if (!isInitialized || signals.length === 0) return;

//    const interval = setInterval(() => {
//      setSignals(prevSignals => {
//        // Create a deep copy to safely update one signal based on another's state.
//        const newSignals = JSON.parse(JSON.stringify(prevSignals));

//        // This logic applies a coordinated 4-way cycle.
//        const cycleLength = 4;

//        newSignals.forEach((sig, idx) => {
//          // Only apply the automatic cycling to the first 4 signals.
//          if (idx >= cycleLength) return;

//          // Decrement the timer by one second if it's running.
//          if (sig.timer > 0) {
//            sig.timer -= 1;
//          }

//          // When a timer reaches zero, transition to the next light state.
//          if (sig.timer === 0) {
//            if (sig.currentLight === 'green') {
//              // Transition from Green to Yellow.
//              sig.currentLight = 'yellow';
//              sig.timer = YELLOW_DURATION;
//            } else if (sig.currentLight === 'yellow') {
//              // Transition from Yellow to Red.
//              sig.currentLight = 'red';
//              sig.timer = RED_DURATION;

//              // IMPORTANT: When a signal turns red, the next one in the sequence turns green.
//              const nextIdx = (idx + 1) % cycleLength;
//              newSignals[nextIdx].currentLight = 'green';
//              newSignals[nextIdx].timer = GREEN_DURATION;
//            }
//          }
//        });

//        return newSignals;
//      });
//    }, 1000); // Runs every second.

//    // Clean up the interval when the component is unmounted.
//    return () => clearInterval(interval);
//  }, [isInitialized, signals.length]);

// useEffect(() => {
//   if (!isInitialized || signals.length === 0) return;

//   // Run the main timer every second
//   const interval = setInterval(() => {
//     setSignals(prevSignals => {
//       const newSignals = JSON.parse(JSON.stringify(prevSignals));
//       const cycleLength = 4; // Number of signals in the main cycle

//       newSignals.forEach((sig, idx) => {
//         if (idx >= cycleLength) return;

//         if (sig.timer > 0) sig.timer -= 1;

//         if (sig.timer === 0) {
//           if (sig.currentLight === 'green') {
//             sig.currentLight = 'yellow';
//             sig.timer = YELLOW_DURATION;
//           } else if (sig.currentLight === 'yellow') {
//             sig.currentLight = 'red';
//             sig.timer = RED_DURATION;

//             const nextIdx = (idx + 1) % cycleLength;
//             newSignals[nextIdx].currentLight = 'green';
//             newSignals[nextIdx].timer = GREEN_DURATION;
//           }
//         }
//       });

//       return newSignals;
//     });
//   }, 1000);

//   const getCurrentLightsObject = (light) => ({
//   red: light === 'red',
//   yellow: light === 'yellow',
//   green: light === 'green',
// });

// // Sync database every 5 seconds
// const dbSyncInterval = setInterval(() => {
//   signals.forEach(sig => {
//     axios.put(`http://localhost:5000/api/signal/${sig.id}/timer`, {
//       timer: sig.timer,
//       emergencyOverride: sig.emergencyOverride,
//       currentLights: getCurrentLightsObject(sig.currentLight)
//     }).catch(err => console.error('DB update failed', err));
//   });
// }, 5000);


//   return () => {
//     clearInterval(interval);
//     clearInterval(dbSyncInterval);
//   };
// }, [isInitialized, signals]);


// Inside TrafficSignals component
const signalsRef = useRef(signals); // Ref to always hold latest signals

// Keep the ref updated whenever signals state changes
useEffect(() => {
  signalsRef.current = signals;
}, [signals]);

useEffect(() => {
  if (!isInitialized || signals.length === 0) return;

  // --- Main Timer Loop (every 1s) ---
  const interval = setInterval(() => {
    setSignals(prevSignals => {
      const newSignals = JSON.parse(JSON.stringify(prevSignals));
      const cycleLength = 4;

      newSignals.forEach((sig, idx) => {
        if (idx >= cycleLength) return;

        if (sig.timer > 0) sig.timer -= 1;

        if (sig.timer === 0) {
          if (sig.currentLight === 'green') {
            sig.currentLight = 'yellow';
            sig.timer = YELLOW_DURATION;
          } else if (sig.currentLight === 'yellow') {
            sig.currentLight = 'red';
            sig.timer = RED_DURATION;

            const nextIdx = (idx + 1) % cycleLength;
            newSignals[nextIdx].currentLight = 'green';
            newSignals[nextIdx].timer = GREEN_DURATION;
          }
        }
      });

      return newSignals;
    });
  }, 1000);

  const dbSyncInterval = setInterval(async () => {
  try {
    const updates = signalsRef.current.map(sig => ({
      id: sig.id,
      timer: sig.timer,
      emergencyOverride: sig.emergencyOverride,
      currentLights: {
        red: sig.currentLight === 'red',
        yellow: sig.currentLight === 'yellow',
        green: sig.currentLight === 'green'
      }
    }));

    await Promise.all(updates.map(u => 
      axios.put(`http://localhost:5001/api/signal/${u.id}/timer`, u)
    ));

    // Optional: single log
    console.log(`✅ Signals synced at ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error('❌ DB update failed', err);
  }
}, 5000);


  return () => {
    clearInterval(interval);
    clearInterval(dbSyncInterval);
  };
}, [isInitialized]);


 // --- END OF NEW LOGIC ---

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000); // update every second

  return () => clearInterval(timer); // cleanup on unmount
}, []);


// const GREEN_DURATION = 20;
// const YELLOW_DURATION = 3;

// useEffect(() => {
//   if (signals.length === 0) return;

//   // Initialize signals: first one green, others red
//   setSignals(prev =>
//     prev.map((sig, i) => ({
//       ...sig,
//       currentLight: i === 0 ? 'green' : 'red',
//       timer: i === 0 ? GREEN_DURATION : (signals.length - 1) * (GREEN_DURATION + YELLOW_DURATION),
//     }))
//   );

//   const interval = setInterval(() => {
//     setSignals(prev => {
//       return prev.map((sig, idx, arr) => {
//         let { currentLight, timer } = sig;

//         // Reduce timer if > 0
//         if (timer > 0) timer -= 1;

//         // When timer hits 0, change light
//         if (timer === 0) {
//           if (currentLight === 'green') {
//             currentLight = 'yellow';
//             timer = YELLOW_DURATION;
//           } else if (currentLight === 'yellow') {
//             currentLight = 'red';
//             // Red duration = sum of green+yellow of other signals
//             timer = arr.reduce((sum, s, i) => (i !== idx ? sum + GREEN_DURATION + YELLOW_DURATION : sum), 0);

//             // Activate next signal in sequence
//             const nextIdx = (idx + 1) % arr.length;
//             arr[nextIdx] = {
//               ...arr[nextIdx],
//               currentLight: 'green',
//               timer: GREEN_DURATION,
//             };
//           }
//         }

//         return { ...sig, currentLight, timer };
//       });
//     });
//   }, 1000);

//   return () => clearInterval(interval);
// }, [signals.length]);

  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCurrentTime(new Date());
      
  //     // Update traffic light timers
  //     setSignals(prevSignals => 
  //       prevSignals.map(signal => {
  //         if (signal.status === 'Active' && signal.timer > 0) {
  //           let newTimer = signal.timer - 1;
  //           let newLight = signal.currentLight;
            
  //           if (newTimer === 0) {
  //             // Cycle through lights
  //             switch (signal.currentLight) {
  //               case 'green':
  //                 newLight = 'yellow';
  //                 newTimer = 15;
  //                 break;
  //               case 'yellow':
  //                 newLight = 'red';
  //                 newTimer = signal.id === 'TS002' ? 45 : 60;
  //                 break;
  //               case 'red':
  //                 newLight = 'green';
  //                 newTimer = signal.maxTimer;
  //                 break;
  //             }
  //           }
            
  //           return {
  //             ...signal,
  //             timer: newTimer,
  //             currentLight: newLight
  //           };
  //         }
  //         return signal;
  //       })
  //     );
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, []);

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
                    {/* <p><strong>Avg Wait Time:</strong> <span>{selectedSignal.avgWaitTime}</span></p> */}
                    {/* <p><strong>Last Maintenance:</strong> <span>{selectedSignal.lastMaintenance}</span></p> */}
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
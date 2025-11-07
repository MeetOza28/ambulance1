// AmbulanceTracker.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Phone, AlertTriangle, Navigation, Activity } from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/AmbulanceTraker.css';
import { getAllAmbulances, getStats, getAmbulanceById } from '../services/ambulanceServices';


// ✅ NEW IMPORTS for Firebase
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// ✅ Initialize Firebase once
const firebaseConfig = {
  databaseURL: "https://surakshapath-61e6f-default-rtdb.firebaseio.com",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const AmbulanceTracker = () => {
    const navigate = useNavigate();
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [ambulances, setAmbulances] = useState([]);
  const [stats, setStats] = useState({ emergency: 0, enRoute: 0, available: 0, avgResponse: 0 });
  const [loading, setLoading] = useState(true);

  // Mock ambulance data
  // const [ambulances] = useState([
  //   {
  //     id: 'AMB001',
  //     status: 'En Route',
  //     priority: 'High',
  //     location: 'Ring Road, Varachha',
  //     destination: 'Civil Hospital',
  //     eta: '8 min',
  //     distance: '3.2 km',
  //     driver: 'Rajesh Patel',
  //     patient: 'Emergency Case #1247',
  //     speed: '45 km/h',
  //     fuel: '78%',
  //     lastUpdate: '2 min ago',
  //     coordinates: { lat: 21.1702, lng: 72.8311 }
  //   },
  //   {
  //     id: 'AMB002',
  //     status: 'Available',
  //     priority: 'Normal',
  //     location: 'Athwa Lines',
  //     destination: '-',
  //     eta: '-',
  //     distance: '-',
  //     driver: 'Amit Kumar',
  //     patient: '-',
  //     speed: '0 km/h',
  //     fuel: '92%',
  //     lastUpdate: '1 min ago',
  //     coordinates: { lat: 21.1594, lng: 72.7847 }
  //   },
  //   {
  //     id: 'AMB003',
  //     status: 'Emergency',
  //     priority: 'Critical',
  //     location: 'Citylight Area',
  //     destination: 'SMIMER Hospital',
  //     eta: '12 min',
  //     distance: '5.8 km',
  //     driver: 'Priya Shah',
  //     patient: 'Cardiac Emergency #1251',
  //     speed: '62 km/h',
  //     fuel: '65%',
  //     lastUpdate: 'Just now',
  //     coordinates: { lat: 21.2180, lng: 72.8339 }
  //   },
  //   {
  //     id: 'AMB004',
  //     status: 'Returning',
  //     priority: 'Low',
  //     location: 'New Civil Hospital',
  //     destination: 'Base Station',
  //     eta: '15 min',
  //     distance: '7.1 km',
  //     driver: 'Kiran Joshi',
  //     patient: 'Patient Delivered',
  //     speed: '35 km/h',
  //     fuel: '43%',
  //     lastUpdate: '3 min ago',
  //     coordinates: { lat: 21.1938, lng: 72.8123 }
  //   }
  // ]);

  // Fetch ambulances from backend
//   const fetchAmbulances = async () => {
//   try {
//     const res = await getAllAmbulances();
//     // Ensure we have an array and sort ascending by ambulanceId
//     const sortedAmbulances = Array.isArray(res.data)
//       ? res.data.sort((a, b) => a.ambulanceId.localeCompare(b.ambulanceId))
//       : [];
//     setAmbulances(sortedAmbulances);
//     setLoading(false);
//   } catch (err) {
//     console.error('Failed to fetch ambulances', err);
//     setAmbulances([]);
//     setLoading(false);
//   }
// };

const fetchAmbulances = async () => {
  try {
    const res = await getAllAmbulances();
    const sorted = Array.isArray(res.data)
      ? res.data.sort((a, b) => a.ambulanceId.localeCompare(b.ambulanceId))
      : [];

    // Clear MongoDB location (use Firebase for real-time)
    const sanitized = sorted.map(a => ({
      ...a,
      location: "Loading from GPS...",
      coordinates: a.coordinates || {},
    }));

    setAmbulances(sanitized);
    setLoading(false);
  } catch (err) {
    console.error("Failed to fetch ambulances", err);
    setAmbulances([]);
    setLoading(false);
  }
};



  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const res = await getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const fetchSingleAmbulance = async (id) => {
  try {
    const res = await getAmbulanceById(id);
    return res.data;
  } catch (err) {
    console.error('Failed to fetch ambulance', err);
    return null;
  }
};

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  

  // Initial fetch + polling every 10s
  useEffect(() => {
    fetchAmbulances();
    fetchStats();
    const interval = setInterval(() => {
      fetchAmbulances();
      fetchStats();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Poll selected ambulance every 5 seconds
// useEffect(() => {
//   if (!selectedAmbulance) return;

//   const interval = setInterval(async () => {
//     const updatedAmb = await fetchSingleAmbulance(selectedAmbulance.ambulanceId);
//     if (updatedAmb) {
//       setSelectedAmbulance(updatedAmb);

//       // Update it in the main list as well
//       setAmbulances(prev =>
//         prev.map(a => a.ambulanceId === updatedAmb.ambulanceId ? updatedAmb : a)
//       );
//     }
//   }, 5000);

//   return () => clearInterval(interval);
// }, [selectedAmbulance]);

// ✅ POLLING REMAINS FOR BACKEND SYNC
  useEffect(() => {
    if (!selectedAmbulance) return;

    const interval = setInterval(async () => {
      const updatedAmb = await fetchSingleAmbulance(selectedAmbulance.ambulanceId);
      if (updatedAmb) {
        setSelectedAmbulance(updatedAmb);
        setAmbulances(prev =>
          prev.map(a => a.ambulanceId === updatedAmb.ambulanceId ? updatedAmb : a)
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedAmbulance]);

  // ✅ NEW: Real-time Firebase listener for live GPS updates
  // useEffect(() => {
  //   if (!selectedAmbulance) return;

  //   const locationRef = ref(db, "GPS/Location");
  //   const unsubscribe = onValue(locationRef, async (snapshot) => {
  //     if (snapshot.exists()) {
  //       const data = snapshot.val();
  //       const lat = parseFloat(data.lat);
  //       const lng = parseFloat(data.lng);

  //       // 🔄 Update selected ambulance live data
  //       setSelectedAmbulance((prev) => ({
  //         ...prev,
  //         coordinates: { lat, lng },
  //         lastUpdated: new Date().toISOString(),
  //       }));

  //       // 🔄 Optional: Reverse geocode to readable location
  //       try {
  //         const res = await fetch(
  //           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  //         );
  //         const result = await res.json();
  //         const locationName = result.display_name || "Unknown Location";

  //         setSelectedAmbulance((prev) => ({
  //           ...prev,
  //           location: locationName,
  //         }));

  //         // Update in main list too
  //         setAmbulances((prev) =>
  //           prev.map((a) =>
  //             a.ambulanceId === prev.ambulanceId
  //               ? { ...a, coordinates: { lat, lng }, location: locationName, lastUpdated: new Date().toISOString() }
  //               : a
  //           )
  //         );
  //       } catch (err) {
  //         console.error("Location lookup failed", err);
  //       }
  //     }
  //   });

  //   return () => unsubscribe();
  // }, [selectedAmbulance]);

  // ✅ Listen to live updates from Firebase
// useEffect(() => {
//   if (ambulances.length === 0) return;

//   const ambulanceRefs = ambulances.map(a => ({
//     id: a.ambulanceId,
//     ref: ref(db, `Ambulances/${a.ambulanceId}/Location`)
//   }));

//   const unsubscribers = ambulanceRefs.map(({ id, ref: ambRef }) =>
//     onValue(ambRef, async (snapshot) => {
//       if (snapshot.exists()) {
//         const data = snapshot.val();
// const lat = parseFloat(data.lat || data.Latitude || 0);
// const lng = parseFloat(data.lng || data.Longitude || 0);


//         // ✅ Fetch human-readable address from OpenStreetMap
//         let locationName = "Unknown Location";
//         try {
//           const res = await fetch(
//             `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
//           );
//           const result = await res.json();
//           locationName = result.display_name || "Unknown Location";
//         } catch (err) {
//           console.error("Reverse geocoding failed:", err);
//         }

//         // ✅ Update ambulance list
//         setAmbulances(prev =>
//           prev.map(a =>
//             a.ambulanceId === id
//               ? {
//                   ...a,
//                   coordinates: { lat, lng },
//                   location: locationName,
//                   lastUpdated: new Date().toISOString(),
//                 }
//               : a
//           )
//         );

//         // ✅ Update detailed view if currently selected
//         setSelectedAmbulance(prev =>
//           prev && prev.ambulanceId === id
//             ? {
//                 ...prev,
//                 coordinates: { lat, lng },
//                 location: locationName,
//                 lastUpdated: new Date().toISOString(),
//               }
//             : prev
//         );
//       }
//     })
//   );

//   // Cleanup on unmount
//   return () => unsubscribers.forEach(unsub => unsub());
// }, [ambulances]);

useEffect(() => {
  if (ambulances.length === 0) return;

  const ambulanceRefs = ambulances.map(a => ({
    id: a.ambulanceId,
    ref: ref(db, `Ambulances/${a.ambulanceId}`) // ✅ Capital 'A'
  }));

  const unsubscribers = ambulanceRefs.map(({ id, ref: ambRef }) =>
    onValue(ambRef, async (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.val();

      // ✅ Check both direct and nested locations
      const lat = parseFloat(
        data.Latitude || data.Location?.lat || 0
      );
      const lng = parseFloat(
        data.Longitude || data.Location?.lng || 0
      );
      if (!lat || !lng) return;

      // Optional: Reverse geocode
      let locationName = "Fetching location...";
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const result = await res.json();
        const address = result.address || {};
        const area =
          address.suburb ||
          address.neighbourhood ||
          address.village ||
          address.town ||
          address.locality ||
          address.residential ||
          address.city_district ||
          "Unknown Area";
        const city =
          address.city ||
          address.town ||
          address.state_district ||
          address.county ||
          "Unknown City";
        locationName = `${area}, ${city}`;
      } catch (err) {
        console.error("Reverse geocoding failed:", err);
        locationName = "Location unavailable";
      }

      // ✅ Update ambulance in list
      setAmbulances(prev =>
        prev.map(a =>
          a.ambulanceId === id
            ? {
                ...a,
                coordinates: { lat, lng },
                location: locationName,
                lastUpdated: data.lastUpdated || new Date().toISOString(),
              }
            : a
        )
      );

      // ✅ Update selected one if needed
      setSelectedAmbulance(prev =>
        prev && prev.ambulanceId === id
          ? {
              ...prev,
              coordinates: { lat, lng },
              location: locationName,
              lastUpdated: data.lastUpdated || new Date().toISOString(),
            }
          : prev
      );
    })
  );

  return () => unsubscribers.forEach(unsub => unsub());
}, [ambulances]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'Emergency': return 'emergency';
      case 'En Route': return 'en-route';
      case 'Available': return 'available';
      case 'Returning': return 'returning';
      default: return 'available';
    }
  };

  // const getPriorityClass = (priority) => {
  //   switch (priority) {
  //     case 'Critical': return 'priority-critical';
  //     case 'High': return 'priority-high';
  //     case 'Normal': return 'priority-normal';
  //     case 'Low': return 'priority-low';
  //     default: return 'priority-normal';
  //   }
  // };

  // Map status -> priority
const getPriorityFromStatus = (status) => {
  switch (status) {
    case 'Emergency': return 'Critical';
    case 'En Route': return 'High';
    case 'Available': return 'Normal';
    case 'Returning': return 'Low';
    default: return 'Normal';
  }
};

const getPriorityClass = (priorityOrStatus) => {
  const priority = priorityOrStatus; // can pass the mapped priority
  switch (priority) {
    case 'Critical': return 'priority-critical';
    case 'High': return 'priority-high';
    case 'Normal': return 'priority-normal';
    case 'Low': return 'priority-low';
    default: return 'priority-normal';
  }
};


  const handleBackToDashboard = () => navigate('/');
  // const handleContactAmbulance = (ambulance) => alert(`Call: ${ambulance.contactNumber || 'N/A'}`);
  // const handleTrackLive = (ambulance) => alert(`Track live: ${ambulance.id}`);
  //   // ✅ SWEETALERT2 POPUP FOR CONTACT BUTTON
  // const handleContactAmbulance = (ambulance) => {
  //   Swal.fire({
  //     title: '📞 Contact Ambulance',
  //     html: `
  //       <p><strong>Driver:</strong> ${ambulance.driverName}</p>
  //       <p><strong>Contact:</strong> ${ambulance.contactNumber || 'Not Available'}</p>
  //       <p><strong>Status:</strong> ${ambulance.status}</p>
  //     `,
  //     icon: 'info',
  //     confirmButtonText: 'Close',
  //     confirmButtonColor: '#3085d6',
  //     background: '#f0f8ff',
  //   });
  // };

// ✅ SWEETALERT2 POPUP FOR CONTACT BUTTON
const handleContactAmbulance = (ambulance) => {
  const phone = ambulance.contactNumber || 'Not Available';

  Swal.fire({
    title: '📞 Contact Ambulance',
    html: `
      <p><strong>Driver:</strong> ${ambulance.driverName}</p>
      <p><strong>Contact:</strong> ${
        phone !== 'Not Available'
          ? `<a href="tel:${phone}" style="color:#007bff; text-decoration:none;">${phone}</a>`
          : 'Not Available'
      }</p>
      <p><strong>Status:</strong> ${ambulance.status}</p>
    `,
    icon: 'info',
    showCancelButton: phone !== 'Not Available', // only show Call button if number exists
    confirmButtonText: 'Close',
    cancelButtonText: '📞 Call Driver',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#28a745',
    background: '#f0f8ff',
  }).then((result) => {
    if (result.dismiss === Swal.DismissReason.cancel && phone !== 'Not Available') {
      // ✅ Opens phone dialer
      window.location.href = `tel:${phone}`;
    }
  });
};


  // ✅ SWEETALERT2 POPUP FOR TRACK LIVE BUTTON
  // const handleTrackLive = (ambulance) => {
  //   Swal.fire({
  //     title: '🚑 Track Ambulance Live',
  //     text: `Do you want to open real-time tracking for ${ambulance.ambulanceId}?`,
  //     icon: 'question',
  //     showCancelButton: true,
  //     confirmButtonText: 'Yes, Track Now',
  //     cancelButtonText: 'Cancel',
  //     confirmButtonColor: '#28a745',
  //     cancelButtonColor: '#d33',
  //     background: '#fefefe',
  //   }).then((result) => {
  //     if (result.isConfirmed) {
  //       navigate(`/map-view/${ambulance.ambulanceId}`); // Redirect to tracker
  //     }
  //   });
  // };
  // ✅ SWEETALERT2 POPUP FOR TRACK LIVE BUTTON
const handleTrackLive = (ambulance) => {
  Swal.fire({
    title: '🚑 Track Ambulance Live',
    text: `Do you want to open real-time tracking for ${ambulance.ambulanceId}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Track on Google Maps',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#d33',
    background: '#fefefe',
  }).then((result) => {
    if (result.isConfirmed) {
      const { lat, lng } = ambulance.coordinates || {};
      
      if (lat && lng) {
        // ✅ Open Google Maps in a new tab centered at the ambulance coordinates
        const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        window.open(googleMapsUrl, '_blank');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Location Unavailable',
          text: 'Coordinates for this ambulance are not available.',
          confirmButtonColor: '#d33',
        });
      }
    }
  });
};

// Convert timestamp to human-readable format like "2 min ago"
// Convert timestamp to "x min ago"
const timeAgo = (timestamp) => {
  if (!timestamp) return "Unknown";
  const now = new Date();
  const updated = new Date(timestamp);
  const diffSec = Math.floor((now - updated) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
  return `${Math.floor(diffSec / 86400)} days ago`;
};



  // const handleBackToDashboard = () => {
  //   // Navigation logic to go back to dashboard
  //   console.log('Navigate back to dashboard');
  // };

  // const handleContactAmbulance = (ambulance) => {
  //   console.log('Contact ambulance:', ambulance.id);
  // };

  // const handleTrackLive = (ambulance) => {
  //   console.log('Track ambulance live:', ambulance.id);
  // };

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
            <div className="stat-number">{stats.emergency}</div>
            <div className="stat-label">Emergency Active</div>
          </div>
          
          <div className="stat-card en-route">
            <div className="stat-header">
              <Navigation className="stat-icon" />
              <ArrowLeft className="stat-indicator" style={{ transform: 'rotate(45deg)' }} />
            </div>
            <div className="stat-number">{stats.enRoute}</div>
            <div className="stat-label">En Route</div>
          </div>
          
          <div className="stat-card available">
            <div className="stat-header">
              <MapPin className="stat-icon" />
              <div className="pulse-dot"></div>
            </div>
            <div className="stat-number">{stats.available}</div>
            <div className="stat-label">Available</div>
          </div>
          
          <div className="stat-card average">
            <div className="stat-header">
              <Clock className="stat-icon" />
              <span className="avg-badge">AVG</span>
            </div>
            <div className="stat-number">{stats.avgResponse}</div>
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
                key={ambulance.ambulanceId}
                className={`ambulance-item ${selectedAmbulance?.ambulanceId === ambulance.ambulanceId ? 'selected' : ''}`}
                onClick={() => setSelectedAmbulance(ambulance)}
              >
                <div className="ambulance-header">
                  <div className="ambulance-basic-info">
                    <div className={`status-dot ${getStatusClass(ambulance.status)}`}></div>
                    <div>
                      <div className="ambulance-id">{ambulance.ambulanceId}</div>
                      <div className="ambulance-driver">{ambulance.driverName}</div>
                    </div>
                  </div>
                  
                  <div className="ambulance-details">
                    <div className="detail-group">
                      <div className="detail-primary">{ambulance.status}</div>
                      {/* <span className={`priority-badge ${getPriorityClass(ambulance.priority)}`}>
                        {ambulance.priority}
                      </span> */}
                      <span className={`priority-badge ${getPriorityClass(getPriorityFromStatus(ambulance.status))}`}>
  {getPriorityFromStatus(ambulance.status)}
</span>

                    </div>
                    
                    <div className="detail-group">
                      <div className="detail-primary">{ambulance.location}</div>
                      {/* <div className="detail-secondary">{ambulance.lastUpdate}</div> */}
                      <div className="detail-secondary">{timeAgo(ambulance.lastUpdated)}</div>
                    </div>
                    
                    <div className="detail-group">
                      {/* <div className="detail-primary">{ambulance.eta}</div> */}
                      {/* <div className="detail-secondary">{ambulance.distance}</div> */}
                    </div>
                    
                    <div className="detail-group">
                      {/* <div className="detail-primary">{ambulance.speed}</div> */}
                      {/* <div className="detail-secondary">Fuel: {ambulance.fuel}</div> */}
                    </div>
                  </div>
                </div>
                
                {/* Show patient info only if ambulance is not available */}
{ambulance.status !== 'Available' && (
  <div className="patient-info">
    {/* <p><strong>Patient:</strong> {ambulance.patient}</p> */}
    <p><strong>Patient:</strong> {ambulance.caseId || "N/A"}</p>

    {/* Optional: show destination if needed */}
    {/* <p><strong>Destination:</strong> {ambulance.destination}</p> */}
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
                {selectedAmbulance.ambulanceId} - Detailed View
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
                    <p><strong>ID:</strong> {selectedAmbulance.ambulanceId}</p>
                    <p><strong>Driver:</strong> {selectedAmbulance.driverName}</p>
                    <p>
                      <strong>Status:</strong> 
                      <span className={`status-badge status-${getStatusClass(selectedAmbulance.status)}`}>
                        {selectedAmbulance.status}
                      </span>
                    </p>
                    {/* <p><strong>Speed:</strong> {selectedAmbulance.speed}</p> */}
                    {/* <p><strong>Fuel Level:</strong> {selectedAmbulance.fuel}</p> */}
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Location Details</h3>
                  <div className="detail-list">
                    {/* <p><strong>Current Location:</strong> {selectedAmbulance.location}</p> */}
                    <p><strong>Current Location:</strong> 
  {selectedAmbulance.location || "Waiting for GPS..."}
</p>
                    {/* <p><strong>Destination:</strong> {selectedAmbulance.destination}</p> */}
                    {/* <p><strong>Distance:</strong> {selectedAmbulance.distance}</p> */}
                    {/* <p><strong>ETA:</strong> {selectedAmbulance.eta}</p> */}
                    {/* <p><strong>Last Updated:</strong> {selectedAmbulance.lastUpdate}</p> */}
                    <p><strong>Last Updated:</strong> {timeAgo(selectedAmbulance?.lastUpdated)}</p>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Emergency Details</h3>
                  <div className="detail-list">
                    {/* <p>
                      <strong>Priority:</strong> 
                      <span className={`priority-badge ${getPriorityClass(selectedAmbulance.priority)}`}>
                        {selectedAmbulance.priority}
                      </span>
                    </p> */}
                    <p>
                      <strong>Priority:</strong> 
                      <span className={`priority-badge ${getPriorityClass(getPriorityFromStatus(selectedAmbulance.status))}`}>
                        {getPriorityFromStatus(selectedAmbulance.status)}
                      </span>
                    </p>

                    

                                    {/* Show patient info only if ambulance is not available */}
                    {selectedAmbulance.status !== 'Available' && (
                      // <p><strong>Case:</strong> {selectedAmbulance.patient || 'N/A'}</p>
                      <p><strong>Case ID:</strong> {selectedAmbulance.caseId || 'N/A'}</p>
                    )}
                    <p><strong>Coordinates:</strong> {selectedAmbulance.coordinates?.lat}, {selectedAmbulance.coordinates?.lng}</p>
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
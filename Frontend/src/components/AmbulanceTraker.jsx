// AmbulanceTracker.jsx
import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Phone, AlertTriangle, Navigation, Activity } from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/AmbulanceTraker.css';
import { getAllAmbulances, getStats, getAmbulanceById } from '../services/ambulanceServices';


// ✅ NEW IMPORTS for Firebase
// firebase db from single init
// import { db } from '../firebaseInit';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, off } from "firebase/database";

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
  const geocodeCacheRef = useRef({}); // { [ambulanceId]: { lat, lng, name, ts } }

  // state that holds active ambulance IDs discovered via Tags (RFID)
  const [activeAmbIds, setActiveAmbIds] = useState(new Set());


  // normalize a raw ambulance node from RTDB into your UI shape
const normalizeAmbulance = (key, raw = {}) => {
  const lat = parseFloat(raw.Latitude ?? raw.Location?.Latitude ?? raw.Location?.lat ?? raw.lat ?? raw.coordinates?.lat ?? 0);
  const lng = parseFloat(raw.Longitude ?? raw.Location?.Longitude ?? raw.Location?.lng ?? raw.lng ?? raw.coordinates?.lng ?? 0);

  return {
    ambulanceId: key,
    driverName: raw.driverName || raw.driver || raw.driver_name || "Unknown Driver",
    status: raw.status || "Available",
    caseId: raw.caseId || raw.patient || raw.case || null,
    contactNumber: raw.contactNumber || raw.contact || null,
    lastUpdated: raw.lastUpdated || raw.lastUpdate || new Date().toISOString(),
    coordinates: (lat && lng) ? { lat, lng } : (raw.coordinates || {}),
    location: raw.Location?.displayName || raw.location || raw.address || null,
    raw,
  };
};
// Put this where your helper functions live
const computeStatsFromList = (list = [], options = {}) => {
  const {
    staleMinutes = 24 * 60,   // ignore updates older than 24 hours by default
    useMedian = true,         // use median to reduce outlier influence
  } = options;

  let emergency = 0, enRoute = 0, available = 0;
  const now = Date.now();

  const responseTimes = []; // in minutes

  const parseTimestamp = (value) => {
    if (!value) return NaN;

    // If it's a number-like string, parse it
    const n = (typeof value === 'number') ? value : Number(value);
    if (!Number.isNaN(n)) {
      // Heuristic: timestamps < 1e12 are probably seconds; >=1e12 are ms
      if (n < 1e12) return n * 1000; // seconds -> ms
      return n; // already ms
    }

    // otherwise try Date parse for ISO strings
    const t = Date.parse(value);
    return Number.isNaN(t) ? NaN : t;
  };

  for (const a of list) {
    const s = String(a.status || '').toLowerCase();
    if (s.includes('emerg')) emergency++;
    else if (s.includes('en') || s.includes('route') || s.includes('enroute') || s.includes('en_route')) enRoute++;
    else if (s.includes('avail')) available++;

    // Only estimate for ambulances that are actively responding
    if ((s.includes('emerg') || s.includes('en') || s.includes('route')) && a.lastUpdated) {
      const ts = parseTimestamp(a.lastUpdated);
      if (!Number.isNaN(ts)) {
        const ageMin = (now - ts) / 60000;
        if (ageMin >= 0 && ageMin <= staleMinutes) {
          responseTimes.push(ageMin);
        }
      }
    }
  }

  let avgResponse = 0;
  if (responseTimes.length > 0) {
    if (useMedian) {
      responseTimes.sort((x, y) => x - y);
      const mid = Math.floor(responseTimes.length / 2);
      avgResponse =
        responseTimes.length % 2 === 0
          ? (responseTimes[mid - 1] + responseTimes[mid]) / 2
          : responseTimes[mid];
    } else {
      avgResponse = responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length;
    }
    avgResponse = Math.round(avgResponse * 10) / 10; // 1 decimal place
  } else {
    avgResponse = 0; // or set null and render "N/A"
  }

  return { emergency, enRoute, available, avgResponse };
};





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


const handleSelectAmbulance = (id) => {
  // defensive: normalize id to string
  const idStr = String(id);
  const amb = ambulances.find(a => String(a.ambulanceId) === idStr);
  console.log('Selecting ambulance', idStr, 'found:', amb);
  if (amb) setSelectedAmbulance(amb);
  else setSelectedAmbulance({ ambulanceId: idStr }); // fallback
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

// Listen to Tags -> mark active ambulances (ONLY this decides active)
  useEffect(() => {
    const tagsRef = ref(db, 'Tags');

    const unsubscribeTags = onValue(tagsRef, (snapshot) => {
      const tagsObj = snapshot.val() || {};
      const assignedSet = new Set();
      Object.entries(tagsObj).forEach(([uid, node]) => {
        const assigned = node?.assigned === true || String(node?.assigned || '').toLowerCase() === 'true';
        const ambId = node?.ambulance_id || node?.ambulanceId || node?.ambulance || null;
        if (assigned && ambId) assignedSet.add(String(ambId));
      });
      setActiveAmbIds(assignedSet);
    }, (error) => {
      console.error('Firebase Tags onValue error', error);
      setActiveAmbIds(new Set());
    });

    return () => {
      try { off(tagsRef); } catch (e) {}
      if (typeof unsubscribeTags === 'function') unsubscribeTags();
    };
  }, []);

// Realtime listener for /Ambulances (replaces polling)
// Realtime listener for /Ambulances (replace your existing listener with this)
useEffect(() => {
  const ambulancesRef = ref(db, 'Ambulances');

  const unsubscribe = onValue(
    ambulancesRef,
    (snapshot) => {
      const obj = snapshot.val();
      // console.log('🔥 /Ambulances snapshot:', obj); // <-- debug: inspect structure in console

      if (!obj) {
        setAmbulances([]);
        setStats({ emergency: 0, enRoute: 0, available: 0, avgResponse: 0 });
        setLoading(false);
        return;
      }

      // convert object -> normalized array
      const arr = Object.entries(obj).map(([key, val]) => normalizeAmbulance(key, val));
      arr.sort((a, b) => a.ambulanceId.localeCompare(b.ambulanceId));

      // // ensure location fallback shown
      // const sanitized = arr.map(a => ({
      //   ...a,
      //   location:
      //     a.location ||
      //     (a.coordinates?.lat ? `GPS: ${a.coordinates.lat.toFixed(6)}, ${a.coordinates.lng.toFixed(6)}` : 'Location unavailable'),
      // }));

      // Merge with activeAmbIds state by setting isActive flag
      const merged = arr.map(a => {
  const isActive = activeAmbIds.has(String(a.ambulanceId));
  return {
    ...a,
    isActive,
    // clear patient/caseId when not active so UI won't accidentally show it
    caseId: isActive ? a.caseId : null,
    location: a.location || (a.coordinates?.lat ? `GPS: ${a.coordinates.lat.toFixed(6)}, ${a.coordinates.lng.toFixed(6)}` : 'Location unavailable'),
  };
});


      // Compute stats robustly by reading the raw node statuses (safer)
      let emergency = 0, enRoute = 0, available = 0;
      Object.values(obj).forEach((raw) => {
        const rawStatus = String(raw?.status || raw?.Status || raw?.state || '').trim().toLowerCase();

        // debug each rawStatus if you want
        // console.log('status raw:', rawStatus);

        if (!rawStatus) return;
        if (rawStatus.includes('emerg')) emergency++;
        else if (rawStatus.includes('en') || rawStatus.includes('route') || rawStatus.includes('enroute') || rawStatus.includes('en_route')) enRoute++;
        else if (rawStatus.includes('avail')) available++;
      });

      setAmbulances(merged);
      // compute stats (including avg response) from merged list
const statsFromList = computeStatsFromList(merged, { staleMinutes: 24*60, useMedian: true });
setStats(statsFromList);
setAmbulances(merged);

setLoading(false);

      // setStats({ emergency, enRoute, available, avgResponse: 0 });
      // setLoading(false);
    },
    (error) => {
      console.error('Firebase onValue error', error);
      setLoading(false);
    }
  );

  return () => {
    try { off(ambulancesRef); } catch (e) { /* ignore */ }
    if (typeof unsubscribe === 'function') unsubscribe();
  };
}, [activeAmbIds]); // run once


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



// // ✅ POLLING REMAINS FOR BACKEND SYNC
//   useEffect(() => {
//     if (!selectedAmbulance) return;

//     const interval = setInterval(async () => {
//       const updatedAmb = await fetchSingleAmbulance(selectedAmbulance.ambulanceId);
//       if (updatedAmb) {
//         setSelectedAmbulance(updatedAmb);
//         setAmbulances(prev =>
//           prev.map(a => a.ambulanceId === updatedAmb.ambulanceId ? updatedAmb : a)
//         );
//       }
//     }, 5000);

//     return () => clearInterval(interval);
//   }, [selectedAmbulance]);

// Keep selectedAmbulance in sync with updated ambulances array
useEffect(() => {
  // only care when selectedAmbulance's id changes or ambulances change
  if (!selectedAmbulance?.ambulanceId) return;

  const updated = ambulances.find(a =>
    String(a.ambulanceId) === String(selectedAmbulance.ambulanceId)
  );
  if (!updated) return;

  // only update if something meaningful changed (avoid re-setting identical state)
  const coordsEqual = JSON.stringify(updated.coordinates || {}) === JSON.stringify(selectedAmbulance.coordinates || {});
  const lastUpdatedEqual = String(updated.lastUpdated || '') === String(selectedAmbulance.lastUpdated || '');
  const locationEqual = String(updated.location || '') === String(selectedAmbulance.location || '');
  const statusEqual = String(updated.status || '') === String(selectedAmbulance.status || '');

  if (coordsEqual && lastUpdatedEqual && locationEqual && statusEqual) {
    // nothing changed — don't call setState
    return;
  }

  setSelectedAmbulance(prev => ({ ...prev, ...updated }));
}, [ambulances, selectedAmbulance?.ambulanceId]);



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

  // use stable dependency: string of ids so this effect only re-runs when set of IDs changes
  const ids = ambulances.map(a => String(a.ambulanceId)).join(',');

  // build listeners
  const refs = ambulances.map(a => ({
    id: a.ambulanceId,
    ref: ref(db, `Ambulances/${a.ambulanceId}`)
  }));

  const unsubscribers = refs.map(({ id, ref: ambRef }) =>
  onValue(ambRef, async (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.val();

    const lat = parseFloat(data.Latitude || data.Location?.lat || data.lat || 0);
    const lng = parseFloat(data.Longitude || data.Location?.lng || data.lng || 0);
    if (!lat || !lng) return;

    // 1) Check cache and skip reverse-geocoding if coords unchanged
    const cache = geocodeCacheRef.current[id];
    const coordsUnchanged = cache && cache.lat === lat && cache.lng === lng;

    let locationName = coordsUnchanged ? cache.name : null;

    // 2) Only call geocode when coords changed and we don't have a cached name
    if (!locationName) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        if (!res.ok) {
          // non-ok (429, 5xx, CORS) - avoid throwing raw error that floods console
          console.warn(`Reverse geocode non-ok for ${id}:`, res.status);
          locationName = `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        } else {
          const json = await res.json();
          locationName = (json && (json.display_name || (json.address && json.address.city))) || `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
      } catch (err) {
        // network / CORS / blocked request — fallback to GPS coords
        console.warn(`Reverse geocode failed for ${id} – falling back to GPS:`, err.message || err);
        locationName = `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }

      // update cache
      geocodeCacheRef.current[id] = { lat, lng, name: locationName, ts: Date.now() };
    }

    // 3) Update ambulances only if something changed (prevents repeated setState)
    setAmbulances(prev => {
      let changed = false;
      const next = prev.map(a => {
        if (String(a.ambulanceId) !== String(id)) return a;

        const newCoords = { lat, lng };
        const lastUpdated = data.lastUpdated || new Date().toISOString();

        const coordsEqual = JSON.stringify(a.coordinates || {}) === JSON.stringify(newCoords);
        const locationEqual = String(a.location || '') === String(locationName || '');
        const lastUpdatedEqual = String(a.lastUpdated || '') === String(lastUpdated || '');

        if (coordsEqual && locationEqual && lastUpdatedEqual) return a;

        changed = true;
        return { ...a, coordinates: newCoords, location: locationName, lastUpdated };
      });

      return changed ? next : prev;
    });

    // 4) Update selectedAmbulance safely only if matches and changed
    setSelectedAmbulance(prev => {
      if (!prev || String(prev.ambulanceId) !== String(id)) return prev;

      const newCoords = { lat, lng };
      const lastUpdated = data.lastUpdated || new Date().toISOString();

      const coordsEqual = JSON.stringify(prev.coordinates || {}) === JSON.stringify(newCoords);
      const locationEqual = String(prev.location || '') === String(locationName || '');
      const lastUpdatedEqual = String(prev.lastUpdated || '') === String(lastUpdated || '');

      if (coordsEqual && locationEqual && lastUpdatedEqual) return prev;
      return { ...prev, coordinates: newCoords, location: locationName, lastUpdated };
    });
  })
);


  // const unsubscribers = refs.map(({ id, ref: ambRef }) =>
  //   onValue(ambRef, async (snapshot) => {
  //     if (!snapshot.exists()) return;
  //     const data = snapshot.val();

  //     const lat = parseFloat(data.Latitude || data.Location?.lat || data.lat || 0);
  //     const lng = parseFloat(data.Longitude || data.Location?.lng || data.lng || 0);
  //     if (!lat || !lng) return;

  //     // optional reverse geocode (keep as you have)
  //     let locationName = "Location unavailable";
  //     try {
  //       const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
  //       const json = await res.json();
  //       locationName = (json && json.display_name) || "Location unavailable";
  //     } catch (err) {
  //       console.error('reverse geocode failed', err);
  //     }

  //     // update ambulances but avoid replacing with a new array if nothing changed
  //     setAmbulances(prev => {
  //       let changed = false;
  //       const next = prev.map(a => {
  //         if (String(a.ambulanceId) !== String(id)) return a;

  //         const newCoords = { lat, lng };
  //         const lastUpdated = data.lastUpdated || new Date().toISOString();

  //         const coordsEqual = JSON.stringify(a.coordinates || {}) === JSON.stringify(newCoords);
  //         const locationEqual = String(a.location || '') === String(locationName || '');
  //         const lastUpdatedEqual = String(a.lastUpdated || '') === String(lastUpdated || '');

  //         if (coordsEqual && locationEqual && lastUpdatedEqual) {
  //           return a; // no change
  //         }

  //         changed = true;
  //         return { ...a, coordinates: newCoords, location: locationName, lastUpdated };
  //       });

  //       return changed ? next : prev; // return prev reference if nothing changed
  //     });

  //     // update selectedAmbulance only if it matches id and if there are meaningful changes
  //     setSelectedAmbulance(prev => {
  //       if (!prev || String(prev.ambulanceId) !== String(id)) return prev;

  //       const newCoords = { lat, lng };
  //       const lastUpdated = data.lastUpdated || new Date().toISOString();
  //       const coordsEqual = JSON.stringify(prev.coordinates || {}) === JSON.stringify(newCoords);
  //       const locationEqual = String(prev.location || '') === String(locationName || '');
  //       const lastUpdatedEqual = String(prev.lastUpdated || '') === String(lastUpdated || '');

  //       if (coordsEqual && locationEqual && lastUpdatedEqual) return prev; // no change

  //       return { ...prev, coordinates: newCoords, location: locationName, lastUpdated };
  //     });
  //   })
  // );

  return () => {
    try { refs.forEach(({ ref: r }) => off(r)); } catch(e) {}
    unsubscribers.forEach(unsub => { if (typeof unsub === 'function') unsub(); });
  };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [ambulances.map(a => a.ambulanceId).join(',')]); // effect re-runs only when IDs string changes


// useEffect(() => {
//   if (ambulances.length === 0) return;

//   const ambulanceRefs = ambulances.map(a => ({
//     id: a.ambulanceId,
//     ref: ref(db, `Ambulances/${a.ambulanceId}`) // ✅ Capital 'A'
//   }));

//   const unsubscribers = ambulanceRefs.map(({ id, ref: ambRef }) =>
//     onValue(ambRef, async (snapshot) => {
//       if (!snapshot.exists()) return;
//       const data = snapshot.val();

//       // ✅ Check both direct and nested locations
//       const lat = parseFloat(
//         data.Latitude || data.Location?.lat || 0
//       );
//       const lng = parseFloat(
//         data.Longitude || data.Location?.lng || 0
//       );
//       if (!lat || !lng) return;

//       // Optional: Reverse geocode
//       let locationName = "Fetching location...";
//       try {
//         const res = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
//         );
//         const result = await res.json();
//         const address = result.address || {};
//         const area =
//           address.suburb ||
//           address.neighbourhood ||
//           address.village ||
//           address.town ||
//           address.locality ||
//           address.residential ||
//           address.city_district ||
//           "Unknown Area";
//         const city =
//           address.city ||
//           address.town ||
//           address.state_district ||
//           address.county ||
//           "Unknown City";
//         locationName = `${area}, ${city}`;
//       } catch (err) {
//         console.error("Reverse geocoding failed:", err);
//         locationName = "Location unavailable";
//       }

//       // ✅ Update ambulance in list
//       setAmbulances(prev =>
//         prev.map(a =>
//           a.ambulanceId === id
//             ? {
//                 ...a,
//                 coordinates: { lat, lng },
//                 location: locationName,
//                 lastUpdated: data.lastUpdated || new Date().toISOString(),
//               }
//             : a
//         )
//       );

//       // ✅ Update selected one if needed
//       setSelectedAmbulance(prev =>
//         prev && prev.ambulanceId === id
//           ? {
//               ...prev,
//               coordinates: { lat, lng },
//               location: locationName,
//               lastUpdated: data.lastUpdated || new Date().toISOString(),
//             }
//           : prev
//       );
//     })
//   );

//   return () => unsubscribers.forEach(unsub => unsub());
// }, [ambulances]);

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
        // navigate to internal map view route
  // navigate(`/map-view/${encodeURIComponent(ambulance.ambulanceId)}`);
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

  // Separate lists
  const activeList = ambulances.filter(a => a.isActive);
  const inactiveList = ambulances.filter(a => !a.isActive);

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
            {/* <div className="stat-number">{stats.avgResponse}</div> */}
            <div className="stat-number">{stats.avgResponse ? stats.avgResponse.toFixed(1) : 'N/A'}</div>

            <div className="stat-label">Avg Response (min)</div>

          </div>
        </div>

        {/* Active ambulances (based on Tags only) */}
        <div className="ambulance-list">
          <div className="list-header">
            <h2 className="list-title">Active Ambulances</h2>
            {/* <p className="list-sub">(only assigned via RFID Tags)</p> */}
          </div>

          <div>
            
            {/* {activeList.length === 0 && <p className="empty-note">No active ambulances</p>} */}
            {activeList.map((ambulance) => (
              
              <div
                key={ambulance.ambulanceId}
                className={`ambulance-item ${selectedAmbulance?.ambulanceId === ambulance.ambulanceId ? 'selected' : ''}`}
                onClick={() => handleSelectAmbulance(ambulance.ambulanceId)}
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
                      <span className={`priority-badge ${getPriorityClass(getPriorityFromStatus(ambulance.status))}`}>
                        {getPriorityFromStatus(ambulance.status)}
                      </span>
                    </div>

                    <div className="detail-group">
                      <div className="detail-primary">{ambulance.location}</div>
                      <div className="detail-secondary">{timeAgo(ambulance.lastUpdated)}</div>
                    </div>
                  </div>
                </div>

                {ambulance.isActive && ambulance.status && ambulance.status.toLowerCase() !== 'available' && (
  <div className="patient-info">
    <p><strong>Patient:</strong> {ambulance.caseId || "N/A"}</p>
  </div>
)}

              </div>
            ))}
          </div>
        </div>

        {/* Inactive ambulances */}
        <div className="ambulance-list">
          <div className="list-header">
            <h2 className="list-title">Inactive Ambulances</h2>
            {/* <p className="list-sub">(not assigned via tag)</p> */}
          </div>

          <div>
            {inactiveList.length === 0 && <p className="empty-note">No inactive ambulances</p>}
            {inactiveList.map((ambulance) => (
              <div
                key={ambulance.ambulanceId}
                className={`ambulance-item ${selectedAmbulance?.ambulanceId === ambulance.ambulanceId ? 'selected' : ''}`}
                onClick={() => handleSelectAmbulance(ambulance.ambulanceId)}
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
                      <span className={`priority-badge ${getPriorityClass(getPriorityFromStatus(ambulance.status))}`}>
                        {getPriorityFromStatus(ambulance.status)}
                      </span>
                    </div>

                    <div className="detail-group">
                      <div className="detail-primary">{ambulance.location}</div>
                      <div className="detail-secondary">{timeAgo(ambulance.lastUpdated)}</div>
                    </div>
                  </div>
                </div>

                {ambulance.status !== 'Available' && (
                  <div className="patient-info">
                    <p><strong>Patient:</strong> {ambulance.caseId || "N/A"}</p>
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
                <button className="action-btn btn-contact" onClick={() => handleContactAmbulance(selectedAmbulance)}>
                  <Phone size={16} />
                  Contact
                </button>
                <button className="action-btn btn-track" onClick={() => handleTrackLive(selectedAmbulance)}>
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
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Location Details</h3>
                  <div className="detail-list">
                    <p><strong>Current Location:</strong> {selectedAmbulance.location || "Waiting for GPS..."}</p>
                    <p><strong>Last Updated:</strong> {timeAgo(selectedAmbulance?.lastUpdated)}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Emergency Details</h3>
                  <div className="detail-list">
                    <p>
                      <strong>Priority:</strong>
                      <span className={`priority-badge ${getPriorityClass(getPriorityFromStatus(selectedAmbulance.status))}`}>
                        {getPriorityFromStatus(selectedAmbulance.status)}
                      </span>
                    </p>

                    {selectedAmbulance.status !== 'Available' && (
                      <p><strong>Case ID:</strong> {selectedAmbulance.caseId || 'N/A'}</p>
                    )}
                    {/* <p><strong>Coordinates:</strong> {selectedAmbulance.coordinates?.lat}, {selectedAmbulance.coordinates?.lng}</p> */}
                    <p><strong>Coordinates:</strong> {
  selectedAmbulance?.coordinates?.lat && selectedAmbulance?.coordinates?.lng
    ? `${selectedAmbulance.coordinates.lat}, ${selectedAmbulance.coordinates.lng}`
    : 'N/A'
}</p>

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



// // src/pages/AmbulanceTracker.jsx
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ArrowLeft, MapPin, Clock, Phone, AlertTriangle, Navigation, Activity } from 'lucide-react';
// import Swal from 'sweetalert2';
// import '../styles/AmbulanceTraker.css';
// import { getAllAmbulances, getStats, getAmbulanceById } from '../services/ambulanceServices';

// // Firebase (inline init - OK for single-page demos; for a larger app move init to firebaseInit.js)
// import { initializeApp } from "firebase/app";
// import { getDatabase, ref, onValue, off } from "firebase/database";

// const firebaseConfig = {
//   databaseURL: "https://surakshapath-61e6f-default-rtdb.firebaseio.com",
// };
// const app = initializeApp(firebaseConfig);
// const db = getDatabase(app);

// const AmbulanceTracker = () => {
//   const navigate = useNavigate();

//   const [selectedAmbulance, setSelectedAmbulance] = useState(null);
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const [ambulances, setAmbulances] = useState([]);
//   const [stats, setStats] = useState({ emergency: 0, enRoute: 0, available: 0, avgResponse: 0 });
//   const [loading, setLoading] = useState(true);

//   // ---------------- helpers ----------------
//   const normalizeAmbulance = (key, raw = {}) => {
//     // lots of possible field names in your DB, so check several places
//     const lat = parseFloat(
//       raw.Latitude ??
//       raw.Location?.Latitude ??
//       raw.Location?.lat ??
//       raw.lat ??
//       raw.coordinates?.lat ??
//       raw.Lat ??
//       0
//     );
//     const lng = parseFloat(
//       raw.Longitude ??
//       raw.Location?.Longitude ??
//       raw.Location?.lng ??
//       raw.lng ??
//       raw.coordinates?.lng ??
//       raw.Lng ??
//       0
//     );

//     return {
//       ambulanceId: key,
//       driverName: raw.driverName || raw.driver || raw.driver_name || "Unknown Driver",
//       status: raw.status || raw.Status || "Available",
//       caseId: raw.caseId || raw.patient || raw.case || null,
//       contactNumber: raw.contactNumber || raw.contact || raw.phone || null,
//       lastUpdated: raw.lastUpdated || raw.lastUpdate || raw.updatedAt || new Date().toISOString(),
//       coordinates: (lat && lng) ? { lat, lng } : (raw.coordinates || {}),
//       location: raw.Location?.displayName || raw.location || raw.address || null,
//       raw,
//     };
//   };

//   const computeStatsFromList = (list = []) => {
//     let emergency = 0, enRoute = 0, available = 0;
//     list.forEach(a => {
//       const s = String(a.status || '').toLowerCase();
//       if (s.includes('emerg')) emergency++;
//       else if (s.includes('en') || s.includes('route') || s.includes('enroute') || s.includes('en_route')) enRoute++;
//       else if (s.includes('avail')) available++;
//     });
//     return { emergency, enRoute, available, avgResponse: 0 };
//   };

//   const timeAgo = (timestamp) => {
//     if (!timestamp) return "Unknown";
//     const now = new Date();
//     const updated = new Date(timestamp);
//     const diffSec = Math.floor((now - updated) / 1000);
//     if (diffSec < 60) return "Just now";
//     if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
//     if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
//     return `${Math.floor(diffSec / 86400)} days ago`;
//   };

//   const getStatusClass = (status) => {
//     switch (String(status || '').toLowerCase()) {
//       case 'emergency': return 'emergency';
//       case 'en route':
//       case 'enroute':
//       case 'on route':
//       case 'en': return 'en-route';
//       case 'available': return 'available';
//       case 'returning': return 'returning';
//       default: return 'available';
//     }
//   };

//   const getPriorityFromStatus = (status) => {
//     switch (String(status || '').toLowerCase()) {
//       case 'emergency': return 'Critical';
//       case 'en route': return 'High';
//       case 'enroute': return 'High';
//       case 'available': return 'Normal';
//       case 'returning': return 'Low';
//       default: return 'Normal';
//     }
//   };

//   const getPriorityClass = (priority) => {
//     switch (priority) {
//       case 'Critical': return 'priority-critical';
//       case 'High': return 'priority-high';
//       case 'Normal': return 'priority-normal';
//       case 'Low': return 'priority-low';
//       default: return 'priority-normal';
//     }
//   };

//   // ---------------- fetch fallback (optional) ----------------
//   // you may keep these for your backend fallback, but realtime RTDB is main source
//   const fetchAmbulances = async () => {
//     try {
//       const res = await getAllAmbulances();
//       const sorted = Array.isArray(res.data) ? res.data.sort((a, b) => (a.ambulanceId || '').localeCompare(b.ambulanceId || '')) : [];
//       const sanitized = sorted.map(a => ({ ...a, location: a.location || 'Location unavailable', coordinates: a.coordinates || {} }));
//       setAmbulances(sanitized);
//       setLoading(false);
//     } catch (err) {
//       console.error("Failed to fetch ambulances (backend)", err);
//       setAmbulances([]);
//       setLoading(false);
//     }
//   };

//   const fetchStats = async () => {
//     try {
//       const res = await getStats();
//       if (res?.data) setStats(res.data);
//     } catch (err) {
//       console.error("Failed to fetch stats (backend)", err);
//     }
//   };

//   // ---------------- realtime listener ----------------
//   useEffect(() => {
//     const ambulancesRef = ref(db, 'Ambulances');

//     // onValue returns an unsubscribe function
//     const unsubscribe = onValue(ambulancesRef, (snapshot) => {
//       const obj = snapshot.val();

//       if (!obj) {
//         setAmbulances([]);
//         setStats({ emergency: 0, enRoute: 0, available: 0, avgResponse: 0 });
//         setLoading(false);
//         return;
//       }

//       // convert to normalized array
//       const arr = Object.entries(obj).map(([key, val]) => normalizeAmbulance(key, val));
//       arr.sort((a, b) => (a.ambulanceId || '').localeCompare(b.ambulanceId || ''));

//       const sanitized = arr.map(a => ({
//         ...a,
//         // show readable fallback when no address available
//         location: a.location || (a.coordinates?.lat ? `GPS: ${a.coordinates.lat.toFixed(6)}, ${a.coordinates.lng.toFixed(6)}` : 'Location unavailable'),
//       }));

//       // compute stats reading raw snapshot nodes for robustness
//       let emergency = 0, enRoute = 0, available = 0;
//       Object.values(obj).forEach((raw) => {
//         const rawStatus = String(raw?.status || raw?.Status || raw?.state || '').trim().toLowerCase();
//         if (!rawStatus) return;
//         if (rawStatus.includes('emerg')) emergency++;
//         else if (rawStatus.includes('en') || rawStatus.includes('route') || rawStatus.includes('enroute') || rawStatus.includes('en_route')) enRoute++;
//         else if (rawStatus.includes('avail')) available++;
//       });

//       setAmbulances(sanitized);
//       setStats({ emergency, enRoute, available, avgResponse: 0 });
//       setLoading(false);
//     }, (error) => {
//       console.error('Firebase onValue error', error);
//       // fallback: attempt backend fetch
//       fetchAmbulances();
//       fetchStats();
//       setLoading(false);
//     });

//     // cleanup: detach listener on unmount
//     return () => {
//       try { off(ambulancesRef); } catch (e) { /* ignore */ }
//       if (typeof unsubscribe === 'function') unsubscribe();
//     };
//   }, []); // run once

//   // keep current time updated
//   useEffect(() => {
//     const timer = setInterval(() => setCurrentTime(new Date()), 1000);
//     return () => clearInterval(timer);
//   }, []);

//   // sync selectedAmbulance with updates from ambulances array
//   useEffect(() => {
//     if (!selectedAmbulance) return;
//     const updated = ambulances.find(a => a.ambulanceId === selectedAmbulance.ambulanceId);
//     if (updated) setSelectedAmbulance(prev => ({ ...prev, ...updated }));
//   }, [ambulances, selectedAmbulance]);

//   // ---------------- actions ----------------
//   const handleContactAmbulance = (ambulance) => {
//     const phone = ambulance.contactNumber || 'Not Available';
//     Swal.fire({
//       title: '📞 Contact Ambulance',
//       html: `
//         <p><strong>Driver:</strong> ${ambulance.driverName}</p>
//         <p><strong>Contact:</strong> ${phone !== 'Not Available' ? `<a href="tel:${phone}">${phone}</a>` : 'Not Available'}</p>
//         <p><strong>Status:</strong> ${ambulance.status}</p>
//       `,
//       icon: 'info',
//       showCancelButton: phone !== 'Not Available',
//       confirmButtonText: 'Close',
//       cancelButtonText: '📞 Call Driver',
//     }).then((result) => {
//       if (result.dismiss === Swal.DismissReason.cancel && phone !== 'Not Available') {
//         window.location.href = `tel:${phone}`;
//       }
//     });
//   };

//   // quick immediate navigation (no Swal)
// const handleTrackLive = (ambulance) => {
//   if (!ambulance || !ambulance.ambulanceId) {
//     Swal.fire({ icon: 'error', title: 'No ambulance selected', text: 'Cannot track this ambulance.' });
//     return;
//   }

//   // For quick debug open internal map-view route:
//   navigate(`/map-view/${encodeURIComponent(ambulance.ambulanceId)}`);

//   // Or to open Google Maps directly (uncomment if you prefer)
//   // const { lat, lng } = ambulance.coordinates || {};
//   // if (lat && lng) window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
// };


//   // optional: fetch single ambulance from backend if you want (not used often)
//   const fetchSingleAmbulance = async (id) => {
//     try {
//       const res = await getAmbulanceById(id);
//       return res.data;
//     } catch (err) {
//       console.error('Failed to fetch ambulance (single)', err);
//       return null;
//     }
//   };

//   // ---------------- UI ----------------
//   return (
//     <div className="ambulance-tracker">
//       {/* Sidebar */}
//       <div className="sidebar">
//         <div className="sidebar-header">
//           <h1 className="sidebar-title">SurakshaPath</h1>
//           <p className="sidebar-subtitle">Traffic Management System</p>
//         </div>

//         <nav className="sidebar-nav">
//           <div className="nav-item back" onClick={() => navigate('/')}>
//             <ArrowLeft className="stat-indicator" />
//             <span>Back to Dashboard</span>
//           </div>
//           <div className="nav-item active">
//             <span className="nav-icon">📍</span>
//             <span>Ambulance Tracker</span>
//           </div>
//           <div className="nav-item inactive" onClick={() => navigate('/traffic-signal')}>
//             <span className="nav-icon">⚡</span>
//             <span>Traffic Signals</span>
//           </div>
//           <div className="nav-item inactive" onClick={() => navigate('/helmet-violation')}>
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
//             <button onClick={() => { localStorage.removeItem('token'); sessionStorage.removeItem('token'); navigate('/login'); }} className="logout-button">
//               <span className="logout-icon">🔒</span>
//               Logout
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="main-content">
//         <div className="page-header">
//           <h1 className="page-title">Ambulance Tracker</h1>
//           <p className="page-subtitle">Real-time ambulance monitoring and dispatch system</p>
//         </div>

//         {/* Stats Cards */}
//         <div className="stats-grid">
//           <div className="stat-card emergency">
//             <div className="stat-header">
//               <Activity className="stat-icon" />
//               <AlertTriangle className="stat-indicator" />
//             </div>
//             <div className="stat-number">{stats.emergency}</div>
//             <div className="stat-label">Emergency Active</div>
//           </div>

//           <div className="stat-card en-route">
//             <div className="stat-header">
//               <Navigation className="stat-icon" />
//               <ArrowLeft className="stat-indicator" style={{ transform: 'rotate(45deg)' }} />
//             </div>
//             <div className="stat-number">{stats.enRoute}</div>
//             <div className="stat-label">En Route</div>
//           </div>

//           <div className="stat-card available">
//             <div className="stat-header">
//               <MapPin className="stat-icon" />
//               <div className="pulse-dot"></div>
//             </div>
//             <div className="stat-number">{stats.available}</div>
//             <div className="stat-label">Available</div>
//           </div>

//           <div className="stat-card average">
//             <div className="stat-header">
//               <Clock className="stat-icon" />
//               <span className="avg-badge">AVG</span>
//             </div>
//             <div className="stat-number">{stats.avgResponse}</div>
//             <div className="stat-label">Avg Response (min)</div>
//           </div>
//         </div>

//         {/* Ambulance List */}
//         <div className="ambulance-list">
//           <div className="list-header">
//             <h2 className="list-title">Active Ambulances</h2>
//           </div>

//           <div>
//             {ambulances.map((ambulance) => (
//               <div
//                 key={ambulance.ambulanceId}
//                 className={`ambulance-item ${selectedAmbulance?.ambulanceId === ambulance.ambulanceId ? 'selected' : ''}`}
//                 onClick={() => setSelectedAmbulance(ambulance)}
//               >
//                 <div className="ambulance-header">
//                   <div className="ambulance-basic-info">
//                     <div className={`status-dot ${getStatusClass(ambulance.status)}`}></div>
//                     <div>
//                       <div className="ambulance-id">{ambulance.ambulanceId}</div>
//                       <div className="ambulance-driver">{ambulance.driverName}</div>
//                     </div>
//                   </div>

//                   <div className="ambulance-details">
//                     <div className="detail-group">
//                       <div className="detail-primary">{ambulance.status}</div>
//                       <span className={`priority-badge ${getPriorityClass(getPriorityFromStatus(ambulance.status))}`}>
//                         {getPriorityFromStatus(ambulance.status)}
//                       </span>
//                     </div>

//                     <div className="detail-group">
//                       <div className="detail-primary">{ambulance.location}</div>
//                       <div className="detail-secondary">{timeAgo(ambulance.lastUpdated)}</div>
//                     </div>
//                   </div>
//                 </div>

//                 {ambulance.status?.toLowerCase() !== 'available' && (
//                   <div className="patient-info">
//                     <p><strong>Patient:</strong> {ambulance.caseId || "N/A"}</p>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Selected Ambulance Details */}
//         {selectedAmbulance && (
//           <div className="detailed-view">
//             <div className="detailed-header">
//               <h2 className="detailed-title">{selectedAmbulance.ambulanceId} - Detailed View</h2>
//               <div className="action-buttons">
//                 <button className="action-btn btn-contact" onClick={() => handleContactAmbulance(selectedAmbulance)}>
//                   <Phone size={16} /> Contact
//                 </button>
//                 <button className="action-btn btn-track" onClick={() => handleTrackLive(selectedAmbulance)}>
//                   <MapPin size={16} /> Track Live
//                 </button>
//               </div>
//             </div>

//             <div className="detailed-content">
//               <div className="details-grid">
//                 <div className="detail-section">
//                   <h3>Vehicle Information</h3>
//                   <div className="detail-list">
//                     <p><strong>ID:</strong> {selectedAmbulance.ambulanceId}</p>
//                     <p><strong>Driver:</strong> {selectedAmbulance.driverName}</p>
//                     <p>
//                       <strong>Status:</strong>
//                       <span className={`status-badge status-${getStatusClass(selectedAmbulance.status)}`}> {selectedAmbulance.status} </span>
//                     </p>
//                   </div>
//                 </div>

//                 <div className="detail-section">
//                   <h3>Location Details</h3>
//                   <div className="detail-list">
//                     <p><strong>Current Location:</strong> {selectedAmbulance.location || "Waiting for GPS..."}</p>
//                     <p><strong>Last Updated:</strong> {timeAgo(selectedAmbulance?.lastUpdated)}</p>
//                   </div>
//                 </div>

//                 <div className="detail-section">
//                   <h3>Emergency Details</h3>
//                   <div className="detail-list">
//                     <p>
//                       <strong>Priority:</strong>
//                       <span className={`priority-badge ${getPriorityClass(getPriorityFromStatus(selectedAmbulance.status))}`}>
//                         {getPriorityFromStatus(selectedAmbulance.status)}
//                       </span>
//                     </p>

//                     {selectedAmbulance.status?.toLowerCase() !== 'available' && (
//                       <p><strong>Case ID:</strong> {selectedAmbulance.caseId || 'N/A'}</p>
//                     )}

//                     <p><strong>Coordinates:</strong> {selectedAmbulance.coordinates?.lat || 'N/A'}, {selectedAmbulance.coordinates?.lng || 'N/A'}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// };

// export default AmbulanceTracker;




// // src/pages/AmbulanceTracker.jsx
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ArrowLeft, MapPin, Clock, Phone, AlertTriangle, Navigation, Activity } from 'lucide-react';
// import Swal from 'sweetalert2';
// import '../styles/AmbulanceTraker.css';
// import { getAllAmbulances, getStats, getAmbulanceById } from '../services/ambulanceServices';

// // Firebase (inline init - OK for single-page demos; for a larger app move init to firebaseInit.js)
// import { initializeApp } from "firebase/app";
// import { getDatabase, ref, onValue, off } from "firebase/database";

// const firebaseConfig = {
//   databaseURL: "https://surakshapath-61e6f-default-rtdb.firebaseio.com",
// };
// const app = initializeApp(firebaseConfig);
// const db = getDatabase(app);

// const AmbulanceTracker = () => {
//   const navigate = useNavigate();

//   const [selectedAmbulance, setSelectedAmbulance] = useState(null);
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const [ambulances, setAmbulances] = useState([]);
//   const [stats, setStats] = useState({ emergency: 0, enRoute: 0, available: 0, avgResponse: 0 });
//   const [loading, setLoading] = useState(true);

//   // ---------------- helpers ----------------
//   const normalizeAmbulance = (key, raw = {}) => {
//     const lat = parseFloat(
//       raw.Latitude ??
//       raw.Location?.Latitude ??
//       raw.Location?.lat ??
//       raw.lat ??
//       raw.coordinates?.lat ??
//       raw.Lat ??
//       0
//     );
//     const lng = parseFloat(
//       raw.Longitude ??
//       raw.Location?.Longitude ??
//       raw.Location?.lng ??
//       raw.lng ??
//       raw.coordinates?.lng ??
//       raw.Lng ??
//       0
//     );

//     return {
//       ambulanceId: key,
//       driverName: raw.driverName || raw.driver || raw.driver_name || "Unknown Driver",
//       status: raw.status || raw.Status || "Available",
//       caseId: raw.caseId || raw.patient || raw.case || null,
//       contactNumber: raw.contactNumber || raw.contact || raw.phone || null,
//       lastUpdated: raw.lastUpdated || raw.lastUpdate || raw.updatedAt || new Date().toISOString(),
//       coordinates: (lat && lng) ? { lat, lng } : (raw.coordinates || {}),
//       location: raw.Location?.displayName || raw.location || raw.address || null,
//       raw,
//     };
//   };

//   const computeStatsFromList = (list = []) => {
//     let emergency = 0, enRoute = 0, available = 0;
//     list.forEach(a => {
//       const s = String(a.status || '').toLowerCase();
//       if (s.includes('emerg')) emergency++;
//       else if (s.includes('en') || s.includes('route') || s.includes('enroute') || s.includes('en_route')) enRoute++;
//       else if (s.includes('avail')) available++;
//     });
//     return { emergency, enRoute, available, avgResponse: 0 };
//   };

//   const timeAgo = (timestamp) => {
//     if (!timestamp) return "Unknown";
//     const now = new Date();
//     const updated = new Date(timestamp);
//     const diffSec = Math.floor((now - updated) / 1000);
//     if (diffSec < 60) return "Just now";
//     if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
//     if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
//     return `${Math.floor(diffSec / 86400)} days ago`;
//   };

//   const getStatusClass = (status) => {
//     switch (String(status || '').toLowerCase()) {
//       case 'emergency': return 'emergency';
//       case 'en route':
//       case 'enroute':
//       case 'on route':
//       case 'en': return 'en-route';
//       case 'available': return 'available';
//       case 'returning': return 'returning';
//       default: return 'available';
//     }
//   };

//   const getPriorityFromStatus = (status) => {
//     switch (String(status || '').toLowerCase()) {
//       case 'emergency': return 'Critical';
//       case 'en route':
//       case 'enroute': return 'High';
//       case 'available': return 'Normal';
//       case 'returning': return 'Low';
//       default: return 'Normal';
//     }
//   };

//   const getPriorityClass = (priority) => {
//     switch (priority) {
//       case 'Critical': return 'priority-critical';
//       case 'High': return 'priority-high';
//       case 'Normal': return 'priority-normal';
//       case 'Low': return 'priority-low';
//       default: return 'priority-normal';
//     }
//   };

//   // ---------------- fetch fallback (optional) ----------------
//   const fetchAmbulances = async () => {
//     try {
//       const res = await getAllAmbulances();
//       const sorted = Array.isArray(res.data) ? res.data.sort((a, b) => (a.ambulanceId || '').localeCompare(b.ambulanceId || '')) : [];
//       const sanitized = sorted.map(a => ({ ...a, location: a.location || 'Location unavailable', coordinates: a.coordinates || {} }));
//       setAmbulances(sanitized);
//       setLoading(false);
//     } catch (err) {
//       console.error("Failed to fetch ambulances (backend)", err);
//       setAmbulances([]);
//       setLoading(false);
//     }
//   };

//   const fetchStats = async () => {
//     try {
//       const res = await getStats();
//       if (res?.data) setStats(res.data);
//     } catch (err) {
//       console.error("Failed to fetch stats (backend)", err);
//     }
//   };

//   // ---------------- realtime listener ----------------
//   useEffect(() => {
//     const ambulancesRef = ref(db, 'Ambulances');

//     const unsubscribe = onValue(ambulancesRef, (snapshot) => {
//       const obj = snapshot.val();

//       if (!obj) {
//         setAmbulances([]);
//         setStats({ emergency: 0, enRoute: 0, available: 0, avgResponse: 0 });
//         setLoading(false);
//         return;
//       }

//       const arr = Object.entries(obj).map(([key, val]) => normalizeAmbulance(key, val));
//       arr.sort((a, b) => (a.ambulanceId || '').localeCompare(b.ambulanceId || ''));

//       const sanitized = arr.map(a => ({
//         ...a,
//         location: a.location || (a.coordinates?.lat ? `GPS: ${a.coordinates.lat.toFixed(6)}, ${a.coordinates.lng.toFixed(6)}` : 'Location unavailable'),
//       }));

//       // compute stats from raw nodes
//       let emergency = 0, enRoute = 0, available = 0;
//       Object.values(obj).forEach((raw) => {
//         const rawStatus = String(raw?.status || raw?.Status || raw?.state || '').trim().toLowerCase();
//         if (!rawStatus) return;
//         if (rawStatus.includes('emerg')) emergency++;
//         else if (rawStatus.includes('en') || rawStatus.includes('route') || rawStatus.includes('enroute') || rawStatus.includes('en_route')) enRoute++;
//         else if (rawStatus.includes('avail')) available++;
//       });

//       setAmbulances(sanitized);
//       setStats({ emergency, enRoute, available, avgResponse: 0 });
//       setLoading(false);
//     }, (error) => {
//       console.error('Firebase onValue error', error);
//       // fallback
//       fetchAmbulances();
//       fetchStats();
//       setLoading(false);
//     });

//     return () => {
//       try { off(ambulancesRef); } catch (e) { /* ignore */ }
//       if (typeof unsubscribe === 'function') unsubscribe();
//     };
//   }, []); // run once

//   // keep current time updated
//   useEffect(() => {
//     const timer = setInterval(() => setCurrentTime(new Date()), 1000);
//     return () => clearInterval(timer);
//   }, []);

//   // sync selectedAmbulance with updates from ambulances array
//   useEffect(() => {
//     if (!selectedAmbulance) return;
//     const updated = ambulances.find(a => a.ambulanceId === selectedAmbulance.ambulanceId);
//     if (updated) setSelectedAmbulance(prev => ({ ...prev, ...updated }));
//   }, [ambulances, selectedAmbulance]);

//   // ---------------- actions ----------------
//   const handleContactAmbulance = (ambulance) => {
//     const phone = ambulance.contactNumber || 'Not Available';
//     Swal.fire({
//       title: '📞 Contact Ambulance',
//       html: `
//         <p><strong>Driver:</strong> ${ambulance.driverName}</p>
//         <p><strong>Contact:</strong> ${phone !== 'Not Available' ? `<a href="tel:${phone}">${phone}</a>` : 'Not Available'}</p>
//         <p><strong>Status:</strong> ${ambulance.status}</p>
//       `,
//       icon: 'info',
//       showCancelButton: phone !== 'Not Available',
//       confirmButtonText: 'Close',
//       cancelButtonText: '📞 Call Driver',
//     }).then((result) => {
//       if (result.dismiss === Swal.DismissReason.cancel && phone !== 'Not Available') {
//         window.location.href = `tel:${phone}`;
//       }
//     });
//   };

//   // TRACK LIVE: show confirm -> show loading -> open new tab -> close swal
//   const handleTrackLive = (ambulance) => {
//     if (!ambulance || !ambulance.ambulanceId) {
//       Swal.fire({ icon: 'error', title: 'No ambulance selected', text: 'Cannot track this ambulance.' });
//       return;
//     }

//     Swal.fire({
//       title: '🚑 Track Ambulance Live',
//       html: `Open live tracking for <strong>${ambulance.ambulanceId}</strong> in a new tab?`,
//       icon: 'question',
//       showCancelButton: true,
//       confirmButtonText: 'Yes, Open',
//       cancelButtonText: 'Cancel',
//     }).then((result) => {
//       if (result.isConfirmed) {
//         // show loading alert while opening the tab
//         Swal.fire({
//           title: 'Opening live map…',
//           html: 'Please wait a moment.',
//           allowOutsideClick: false,
//           didOpen: () => {
//             Swal.showLoading();
//           },
//           showConfirmButton: false,
//         });

//         // choose target URL - internal map route (keeps your app handling the live map)
//         const targetPath = `/map-view/${encodeURIComponent(ambulance.ambulanceId)}`;

//         // open in new tab
//         const newTab = window.open(targetPath, '_blank');

//         // If popup blocked (newTab === null) fallback to navigate in same tab
//         if (!newTab) {
//           // open in same tab and close swal immediately
//           window.location.href = targetPath;
//           Swal.close();
//           return;
//         }

//         // give the new tab a brief moment to load and then close the swal
//         setTimeout(() => {
//           Swal.close();
//         }, 900); // small delay to let the new tab start loading
//       }
//     });
//   };

//   // optional: fetch single ambulance from backend if you want (not used often)
//   const fetchSingleAmbulance = async (id) => {
//     try {
//       const res = await getAmbulanceById(id);
//       return res.data;
//     } catch (err) {
//       console.error('Failed to fetch ambulance (single)', err);
//       return null;
//     }
//   };

//   // ---------------- UI ----------------
//   return (
//     <div className="ambulance-tracker">
//       {/* Sidebar */}
//       <div className="sidebar">
//         <div className="sidebar-header">
//           <h1 className="sidebar-title">SurakshaPath</h1>
//           <p className="sidebar-subtitle">Traffic Management System</p>
//         </div>

//         <nav className="sidebar-nav">
//           <div className="nav-item back" onClick={() => navigate('/')}>
//             <ArrowLeft className="stat-indicator" />
//             <span>Back to Dashboard</span>
//           </div>
//           <div className="nav-item active">
//             <span className="nav-icon">📍</span>
//             <span>Ambulance Tracker</span>
//           </div>
//           <div className="nav-item inactive" onClick={() => navigate('/traffic-signal')}>
//             <span className="nav-icon">⚡</span>
//             <span>Traffic Signals</span>
//           </div>
//           <div className="nav-item inactive" onClick={() => navigate('/helmet-violation')}>
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
//             <button onClick={() => { localStorage.removeItem('token'); sessionStorage.removeItem('token'); navigate('/login'); }} className="logout-button">
//               <span className="logout-icon">🔒</span>
//               Logout
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="main-content">
//         <div className="page-header">
//           <h1 className="page-title">Ambulance Tracker</h1>
//           <p className="page-subtitle">Real-time ambulance monitoring and dispatch system</p>
//         </div>

//         {/* Stats Cards */}
//         <div className="stats-grid">
//           <div className="stat-card emergency">
//             <div className="stat-header">
//               <Activity className="stat-icon" />
//               <AlertTriangle className="stat-indicator" />
//             </div>
//             <div className="stat-number">{stats.emergency}</div>
//             <div className="stat-label">Emergency Active</div>
//           </div>

//           <div className="stat-card en-route">
//             <div className="stat-header">
//               <Navigation className="stat-icon" />
//               <ArrowLeft className="stat-indicator" style={{ transform: 'rotate(45deg)' }} />
//             </div>
//             <div className="stat-number">{stats.enRoute}</div>
//             <div className="stat-label">En Route</div>
//           </div>

//           <div className="stat-card available">
//             <div className="stat-header">
//               <MapPin className="stat-icon" />
//               <div className="pulse-dot"></div>
//             </div>
//             <div className="stat-number">{stats.available}</div>
//             <div className="stat-label">Available</div>
//           </div>

//           <div className="stat-card average">
//             <div className="stat-header">
//               <Clock className="stat-icon" />
//               <span className="avg-badge">AVG</span>
//             </div>
//             <div className="stat-number">{stats.avgResponse}</div>
//             <div className="stat-label">Avg Response (min)</div>
//           </div>
//         </div>

//         {/* Ambulance List */}
//         <div className="ambulance-list">
//           <div className="list-header">
//             <h2 className="list-title">Active Ambulances</h2>
//           </div>

//           <div>
//             {ambulances.map((ambulance) => (
//               <div
//                 key={ambulance.ambulanceId}
//                 className={`ambulance-item ${selectedAmbulance?.ambulanceId === ambulance.ambulanceId ? 'selected' : ''}`}
//                 onClick={() => setSelectedAmbulance(ambulance)}
//               >
//                 <div className="ambulance-header">
//                   <div className="ambulance-basic-info">
//                     <div className={`status-dot ${getStatusClass(ambulance.status)}`}></div>
//                     <div>
//                       <div className="ambulance-id">{ambulance.ambulanceId}</div>
//                       <div className="ambulance-driver">{ambulance.driverName}</div>
//                     </div>
//                   </div>

//                   <div className="ambulance-details">
//                     <div className="detail-group">
//                       <div className="detail-primary">{ambulance.status}</div>
//                       <span className={`priority-badge ${getPriorityClass(getPriorityFromStatus(ambulance.status))}`}>
//                         {getPriorityFromStatus(ambulance.status)}
//                       </span>
//                     </div>

//                     <div className="detail-group">
//                       <div className="detail-primary">{ambulance.location}</div>
//                       <div className="detail-secondary">{timeAgo(ambulance.lastUpdated)}</div>
//                     </div>
//                   </div>
//                 </div>

//                 {ambulance.status?.toLowerCase() !== 'available' && (
//                   <div className="patient-info">
//                     <p><strong>Patient:</strong> {ambulance.caseId || "N/A"}</p>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Selected Ambulance Details */}
//         {selectedAmbulance && (
//           <div className="detailed-view">
//             <div className="detailed-header">
//               <h2 className="detailed-title">{selectedAmbulance.ambulanceId} - Detailed View</h2>
//               <div className="action-buttons">
//                 <button className="action-btn btn-contact" onClick={() => handleContactAmbulance(selectedAmbulance)}>
//                   <Phone size={16} /> Contact
//                 </button>
//                 <button className="action-btn btn-track" onClick={() => handleTrackLive(selectedAmbulance)}>
//                   <MapPin size={16} /> Track Live
//                 </button>
//               </div>
//             </div>

//             <div className="detailed-content">
//               <div className="details-grid">
//                 <div className="detail-section">
//                   <h3>Vehicle Information</h3>
//                   <div className="detail-list">
//                     <p><strong>ID:</strong> {selectedAmbulance.ambulanceId}</p>
//                     <p><strong>Driver:</strong> {selectedAmbulance.driverName}</p>
//                     <p>
//                       <strong>Status:</strong>
//                       <span className={`status-badge status-${getStatusClass(selectedAmbulance.status)}`}> {selectedAmbulance.status} </span>
//                     </p>
//                   </div>
//                 </div>

//                 <div className="detail-section">
//                   <h3>Location Details</h3>
//                   <div className="detail-list">
//                     <p><strong>Current Location:</strong> {selectedAmbulance.location || "Waiting for GPS..."}</p>
//                     <p><strong>Last Updated:</strong> {timeAgo(selectedAmbulance?.lastUpdated)}</p>
//                   </div>
//                 </div>

//                 <div className="detail-section">
//                   <h3>Emergency Details</h3>
//                   <div className="detail-list">
//                     <p>
//                       <strong>Priority:</strong>
//                       <span className={`priority-badge ${getPriorityClass(getPriorityFromStatus(selectedAmbulance.status))}`}>
//                         {getPriorityFromStatus(selectedAmbulance.status)}
//                       </span>
//                     </p>

//                     {selectedAmbulance.status?.toLowerCase() !== 'available' && (
//                       <p><strong>Case ID:</strong> {selectedAmbulance.caseId || 'N/A'}</p>
//                     )}

//                     <p><strong>Coordinates:</strong> {selectedAmbulance.coordinates?.lat || 'N/A'}, {selectedAmbulance.coordinates?.lng || 'N/A'}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// };

// export default AmbulanceTracker;

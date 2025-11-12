// // src/components/MapView.jsx
// import React, { useEffect, useRef, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
// import { ref, onValue, off } from "firebase/database";
// import { db } from '../firebaseInit'; // we'll show firebaseInit below
// import Swal from 'sweetalert2';

// // map container style
// const containerStyle = {
//   width: '100%',
//   height: '80vh',
// };

// const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || 'AIzaSyDGml1x4FZqbDqongCIrMg_MEeIAUBdbIM';

// const MapView = () => {
//   const { id } = useParams(); // ambulance id
//   const navigate = useNavigate();
//   const [positions, setPositions] = useState([]); // historic positions
//   const [current, setCurrent] = useState(null);   // latest position object {lat, lng, ts}
//   const [loading, setLoading] = useState(true);

//   const markerRef = useRef(null);
//   const mapRef = useRef(null);
//   const animRef = useRef(null); // store animation frame

//   // load Google Maps API
//   const { isLoaded, loadError } = useJsApiLoader({
//     googleMapsApiKey: GOOGLE_MAPS_API_KEY,
//     libraries: ['places'],
//   });

//   // Attach realtime listener to /Ambulances/{id}
//   useEffect(() => {
//     if (!id) return;
//     const ambRef = ref(db, `Ambulances/${id}`);
//     const unsub = onValue(ambRef, (snap) => {
//       const data = snap.val();
//       if (!data) return;
//       // read coordinates from possible fields
//       const lat = parseFloat(data.Latitude ?? data.Location?.lat ?? data.coordinates?.lat ?? data.lat ?? 0);
//       const lng = parseFloat(data.Longitude ?? data.Location?.lng ?? data.coordinates?.lng ?? data.lng ?? 0);
//       const ts = data.lastUpdated || data.lastUpdate || new Date().toISOString();

//       if (!lat || !lng) return;

//       const pos = { lat: Number(lat), lng: Number(lng), ts: new Date(ts).toISOString() };
//       setCurrent(pos);
//       setPositions(prev => {
//         const next = [...prev, pos];
//         // keep last N points (avoid memory growth)
//         return next.slice(-200);
//       });
//       setLoading(false);
//     }, (err) => {
//       console.error('map onValue err:', err);
//       setLoading(false);
//     });

//     return () => {
//       try { off(ambRef); } catch (e) {}
//       if (typeof unsub === 'function') unsub();
//     };
//   }, [id]);

//   // Smoothly animate marker between previous and current position
//   useEffect(() => {
//     if (!isLoaded || !current || !mapRef.current) return;

//     const map = mapRef.current;
//     // if marker doesn't exist, center map and place marker
//     if (!markerRef.current) {
//       const mk = new window.google.maps.Marker({
//         position: { lat: current.lat, lng: current.lng },
//         map,
//         title: id,
//         icon: {
//           path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
//           scale: 5,
//           rotation: 0,
//           fillColor: '#ff3b30',
//           fillOpacity: 1,
//           strokeWeight: 1,
//         },
//       });
//       markerRef.current = mk;
//       map.panTo({ lat: current.lat, lng: current.lng });
//       return;
//     }

//     // animate from markerRef.current.getPosition() -> current
//     const startLatLng = markerRef.current.getPosition();
//     const start = { lat: startLatLng.lat(), lng: startLatLng.lng() };
//     const end = { lat: current.lat, lng: current.lng };

//     // compute rotation angle for icon
//     const computeHeading = (from, to) => {
//       if (!window.google) return 0;
//       return window.google.maps.geometry ? window.google.maps.geometry.spherical.computeHeading(from, to) : 0;
//     };

//     const startTime = performance.now();
//     const duration = 1000; // ms for smooth transition (adjust as you like)

//     const step = (now) => {
//       const t = Math.min((now - startTime) / duration, 1);
//       const easeT = t < 0.5 ? (2*t*t) : (-1 + (4 - 2*t)*t); // easeInOut (simple)
//       const lat = start.lat + (end.lat - start.lat) * easeT;
//       const lng = start.lng + (end.lng - start.lng) * easeT;

//       markerRef.current.setPosition({ lat, lng });

//       // rotate icon toward heading if geometry lib loaded
//       try {
//         const heading = computeHeading(start, end);
//         const icon = markerRef.current.getIcon();
//         if (icon && icon.rotation !== heading) {
//           markerRef.current.setIcon({ ...icon, rotation: heading });
//         }
//       } catch (e) { /* ignore */ }

//       if (t < 1) {
//         animRef.current = requestAnimationFrame(step);
//       } else {
//         // ensure final pos
//         markerRef.current.setPosition(end);
//         // keep map centered (optional: center only if user hasn't moved)
//         map.panTo(end);
//       }
//     };

//     // cancel previous animation
//     if (animRef.current) cancelAnimationFrame(animRef.current);
//     animRef.current = requestAnimationFrame(step);

//     return () => {
//       if (animRef.current) cancelAnimationFrame(animRef.current);
//     };
//   }, [current, isLoaded, id]);

//   if (loadError) {
//     return (
//       <div>
//         <p>Map failed to load. Check your Google Maps key and console.</p>
//         <button onClick={() => navigate(-1)}>Back</button>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: 12 }}>
//       <div style={{ marginBottom: 8 }}>
//         <button onClick={() => navigate(-1)} className="btn">← Back</button>
//         <span style={{ marginLeft: 12, fontWeight: 600 }}>{id} — Live Track</span>
//         {loading && <span style={{ marginLeft: 12, color: '#666' }}>Loading...</span>}
//       </div>

//       {isLoaded ? (
//         <GoogleMap
//           mapContainerStyle={containerStyle}
//           center={current ? { lat: current.lat, lng: current.lng } : { lat: 21.1702, lng: 72.8311 }}
//           zoom={15}
//           onLoad={(map) => {
//             mapRef.current = map;
//           }}
//         >
//           {/* Polyline path */}
//           {positions.length > 1 && (
//             <Polyline
//               path={positions.map(p => ({ lat: p.lat, lng: p.lng }))}
//               options={{ strokeColor: '#3b82f6', strokeWeight: 4, geodesic: true }}
//             />
//           )}

//           {/* You can optionally render a static marker fallback */}
//           {current && !markerRef.current && (
//             <Marker position={{ lat: current.lat, lng: current.lng }} />
//           )}
//         </GoogleMap>
//       ) : (
//         <div>Loading Google Maps...</div>
//       )}
//     </div>
//   );
// };

// export default MapView;


// // src/components/MapView.jsx
// import React, { useEffect, useRef, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import {
//   GoogleMap,
//   Polyline,
//   useJsApiLoader,
//   OverlayView,
// } from "@react-google-maps/api";
// import Swal from "sweetalert2";

// // Firebase inline init (replace with your firebaseInit import if you have one)
// import { initializeApp } from "firebase/app";
// import { getDatabase, ref, onValue, off } from "firebase/database";

// const firebaseConfig = {
//   databaseURL: "https://surakshapath-61e6f-default-rtdb.firebaseio.com",
// };
// const app = initializeApp(firebaseConfig);
// const db = getDatabase(app);

// // map container style
// const containerStyle = {
//   width: "100%",
//   height: "82vh",
// };

// const GOOGLE_MAPS_API_KEY =
//   process.env.REACT_APP_GOOGLE_MAPS_KEY || "AIzaSyDGml1x4FZqbDqongCIrMg_MEeIAUBdbIM";

// const MapView = () => {
//   const { id } = useParams(); // ambulance id param
//   const navigate = useNavigate();

//   // positions = historical lat/lng points; current = latest point
//   const [positions, setPositions] = useState([]);
//   const [current, setCurrent] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // UI state
//   const [follow, setFollow] = useState(true);
//   const [dashOffset, setDashOffset] = useState("0%");
//   const [driverInfo, setDriverInfo] = useState({ driverName: "", status: "" });

//   // refs
//   const mapRef = useRef(null);
//   const animRef = useRef(null);
//   const dashTickerRef = useRef(null);

//   // load Google Maps
//   const { isLoaded, loadError } = useJsApiLoader({
//     googleMapsApiKey: GOOGLE_MAPS_API_KEY,
//     libraries: ["places", "geometry"],
//   });

//   // inject styles (component-scoped)
//   useEffect(() => {
//     const css = `
//       .mv-wrapper { font-family: Inter, Roboto, system-ui; padding: 12px; background: linear-gradient(180deg,#f7fbff 0%, #f3f7fb 100%); min-height: 100vh; box-sizing: border-box; }
//       .mv-topbar { display:flex; gap:12px; align-items:center; margin-bottom:10px; }
//       .mv-back { background:#fff; border-radius:10px; padding:8px 12px; box-shadow:0 6px 18px rgba(25,40,80,0.06); border:none; cursor:pointer; font-weight:600; }
//       .mv-title { font-size:18px; font-weight:700; color:#0f172a; }
//       .mv-sub { font-size:13px; color:#475569; margin-left:6px; }
//       .mv-mapwrap { position:relative; border-radius:14px; overflow:hidden; box-shadow:0 8px 30px rgba(10,20,50,0.06); }
//       .mv-panel { position:absolute; right:18px; top:18px; z-index:10; width:300px; background:linear-gradient(135deg,#ffffffee,#f8fbffcc); border-radius:12px; padding:12px; box-shadow:0 8px 24px rgba(11,22,50,0.08); backdrop-filter: blur(6px); }
//       .mv-panel h3 { margin:0; font-size:15px; color:#0b1220; }
//       .mv-panel .small { font-size:12px; color:#475569; margin-top:6px; }
//       .mv-controls { display:flex; gap:8px; margin-top:10px; }
//       .mv-btn { flex:1; background:#0ea5e9; color:white; border:none; padding:8px; border-radius:8px; cursor:pointer; font-weight:600; box-shadow:0 6px 16px rgba(14,165,233,0.18); }
//       .mv-btn.secondary { background:#fff; color:#0f172a; border:1px solid #e6eef8; box-shadow:none; }
//       .mv-footer-card { position:absolute; left:18px; bottom:18px; z-index:10; background:#fff; padding:12px; border-radius:12px; box-shadow:0 12px 40px rgba(11,22,50,0.08); width:320px; }
//       .mv-list { max-height:220px; overflow:auto; margin-top:8px; }
//       .mv-list-item { display:flex; justify-content:space-between; padding:8px 6px; border-bottom:1px dashed #eef3fa; }
//       .mv-ambulance-dot { width:14px; height:14px; border-radius:50%; background:#ff3b30; box-shadow:0 6px 18px rgba(255,59,48,0.12); margin-right:10px; flex:0 0 14px; }
//       /* custom marker overlay (DOM) */
//       .mv-marker { transform: translate(-50%, -50%); pointer-events: auto; display:flex; flex-direction:column; align-items:center; }
//       .mv-marker .halo { width:44px; height:44px; border-radius:50%; background: radial-gradient(circle at center, rgba(59,130,246,0.18), rgba(59,130,246,0.04)); animation: mvPulse 1.8s infinite; }
//       .mv-marker .ambulance { margin-top:-36px; width:34px; height:34px; display:flex; align-items:center; justify-content:center; background:#fff; border-radius:8px; box-shadow:0 6px 18px rgba(9,20,40,0.12); transform: rotate(0deg); transition: transform 0.3s linear; }
//       @keyframes mvPulse { 0% { transform:scale(0.9); opacity:0.9 } 50% { transform:scale(1.12); opacity:0.6 } 100% { transform:scale(0.9); opacity:0.9 } }
//       .mv-marker svg { width:20px; height:20px; fill:#ef4444; }
//       .mv-meta { margin-top:8px; background: rgba(15,23,42,0.95); color:#fff; padding:6px 10px; border-radius:10px; font-size:12px; box-shadow:0 8px 28px rgba(2,6,23,0.35); }
//       .mv-badge { display:inline-block; padding:4px 8px; border-radius:999px; font-size:12px; font-weight:700; }
//       .mv-status-emerg { background: linear-gradient(90deg,#ffecd1,#ffd7d2); color:#b91c1c; }
//       .mv-speed { color:#0ea5e9; font-weight:700; }
//       /* mobile tweaks */
//       @media (max-width:900px) {
//         .mv-panel { width: 220px; right: 10px; top: 10px; }
//         .mv-footer-card { left: 10px; width: 240px; bottom: 10px; }
//       }
//     `;
//     const style = document.createElement("style");
//     style.id = "mapview-styles";
//     style.innerHTML = css;
//     if (!document.getElementById("mapview-styles")) document.head.appendChild(style);
//     return () => {
//       const el = document.getElementById("mapview-styles");
//       if (el) el.remove();
//     };
//   }, []);

//   // realtime listener to `/Ambulances/{id}` (coordinates, meta)
//   useEffect(() => {
//     if (!id) return;
//     const ambRef = ref(db, `Ambulances/${id}`);
//     const unsub = onValue(
//       ambRef,
//       (snap) => {
//         const data = snap.val();
//         if (!data) {
//           setLoading(false);
//           return;
//         }

//         // read coords from multiple possible field names
//         const lat = parseFloat(
//           data.Latitude ??
//             data.Location?.lat ??
//             data.coordinates?.lat ??
//             data.lat ??
//             data.Lat ??
//             0
//         );
//         const lng = parseFloat(
//           data.Longitude ??
//             data.Location?.lng ??
//             data.coordinates?.lng ??
//             data.lng ??
//             data.Lng ??
//             0
//         );

//         const ts = data.lastUpdated || data.lastUpdate || new Date().toISOString();
//         const driver = data.driverName || data.driver || data.driver_name || "Unknown";
//         const status = data.status || data.Status || "Unknown";

//         setDriverInfo({ driverName: driver, status });

//         if (!lat || !lng) {
//           setLoading(false);
//           return;
//         }

//         const next = { lat: Number(lat), lng: Number(lng), ts: new Date(ts).toISOString() };

//         setCurrent(next);
//         setPositions((prev) => {
//           const merged = [...prev, next].slice(-300); // keep last 300 points
//           return merged;
//         });
//         setLoading(false);
//       },
//       (err) => {
//         console.error("Firebase map listener error:", err);
//         setLoading(false);
//       }
//     );

//     return () => {
//       try {
//         off(ambRef);
//       } catch (e) {}
//       if (typeof unsub === "function") unsub();
//     };
//   }, [id]);

//   // animate "dashed" polyline offset to create moving effect
//   useEffect(() => {
//     dashTickerRef.current = setInterval(() => {
//       setDashOffset((prev) => {
//         // increment percent, wrap at 100
//         const n = parseInt(prev || "0", 10);
//         const next = (n + 3) % 100;
//         return `${next}%`;
//       });
//     }, 80); // speed of dash movement

//     return () => {
//       clearInterval(dashTickerRef.current);
//     };
//   }, []);

//   // when current changes and follow is enabled, pan map smoothly
//   useEffect(() => {
//     if (!current || !mapRef.current || !follow) return;
//     try {
//       // smooth pan if available
//       mapRef.current.panTo({ lat: current.lat, lng: current.lng });
//     } catch (e) { /* ignore */ }
//   }, [current, follow]);

//   // compute polyline options with animated icons
//   const polylineOptions = {
//     strokeOpacity: 0.0, // hide base stroke (we draw with icons)
//     clickable: false,
//     icons: [
//       {
//         icon: {
//           path: "M 0,-1 0,1", // small dash
//           strokeOpacity: 1,
//           strokeColor: "#60a5fa",
//           scale: 4,
//         },
//         offset: dashOffset,
//         repeat: "12px",
//       },
//     ],
//     geodesic: true,
//   };

//   if (loadError) {
//     return (
//       <div style={{ padding: 16 }}>
//         <p>Map failed to load. Check Google Maps API key in environment.</p>
//         <button onClick={() => navigate(-1)}>Back</button>
//       </div>
//     );
//   }

//   return (
//     <div className="mv-wrapper">
//       <div className="mv-topbar">
//         <button className="mv-back" onClick={() => navigate(-1)}>
//           ← Back
//         </button>
//         <div>
//           <div className="mv-title">{id} — Live Tracking</div>
//           <div className="mv-sub">Real-time position, path animation & smooth marker</div>
//         </div>
//         <div style={{ flex: 1 }} />
//         <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//           <div style={{ fontSize: 13, color: "#475569" }}>
//             {current ? (
//               <>
//                 <strong style={{ color: "#0f172a" }}>{new Date(current.ts).toLocaleString()}</strong>
//                 <div style={{ fontSize: 12, color: "#64748b" }}>Last update</div>
//               </>
//             ) : (
//               <span style={{ color: "#94a3b8" }}>Waiting for GPS…</span>
//             )}
//           </div>
//         </div>
//       </div>

//       <div className="mv-mapwrap">
//         {isLoaded ? (
//           <GoogleMap
//             mapContainerStyle={containerStyle}
//             center={current ? { lat: current.lat, lng: current.lng } : { lat: 21.1702, lng: 72.8311 }}
//             zoom={15}
//             onLoad={(map) => {
//               mapRef.current = map;
//             }}
//             options={{
//               streetViewControl: false,
//               mapTypeControl: false,
//               fullscreenControl: false,
//               zoomControl: true,
//               styles: [
//                 // gentle map style — optional
//                 {
//                   featureType: "poi",
//                   stylers: [{ visibility: "off" }],
//                 },
//               ],
//             }}
//           >
//             {/* Animated polyline (dashed-moving) */}
//             {positions.length > 1 && <Polyline path={positions.map((p) => ({ lat: p.lat, lng: p.lng }))} options={polylineOptions} />}

//             {/* DOM-based overlay marker (allows CSS animation & rotation) */}
//             {current && (
//               <OverlayView
//                 position={{ lat: current.lat, lng: current.lng }}
//                 mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
//               >
//                 <div
//                   className="mv-marker"
//                   // rotate based on last two points if available
//                   style={{
//                     transform:
//                       positions.length > 1
//                         ? `translate(-50%, -50%) rotate(${computeHeadingFromPositions(positions).toFixed(0)}deg)`
//                         : "translate(-50%, -50%)",
//                     pointerEvents: "auto",
//                     cursor: "pointer",
//                   }}
//                 >
//                   <div className="halo" style={{ pointerEvents: "none" }} />
//                   <div
//                     className="ambulance"
//                     onClick={() => {
//                       // small info popup
//                       Swal.fire({
//                         title: `${id}`,
//                         html: `<p><strong>Driver:</strong> ${driverInfo.driverName || "N/A"}</p>
//                                <p><strong>Status:</strong> ${driverInfo.status || "N/A"}</p>
//                                <p><strong>Coords:</strong> ${current.lat.toFixed(6)}, ${current.lng.toFixed(6)}</p>`,
//                         showCloseButton: true,
//                         showConfirmButton: false,
//                         background: "#f8fbff",
//                       });
//                     }}
//                   >
//                     {/* simple ambulance SVG icon */}
//                     <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
//                       <path d="M3 11h2v-2a2 2 0 012-2h6V5H7a4 4 0 00-4 4v4z" fill="#ef4444" opacity="0.95"></path>
//                       <path d="M17 9h2l1 2h-3z" fill="#ef4444"></path>
//                       <circle cx="7.5" cy="17.5" r="1.5" fill="#0f172a"></circle>
//                       <circle cx="17.5" cy="17.5" r="1.5" fill="#0f172a"></circle>
//                     </svg>
//                   </div>

//                   <div className="mv-meta">
//                     <div style={{ fontWeight: 700 }}>{driverInfo.driverName || id}</div>
//                     <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
//                       <div className="mv-badge mv-status-emerg" style={{ padding: "4px 8px" }}>{driverInfo.status || "N/A"}</div>
//                       <div style={{ fontSize: 12, color: "#dbeafe" }}>
//                         {current ? <span className="mv-speed">{new Date(current.ts).toLocaleTimeString()}</span> : "—"}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </OverlayView>
//             )}
//           </GoogleMap>
//         ) : (
//           <div style={{ padding: 20 }}>Loading Google Maps...</div>
//         )}

//         {/* top-right info panel */}
//         <div className="mv-panel">
//           <h3>{id}</h3>
//           <div className="small">Driver: <strong>{driverInfo.driverName || "Unknown"}</strong></div>
//           <div className="small" style={{ marginTop: 6 }}>Status: <strong>{driverInfo.status || "Unknown"}</strong></div>

//           <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
//             <button
//               className="mv-btn"
//               onClick={() => {
//                 if (!current) {
//                   Swal.fire({ icon: "error", title: "No GPS yet", text: "Cannot open live view yet." });
//                   return;
//                 }
//                 // open a larger live viewer in new tab (same route) — keep user's choice
//                 window.open(`/map-view/${encodeURIComponent(id)}`, "_blank");
//               }}
//             >
//               Open in New Tab
//             </button>

//             <button
//               className="mv-btn secondary"
//               onClick={() => setFollow((f) => !f)}
//               title="Toggle follow"
//             >
//               {follow ? "Unfollow" : "Follow"}
//             </button>
//           </div>

//           <div style={{ marginTop: 10 }}>
//             <div style={{ fontSize: 12, color: "#64748b" }}>Path points</div>
//             <div style={{ fontWeight: 700, fontSize: 18, marginTop: 6 }}>{positions.length}</div>
//           </div>
//         </div>

//         {/* bottom-left recent points card */}
//         <div className="mv-footer-card">
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//             <div>
//               <div style={{ fontWeight: 800, fontSize: 15 }}>{id} — Recent</div>
//               <div style={{ fontSize: 12, color: "#64748b" }}>{driverInfo.driverName || "Driver unknown"}</div>
//             </div>
//             <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//               <div style={{ fontSize: 12, color: "#94a3b8" }}>{loading ? "Loading…" : "Live"}</div>
//               <div style={{ width: 10, height: 10, borderRadius: 999, background: current ? "#22c55e" : "#cbd5e1" }} />
//             </div>
//           </div>

//           <div className="mv-list" style={{ marginTop: 10 }}>
//             {positions.slice().reverse().slice(0, 12).map((p, idx) => (
//               <div className="mv-list-item" key={idx}>
//                 <div style={{ display: "flex", alignItems: "center" }}>
//                   <div className="mv-ambulance-dot" />
//                   <div>
//                     <div style={{ fontWeight: 700, fontSize: 13 }}>{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</div>
//                     <div style={{ fontSize: 12, color: "#64748b" }}>{new Date(p.ts).toLocaleTimeString()}</div>
//                   </div>
//                 </div>
//                 <div style={{ textAlign: "right", fontSize: 12, color: "#94a3b8" }}>
//                   {calcDistanceLabel(p, positions[positions.length - 1])}
//                 </div>
//               </div>
//             ))}

//             {positions.length === 0 && <div style={{ padding: 8, color: "#94a3b8" }}>No positions yet</div>}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MapView;

// /* ---------- helper functions (placed below component) ---------- */

// // compute heading degree between last two positions (0 if not available)
// function computeHeadingFromPositions(points = []) {
//   if (!points || points.length < 2) return 0;
//   const a = points[points.length - 2];
//   const b = points[points.length - 1];
//   if (!a || !b) return 0;

//   // simple heading formula (approx) using atan2(dLng, dLat) in degrees
//   const dy = b.lat - a.lat;
//   const dx = b.lng - a.lng;
//   const theta = Math.atan2(dx, dy) * (180 / Math.PI); // swapped to point forward
//   return theta;
// }

// // simple Haversine distance label between two points
// function calcDistanceLabel(p1, p2) {
//   if (!p1 || !p2) return "";
//   const R = 6371e3; // metres
//   const toRad = (d) => (d * Math.PI) / 180;
//   const φ1 = toRad(p1.lat);
//   const φ2 = toRad(p2.lat);
//   const Δφ = toRad(p2.lat - p1.lat);
//   const Δλ = toRad(p2.lng - p1.lng);

//   const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//     Math.cos(φ1) * Math.cos(φ2) *
//     Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   const d = R * c; // metres
//   if (d < 1000) return `${Math.round(d)} m`;
//   return `${(d / 1000).toFixed(2)} km`;
// }


// src/components/MapView.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GoogleMap, Polyline, useJsApiLoader, OverlayView } from "@react-google-maps/api";
import Swal from "sweetalert2";

// Firebase inline init (replace with your firebaseInit import if you have one)
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, off } from "firebase/database";

const firebaseConfig = {
  databaseURL: "https://surakshapath-61e6f-default-rtdb.firebaseio.com",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Map container
const containerStyle = { width: "100%", height: "86vh" };

// Replace with process.env... in production
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || "YOUR_GOOGLE_MAPS_API_KEY";

const MapView = () => {
  const { id } = useParams(); // ambulance id
  const navigate = useNavigate();

  const [positions, setPositions] = useState([]); // array of {lat,lng,ts}
  const [current, setCurrent] = useState(null);
  const [driverInfo, setDriverInfo] = useState({ driverName: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [follow, setFollow] = useState(true);
  const [dashOffset, setDashOffset] = useState("0%");
  const [destination, setDestination] = useState(null); // optional dest {lat,lng,label}

  const mapRef = useRef(null);
  const dashTickerRef = useRef(null);

  // load google maps api
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places", "geometry"],
  });

  // inject compact styles for attractive UI (component-scoped)
  useEffect(() => {
    const css = `
      .swg-wrapper { font-family: Inter, Roboto, system-ui; padding: 14px; background: linear-gradient(180deg,#f8fbff 0%, #f3f7fb 100%); min-height: 100vh; box-sizing: border-box; }
      .swg-top { display:flex; gap:12px; align-items:center; margin-bottom:12px; }
      .swg-back { background:#fff; border-radius:10px; padding:8px 12px; box-shadow:0 8px 30px rgba(15,23,42,0.06); border:none; cursor:pointer; font-weight:600; }
      .swg-title { font-size:18px; font-weight:700; color:#0f172a; }
      .swg-sub { font-size:13px; color:#475569; margin-left:6px; }
      .swg-mapwrap { position:relative; border-radius:14px; overflow:hidden; box-shadow:0 12px 40px rgba(11,22,50,0.06); }
      .swg-panel { position:absolute; right:18px; top:18px; z-index:20; width:320px; background:linear-gradient(180deg,#ffffffee,#f7fbffcc); border-radius:12px; padding:12px; box-shadow:0 12px 40px rgba(11,22,50,0.08); backdrop-filter: blur(6px); }
      .swg-panel h3 { margin:0; font-size:15px; color:#0b1220; }
      .swg-panel small { color:#475569; display:block; margin-top:6px; }
      .swg-btn { flex:1; background:#0ea5e9; color:#fff; border:none; padding:8px; border-radius:10px; cursor:pointer; font-weight:700; box-shadow:0 10px 30px rgba(14,165,233,0.12); }
      .swg-btn.alt { background:#fff; color:#0f172a; border:1px solid #e6eef8; box-shadow:none; }
      .swg-footer { position:absolute; left:18px; bottom:18px; z-index:20; background:#fff; padding:12px; border-radius:12px; box-shadow:0 16px 48px rgba(11,22,50,0.08); width:340px; }
      .swg-list { max-height:240px; overflow:auto; margin-top:8px; }
      .swg-list-item { display:flex; justify-content:space-between; padding:10px 6px; border-bottom:1px solid #f1f7ff; }
      .swg-dot { width:14px; height:14px; border-radius:50%; background:#0ea5e9; box-shadow:0 6px 18px rgba(14,165,233,0.12); margin-right:10px; }
      .swg-marker { transform: translate(-50%, -50%); pointer-events:auto; display:flex; flex-direction:column; align-items:center; }
      .swg-halo { width:56px; height:56px; border-radius:50%; background: radial-gradient(circle at center, rgba(14,165,233,0.18), rgba(14,165,233,0.03)); animation: swgPulse 1.7s infinite; }
      .swg-vehicle { margin-top:-44px; width:46px; height:46px; display:flex; align-items:center; justify-content:center; background:#fff; border-radius:12px; box-shadow:0 10px 30px rgba(9,20,40,0.12); transform: rotate(0deg); transition: transform 0.25s linear; }
      .swg-vehicle svg { width:26px; height:26px; fill:#ef4444; }
      @keyframes swgPulse { 0% { transform:scale(0.92); opacity:0.95 } 50% { transform:scale(1.14); opacity:0.6 } 100% { transform:scale(0.92); opacity:0.95 } }
      .swg-bubble { margin-top:8px; background: rgba(2,6,23,0.92); color:#fff; padding:8px 12px; border-radius:12px; font-size:13px; box-shadow:0 12px 34px rgba(2,6,23,0.28); display:flex; gap:10px; align-items:center; }
      .swg-eta { background:#0f172a; color:#fff; padding:6px 10px; border-radius:999px; font-weight:800; font-size:13px; }
      .swg-eta-small { font-size:12px; color:#e6eefc; }
      .swg-dest-pin { width:40px; height:40px; display:flex; align-items:center; justify-content:center; background:#111827; border-radius:10px; color:#fff; font-weight:700; }
      .swg-label { font-size:12px; color:#64748b; }
      .swg-floating-bubble { position:absolute; left:50%; transform: translateX(-50%); bottom:86px; z-index:15; pointer-events:none; }
      .swg-eta-bubble { background:#0f172a; color:#fff; padding:8px 14px; border-radius:10px; font-weight:700; box-shadow:0 10px 36px rgba(2,6,23,0.28); }
      @media (max-width:900px) {
        .swg-panel { width:220px; right:10px; top:10px; }
        .swg-footer { left:10px; width:220px; bottom:10px; }
      }
    `;
    const style = document.createElement("style");
    style.id = "swg-map-styles";
    style.innerHTML = css;
    if (!document.getElementById("swg-map-styles")) document.head.appendChild(style);
    return () => {
      const el = document.getElementById("swg-map-styles");
      if (el) el.remove();
    };
  }, []);

  // Firebase realtime listener for ambulance node
  useEffect(() => {
    if (!id) return;
    const ambRef = ref(db, `Ambulances/${id}`);
    const unsub = onValue(
      ambRef,
      (snap) => {
        const data = snap.val();
        if (!data) {
          setLoading(false);
          return;
        }

        // read coordinates from likely fields
        const lat = parseFloat(
          data.Latitude ??
            data.Location?.lat ??
            data.coordinates?.lat ??
            data.lat ??
            data.Lat ??
            0
        );
        const lng = parseFloat(
          data.Longitude ??
            data.Location?.lng ??
            data.coordinates?.lng ??
            data.lng ??
            data.Lng ??
            0
        );

        const ts = data.lastUpdated || data.lastUpdate || new Date().toISOString();
        const driver = data.driverName || data.driver || data.driver_name || "Driver";
        const status = data.status || data.Status || "Unknown";
        setDriverInfo({ driverName: driver, status });

        // optional destination fields (if you store them)
        const destLat = parseFloat(data.destinationLat ?? data.destLat ?? data.destination?.lat ?? 0);
        const destLng = parseFloat(data.destinationLng ?? data.destLng ?? data.destination?.lng ?? 0);
        if (destLat && destLng) {
          setDestination({ lat: destLat, lng: destLng, label: data.destinationLabel || "Destination" });
        }

        if (!lat || !lng) {
          setLoading(false);
          return;
        }

        const next = { lat: Number(lat), lng: Number(lng), ts: new Date(ts).toISOString() };
        setCurrent(next);
        setPositions((prev) => {
          const arr = [...prev, next].slice(-400); // keep last 400 points
          return arr;
        });
        setLoading(false);
      },
      (err) => {
        console.error("Firebase onValue error (map):", err);
        setLoading(false);
      }
    );

    return () => {
      try { off(ambRef); } catch (e) {}
      if (typeof unsub === "function") unsub();
    };
  }, [id]);

  // moving dash for animated route
  useEffect(() => {
    dashTickerRef.current = setInterval(() => {
      setDashOffset((prev) => {
        const n = parseInt(prev || "0", 10);
        const next = (n + 4) % 100;
        return `${next}%`;
      });
    }, 70);

    return () => {
      clearInterval(dashTickerRef.current);
    };
  }, []);

  // center/pan when current updates if follow enabled
  useEffect(() => {
    if (!current || !mapRef.current || !follow) return;
    try { mapRef.current.panTo({ lat: current.lat, lng: current.lng }); } catch (e) {}
  }, [current, follow]);

  const polyOptions = {
    strokeOpacity: 0,
    clickable: false,
    icons: [
      {
        icon: {
          path: "M 0,-1 0,1",
          strokeOpacity: 1,
          strokeColor: "#60a5fa",
          scale: 4,
        },
        offset: dashOffset,
        repeat: "12px",
      },
    ],
    geodesic: true,
  };

  // handle load error
  if (loadError) {
    return (
      <div style={{ padding: 16 }}>
        <p>Map failed to load. Check your Google Maps API key and console.</p>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  // compute ETA (if destination present) using last two points speed
  const computeETA = () => {
    if (!destination || !current || positions.length < 2) return null;
    const last = positions[positions.length - 1];
    const prev = positions[positions.length - 2];
    if (!prev || !last) return null;

    const metersPerSec = haversineDistance(prev, last) / ((new Date(last.ts) - new Date(prev.ts)) / 1000 || 1);
    // fallback very slow if no movement
    const speed = metersPerSec > 0 ? metersPerSec : 2; // 2 m/s fallback (~7km/h)
    const dist = haversineDistance(last, destination); // meters
    const secs = dist / speed;
    if (!isFinite(secs) || secs < 0) return null;
    const mins = Math.max(1, Math.round(secs / 60));
    return `${mins} min`;
  };

  // compute heading (deg) between last two
  const heading = computeHeadingFromPositions(positions);

  return (
    <div className="swg-wrapper">
      <div className="swg-top">
        <button className="swg-back" onClick={() => navigate(-1)}>← Back</button>
        <div>
          <div className="swg-title">{id} — Live Track</div>
          <div className="swg-sub">Smooth motion • Animated path • ETA & status</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 13, color: "#475569" }}>
            {current ? (
              <>
                <strong style={{ color: "#0f172a" }}>{new Date(current.ts).toLocaleTimeString()}</strong>
                <div style={{ fontSize: 12, color: "#64748b" }}>Last update</div>
              </>
            ) : (<span style={{ color: "#94a3b8" }}>Waiting for GPS…</span>)}
          </div>
        </div>
      </div>

      <div className="swg-mapwrap">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={current ? { lat: current.lat, lng: current.lng } : { lat: 21.1702, lng: 72.8311 }}
            zoom={15}
            onLoad={(map) => { mapRef.current = map; }}
            options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: true }}
          >
            {/* Animated polyline */}
            {positions.length > 1 && (
              <Polyline path={positions.map(p => ({ lat: p.lat, lng: p.lng }))} options={polyOptions} />
            )}

            {/* destination marker */}
            {destination && (
              <OverlayView position={{ lat: destination.lat, lng: destination.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                <div style={{ transform: "translate(-50%,-100%)", pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ background: "#0f172a", color: "#fff", padding: "6px 10px", borderRadius: 10, fontWeight: 800, boxShadow: "0 8px 30px rgba(2,6,23,0.18)" }}>
                    {destination.label || "Drop"}
                  </div>
                  <div style={{ width: 12, height: 12, background: "#0f172a", transform: "rotate(45deg)" }} />
                </div>
              </OverlayView>
            )}

            {/* moving vehicle as DOM overlay */}
            {current && (
              <OverlayView position={{ lat: current.lat, lng: current.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                <div
                  className="swg-marker"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${heading.toFixed(0)}deg)`,
                    pointerEvents: "auto"
                  }}
                >
                  <div className="swg-halo" />
                  <div
                    className="swg-vehicle"
                    onClick={() => {
                      Swal.fire({
                        title: `${id} • ${driverInfo.driverName}`,
                        html: `<p><strong>Status:</strong> ${driverInfo.status || "N/A"}</p>
                               <p><strong>Coords:</strong> ${current.lat.toFixed(6)}, ${current.lng.toFixed(6)}</p>`,
                        showCloseButton: true, confirmButtonText: "Close"
                      });
                    }}
                    style={{ transform: `rotate(${heading.toFixed(0)}deg)` }}
                  >
                    {/* vehicle svg */}
                    <svg viewBox="0 0 24 24" aria-hidden>
                      <path d="M3 11h2v-2a2 2 0 012-2h6V5H7a4 4 0 00-4 4v4z" fill="#ef4444"></path>
                      <path d="M17 9h2l1 2h-3z" fill="#ef4444"></path>
                      <circle cx="7.5" cy="17.5" r="1.5" fill="#0f172a"></circle>
                      <circle cx="17.5" cy="17.5" r="1.5" fill="#0f172a"></circle>
                    </svg>
                  </div>

                  {/* small dark bubble (like Swiggy ETA bubble) */}
                  <div className="swg-bubble" style={{ pointerEvents: "none" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div className="swg-eta">{computeETA() || "Arriving"}</div>
                      <small className="swg-eta-small">ETA</small>
                    </div>
                    <div style={{ marginLeft: 8, textAlign: "left" }}>
                      <div style={{ fontWeight: 800 }}>{driverInfo.driverName || id}</div>
                      <div style={{ fontSize: 12, color: "#dbeafe" }}>{driverInfo.status || "En Route"}</div>
                    </div>
                  </div>
                </div>
              </OverlayView>
            )}
          </GoogleMap>
        ) : (
          <div style={{ padding: 20 }}>Loading Google Maps...</div>
        )}

        {/* Top-right floating panel */}
        <div className="swg-panel">
          <h3>{id}</h3>
          <small>Driver: <strong>{driverInfo.driverName || "—"}</strong></small>
          <small style={{ display: "block", marginTop: 6 }}>Status: <strong>{driverInfo.status || "—"}</strong></small>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              className="swg-btn"
              onClick={() => {
                if (!current) return Swal.fire({ icon: "error", title: "No GPS yet", text: "Cannot open live view." });
                window.open(`/map-view/${encodeURIComponent(id)}`, "_blank");
              }}
            >
              Open Large View
            </button>

            <button className="swg-btn alt" onClick={() => setFollow(f => !f)}>{follow ? "Unfollow" : "Follow"}</button>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>Path points</div>
            <div style={{ fontWeight: 800, fontSize: 20, marginTop: 6 }}>{positions.length}</div>
          </div>
        </div>

        {/* bottom-left recent events */}
        <div className="swg-footer">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15 }}>{id} • Recent</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{driverInfo.driverName || "Driver unknown"}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{loading ? "Loading…" : "Live"}</div>
              <div style={{ width: 12, height: 12, borderRadius: 999, background: current ? "#22c55e" : "#cbd5e1" }} />
            </div>
          </div>

          <div className="swg-list" style={{ marginTop: 10 }}>
            {positions.slice().reverse().slice(0, 12).map((p, idx) => (
              <div className="swg-list-item" key={idx}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div className="swg-dot" />
                  <div>
                    <div style={{ fontWeight: 800 }}>{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{new Date(p.ts).toLocaleTimeString()}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "#94a3b8" }}>
                  {positions.length > 0 ? calcDistanceLabel(p, positions[positions.length - 1]) : ""}
                </div>
              </div>
            ))}

            {positions.length === 0 && <div style={{ padding: 8, color: "#94a3b8" }}>No positions yet</div>}
          </div>
        </div>

        {/* small centered ETA bubble (like swiggy) */}
        {current && destination && (
          <div className="swg-floating-bubble">
            <div className="swg-eta-bubble">
              <strong style={{ marginRight: 10 }}>{computeETA()}</strong>
              <span style={{ color: "#cfe7ff" }}>{destination.label || "Destination"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;

/* ---------------- helpers ---------------- */

// compute heading deg between last two positions (0 fallback)
function computeHeadingFromPositions(points = []) {
  if (!points || points.length < 2) return 0;
  const a = points[points.length - 2];
  const b = points[points.length - 1];
  if (!a || !b) return 0;
  const dy = b.lat - a.lat;
  const dx = b.lng - a.lng;
  const theta = Math.atan2(dx, dy) * (180 / Math.PI);
  return theta;
}

// distance between two lat/lng points in meters (Haversine)
function haversineDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  const R = 6371e3;
  const toRad = (d) => (d * Math.PI) / 180;
  const φ1 = toRad(p1.lat);
  const φ2 = toRad(p2.lat);
  const Δφ = toRad(p2.lat - p1.lat);
  const Δλ = toRad(p2.lng - p1.lng);
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // meters
}

// pretty distance label
function calcDistanceLabel(p1, p2) {
  if (!p1 || !p2) return "";
  const d = haversineDistance(p1, p2);
  if (d < 1000) return `${Math.round(d)} m`;
  return `${(d / 1000).toFixed(2)} km`;
}

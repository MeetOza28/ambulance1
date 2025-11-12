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
import { db } from "../firebaseConfig";
import { ref, onValue, set } from "firebase/database";
import { update } from "firebase/database";
import Swal from "sweetalert2";


// ---- helper: infer when only boolean map is present
const inferCurrentLight = (cl = {}) => {
  if (cl.red) return 'red';
  if (cl.yellow) return 'yellow';
  if (cl.green) return 'green';
  return 'red';
};

const TrafficSignals = () => {
  const navigate = useNavigate();

  // UI state
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // data
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // add near other useState declarations
const [localTimers, setLocalTimers] = useState({}); // { [signalId]: seconds }
const prevLightsRef = useRef({}); // track previous light per-signal to detect transitions

// cycle timing defaults (change if you want different timings)
const GREEN_DUR = 20;
const YELLOW_DUR = 7;
const FULL_PHASE = GREEN_DUR + YELLOW_DUR;

// helpers for cycle math
const getActiveOrder = () => {
  // preserve UI order (signals array order) and only keep active signals
  return signals
    .filter(s => s.status === 'Active')
    .map(s => ({ id: String(s.id ?? s.key), raw: s }));
};

const findCurrentIndex = (ordered) => {
  // prefer a green signal; if none, prefer yellow
  for (let i = 0; i < ordered.length; i++) {
    const v = ordered[i].raw;
    const light = v.currentLight;
    if (light === 'green') return i;
  }
  for (let i = 0; i < ordered.length; i++) {
    const v = ordered[i].raw;
    const light = v.currentLight;
    if (light === 'yellow') return i;
  }
  return -1; // no running phase found
};

// const computeRedRemaining = (signalId) => {
//   const ordered = getActiveOrder();
//   if (!ordered || ordered.length === 0) return null;
//   const n = ordered.length;
//   const idxMap = ordered.map(o => o.id);
//   const targetIdx = idxMap.indexOf(String(signalId));
//   if (targetIdx === -1) return null;

//   const curIdx = findCurrentIndex(ordered);
//   if (curIdx === -1) {
//     // no known running signal — fallback to showing full rotation length until this signal's turn
//     // for a cycle of n signals, rotation = n * FULL_PHASE
//     // compute distance from 0 (assume starting at ordered[0])
//     const dist = (targetIdx + n - 0) % n;
//     return dist * FULL_PHASE;
//   }

//   // if target is the currently running one (shouldn't be red) return null
//   if (targetIdx === curIdx) {
//     return null;
//   }

//   // distance (how many steps ahead until it becomes green)
//   const distance = (targetIdx + n - curIdx) % n;

//   // sum remaining of the current running phase (first step)
//   let remaining = 0;

//   const curId = ordered[curIdx].id;
//   const curTimer = localTimers[curId];

//   if (typeof curTimer === 'number') {
//     remaining += curTimer;
//   } else {
//     // if we don't have a per-signal remaining, assume full phase
//     remaining += FULL_PHASE;
//   }

//   // for intermediate steps (1 .. distance-1) add full phase durations
//   // note: we do NOT include the target's own green here; the time returned is time until it becomes green
//   for (let k = 1; k < distance; k++) {
//     const idx = (curIdx + k) % n;
//     const midId = ordered[idx].id;
//     // If a mid signal currently has its own running timer (rare), use it; otherwise full phase
//     const midTimer = localTimers[midId];
//     if (typeof midTimer === 'number') {
//       // if that mid signal is actually green/yellow then its remaining is already correct
//       remaining += midTimer;
//     } else {
//       remaining += FULL_PHASE;
//     }
//   }

//   return remaining;
// };

const computeRedRemaining = (signalId) => {
  const ordered = getActiveOrder();
  if (!ordered || ordered.length === 0) return null;
  const n = ordered.length;
  const idxMap = ordered.map(o => o.id);
  const targetIdx = idxMap.indexOf(String(signalId));
  if (targetIdx === -1) return null;

  const curIdx = findCurrentIndex(ordered);
  if (curIdx === -1) {
    // no known running signal — fallback: estimate by assuming rotation starts at idx 0
    const dist = (targetIdx + n - 0) % n;
    return dist * FULL_PHASE;
  }

  // if target is the currently running one -> it's not red (return null)
  if (targetIdx === curIdx) return null;

  // compute remaining *full phase* length for the currently running signal:
  // - if current is green: remaining full-phase = remaining green (localTimers) + YELLOW_DUR
  // - if current is yellow: remaining full-phase = remaining yellow (localTimers)
  // - otherwise fallback to FULL_PHASE
  const curId = ordered[curIdx].id;
  const curRaw = ordered[curIdx].raw;
  const curLight = curRaw.currentLight;
  const curTimerLocal = localTimers[curId];

  let remainingFullForCurrent;
  if (curLight === 'green') {
    const remainingGreen = (typeof curTimerLocal === 'number') ? curTimerLocal : (typeof curRaw.timer === 'number' ? curRaw.timer : GREEN_DUR);
    remainingFullForCurrent = remainingGreen + YELLOW_DUR;
  } else if (curLight === 'yellow') {
    remainingFullForCurrent = (typeof curTimerLocal === 'number') ? curTimerLocal : (typeof curRaw.timer === 'number' ? curRaw.timer : YELLOW_DUR);
  } else {
    // defensive fallback
    remainingFullForCurrent = FULL_PHASE;
  }

  // distance (how many steps ahead until it becomes green)
  const distance = (targetIdx + n - curIdx) % n; // >=1 because targetIdx !== curIdx

  // Time until target becomes green:
  // remainingFullForCurrent (finish current's remaining full-phase)
  // + (distance - 1) * FULL_PHASE  (full phases of intermediate signals)
  const timeUntilGreen = remainingFullForCurrent + (Math.max(0, distance - 1) * FULL_PHASE);

  return timeUntilGreen;
};


  // read-only flag (hardware controls state)
  const READ_ONLY = false;

// initialize local timers from currentLights and reset on transitions.
// Use stable id: s.id || s.key
// useEffect(() => {
//   // inside your onValue callback, after building signalArray and before setSignals(signalArray)
// // setSignals(signalArray);

// // --- NEW: initialize / reset local timers immediately from fresh DB snapshot ---
// --- IMPORTANT: initialize localTimers from this fresh DB snapshot ---
// setLocalTimers(prev => {
//   const next = { ...prev };

//   signalArray.forEach(s => {
//     const id = String(s.id ?? s.key); // normalize to string

//     // determine current light (prefer boolean map)
//     let currLight = '';
//     if (s.currentLights && typeof s.currentLights === 'object') {
//       if (s.currentLights.green) currLight = 'green';
//       else if (s.currentLights.yellow) currLight = 'yellow';
//       else if (s.currentLights.red) currLight = 'red';
//     }
//     if (!currLight && s.currentLight) {
//       currLight = String(s.currentLight).toLowerCase().trim();
//     }

//     const prevLight = prevLightsRef.current[id];

//     // initialize only when first seen or when light changed in DB
//     if (prevLight === undefined || prevLight !== currLight) {
//       // prefer DB-provided timer if available, otherwise fall back to defaults
//       if (currLight === 'green') {
//         next[id] = (typeof s.timer === 'number' && s.timer >= 0) ? s.timer : GREEN_DUR;
//       } else if (currLight === 'yellow') {
//         next[id] = (typeof s.timer === 'number' && s.timer >= 0) ? s.timer : YELLOW_DUR;
//       } else {
//         // red/unknown -> no per-signal countdown stored locally; will compute 'time until green'
//         next[id] = null;
//       }
//     }

//     prevLightsRef.current[id] = currLight;
//   });

//   return next;
// });


// }, [signals]);



// global ticking interval: decrement numeric local timers every second
useEffect(() => {
  const iv = setInterval(() => {
    setLocalTimers(prev => {
      const next = { ...prev };
      let changed = false;

      Object.keys(next).forEach(id => {
        const v = next[id];
        if (typeof v === 'number' && v > 0) {
          next[id] = v - 1;
          changed = true;
        }
        // if v is 0, keep 0 (we show "0s" until hardware flips to next light which will reset to null)
        // if v is null or undefined, do nothing
      });

      return changed ? next : prev;
    });
  }, 1000);

  return () => clearInterval(iv);
}, []);





 // ---- Realtime read-only listener
useEffect(() => {
  const trafficRef = ref(db, "TrafficSignals");

  const unsubscribe = onValue(
    trafficRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const signalArray = Object.keys(data).map((key) => {
          const sig = data[key] || {};
          const currentLights = sig.currentLights || { red: false, yellow: false, green: false };

          // prefer boolean map if present
          let currentLightFromMap = null;
          if (currentLights.green) currentLightFromMap = 'green';
          else if (currentLights.yellow) currentLightFromMap = 'yellow';
          else if (currentLights.red) currentLightFromMap = 'red';

          const currentLight = currentLightFromMap || sig.currentLight || inferCurrentLight(currentLights);

          return {
            key,
            id: sig.id || key,
            name: sig.name || "",
            location: sig.location || "Unknown",
            status: sig.status || "Active",
            timer: sig.timer ?? 0,
            currentLights,
            currentLight,
            lastUpdated: sig.lastUpdated || "",
            powerStatus: sig.powerStatus || "Online",
            connectivity: sig.connectivity || "Strong",
            faultStatus: sig.faultStatus || "Normal",
            emergencyOverride: !!sig.emergencyOverride,
            trafficFlow: sig.trafficFlow || "Medium",
            coordinates:
              (sig.coordinates && typeof sig.coordinates === "object") ? sig.coordinates :
              (sig.coords && typeof sig.coords === "object") ? sig.coords :
              { lat: 0, lng: 0 },
            _raw: sig
          };
        });

        // --- IMPORTANT: initialize localTimers from this fresh DB snapshot ---
        setLocalTimers(prev => {
          const next = { ...prev };

          signalArray.forEach(s => {
            const id = String(s.id ?? s.key); // normalize to string

            // determine current light (prefer boolean map)
            let currLight = '';
            if (s.currentLights && typeof s.currentLights === 'object') {
              if (s.currentLights.green) currLight = 'green';
              else if (s.currentLights.yellow) currLight = 'yellow';
              else if (s.currentLights.red) currLight = 'red';
            }
            if (!currLight && s.currentLight) {
              currLight = String(s.currentLight).toLowerCase().trim();
            }

            const prevLight = prevLightsRef.current[id];

            if (prevLight === undefined || prevLight !== currLight) {
              if (currLight === 'green') next[id] = 20;
              else if (currLight === 'yellow') next[id] = 7;
              else next[id] = null; // red/unknown -> show '--'
            }

            prevLightsRef.current[id] = currLight;
          });

          return next;
        });

        setSignals(signalArray);

        // Refresh currently-open signal so modal shows latest DB state
        setSelectedSignal(prev => {
          if (!prev) return prev;
          const fresh = signalArray.find(s => s.id === prev.id) || signalArray.find(s => s.key === prev.key);
          return fresh || prev;
        });
      } else {
        setSignals([]);
        setSelectedSignal(null);
        // reset timers when DB is empty
        setLocalTimers({});
        prevLightsRef.current = {};
      }
      setLoading(false);
    },
    (err) => {
      setError(err.message);
      setLoading(false);
    }
  );

  return () => unsubscribe();
}, []);

useEffect(()=>{ console.debug('localTimers', localTimers); }, [localTimers]);


 // --- END OF NEW LOGIC ---

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000); // update every second

  return () => clearInterval(timer); // cleanup on unmount
}, []);



  const getStatusClass = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Maintenance': return 'status-maintenance';
      case 'Offline': return 'status-offline';
      default: return 'status-active';
    }
  };


  const handleSignalClick = (signal) => {
    setSelectedSignal(signal);
    setShowModal(true);
  };

  const handleEmergencyOverride = async () => {
  if (READ_ONLY) return;

  const { value: v } = await Swal.fire({
    title: "Emergency Override",
    width: 520,
    padding: "1.2rem",
    html: `
      <!-- (same styled HTML you already use) -->
      <style>
        .ovr-wrap{ text-align:left; }
        .ovr-section-title{ font-weight:700; margin:6px 0 8px; font-size:14px; color:#111827; }
        .mode-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:8px; }
        .mode-option{ display:flex; flex-direction:column; align-items:flex-start; gap:8px; padding:12px;
          border:1px solid #e5e7eb; border-radius:12px; cursor:pointer; transition:all .15s ease; background:#fff; }
        .mode-option:hover{ transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,0,0,.06); }
        .mode-option.selected{ border-color:#4f46e5; box-shadow:0 8px 26px rgba(79,70,229,.12); }
        .mode-title{ font-size:14px; font-weight:700; color:#111827; }
        .mode-sub{ font-size:13px; color:#6b7280; margin-top:4px; }
        .field-row{ display:grid; grid-template-columns:1fr auto; gap:10px; align-items:center; margin-top:8px; }
        .in{ width:100%; padding:10px; font-size:14px; border-radius:10px; border:1px solid #e5e7eb; outline:none; }
        .in:focus{ border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,.12); }
        .range{ width:100%; }
        .corr{ margin-top:10px; }
        .helper{ margin-top:6px; font-size:12px; color:#6b7280; }
      </style>

      <div class="ovr-wrap">
        <div class="ovr-section-title">Mode</div>
        <input type="hidden" id="em-mode" value="all-red" />
        <div class="mode-grid" id="modeGrid">
          <div class="mode-option selected" data-val="all-red" id="opt-all-red">
            <div class="mode-title">All RED</div>
            <div class="mode-sub">Stop all directions (safe stop).</div>
          </div>
          <div class="mode-option" data-val="green-wave" id="opt-green-wave">
            <div class="mode-title">Green Wave</div>
            <div class="mode-sub">Give green priority along a corridor for emergency vehicles.</div>
          </div>
        </div>

        <div class="ovr-section-title">Duration (seconds)</div>
        <div class="field-row">
          <input id="em-range" class="range" type="range" min="10" max="600" step="5" value="60" />
          <input id="em-dur" class="in" type="number" min="10" value="60" style="width:110px"/>
        </div>
        <div class="helper">Use the slider or type a value. Minimum 10s, up to 10 minutes.</div>

        <div class="ovr-section-title corr">Corridor (optional)</div>
        <input id="em-corridor" class="in" type="text" placeholder="e.g., VIP Road East→West (only for Green Wave)"/>
        <div class="helper">Specify corridor name when using Green Wave mode.</div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Activate",
    didOpen: () => {
      const grid = document.getElementById("modeGrid");
      const hiddenMode = document.getElementById("em-mode");
      grid.querySelectorAll(".mode-option").forEach(el => {
        el.addEventListener("click", () => {
          grid.querySelectorAll(".mode-option").forEach(x => x.classList.remove("selected"));
          el.classList.add("selected");
          hiddenMode.value = el.getAttribute("data-val");
        });
      });
      const range = document.getElementById("em-range");
      const num = document.getElementById("em-dur");
      range.addEventListener("input", () => { num.value = range.value; });
      num.addEventListener("input", () => {
        const v = Math.max(10, Number(num.value || 10));
        num.value = v;
        range.value = Math.min(600, Math.max(10, v));
      });
    },
    preConfirm: () => {
      const mode = document.getElementById("em-mode").value;
      const duration = Number(document.getElementById("em-dur").value || 0);
      const corridor = document.getElementById("em-corridor").value || "";
      if (!duration || duration < 10) {
        Swal.showValidationMessage("Duration must be at least 10 seconds.");
        return false;
      }
      return { mode, duration, corridor };
    }
  });

  if (!v) return;

  try {
    // 1) write global command for devices
    await update(ref(db, `GlobalCommands`), {
      emergency: {
        active: true,
        mode: v.mode,
        corridor: v.corridor || null,
        durationSeconds: v.duration,
        startedAt: Date.now()
      }
    });

    // 2) optimistic per-signal UI update so traffic cards change immediately
    // build the lights object depending on chosen mode
    // --- robust corridor matching & optimistic updates ---
// --- smarter corridor matching & optimistic updates ---
const slugify = (s) => {
  if (!s) return '';
  s = s.replace(/→|->|⇒/g, ' to ');
  s = s.replace(/[^a-zA-Z0-9\s]/g, ' ');
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
};

// helper: detect direction words and produce (roadName, directions[])
const parseCorridor = (raw) => {
  const text = slugify(raw);
  const words = text.split(' ').filter(Boolean);
  const directions = [];
  const dirSet = new Set(['east','west','north','south','e','w','n','s']);
  // collect direction tokens & remove from words
  const remaining = [];
  for (const w of words) {
    if (dirSet.has(w)) {
      // normalize e/w abbreviations to full words
      if (w === 'e') directions.push('east');
      else if (w === 'w') directions.push('west');
      else if (w === 'n') directions.push('north');
      else if (w === 's') directions.push('south');
      else directions.push(w);
    } else if (w === 'to') {
      // treat "to" as separator, ignore
    } else {
      remaining.push(w);
    }
  }
  const roadName = remaining.join(' ');
  return { roadName, directions };
};

let targets = signals;

if (v.corridor && v.corridor.trim()) {
  const { roadName, directions } = parseCorridor(v.corridor);

  // normalized user corridor for debug
  const userSlug = slugify(v.corridor);

  targets = signals.filter(sig => {
    // build candidate searchable string
    const candidates = [
      sig.location || '',
      sig.name || '',
      sig.id || '',
      (Array.isArray(sig.corridors) ? sig.corridors.join(' ') : '')
    ];
    const candidateSlug = slugify(candidates.join(' '));

    // 1) if corridors array exists and contains user slug, match
    if (Array.isArray(sig.corridors) && sig.corridors.some(c => slugify(c) === userSlug)) {
      return true;
    }

    // 2) if we have a roadName, require the roadName be present
    if (roadName) {
      if (!candidateSlug.includes(roadName)) return false;

      // if directions were provided (east/west/etc), require at least one direction present
      if (directions && directions.length > 0) {
        // match any of the directions
        for (const d of directions) {
          if (candidateSlug.includes(d)) return true;
        }
        // no direction matched -> not a target
        return false;
      }

      // roadName present and no directions required -> match
      return true;
    }

    // 3) fallback: try substring match with the whole user slug
    if (candidateSlug.includes(userSlug)) return true;

    // 4) fallback: relaxed compare without spaces (handles weird punctuation)
    if (candidateSlug.replace(/\s/g, '').includes(userSlug.replace(/\s/g, ''))) return true;

    return false;
  });

  console.debug('[Emergency] corridor search:', {
    asked: v.corridor,
    userSlug,
    parsed: parseCorridor(v.corridor),
    matchedCount: targets.length,
    matchedIds: targets.map(t => ({ id: t.id, location: t.location }))
  });
}

// if nothing matches, warn (safer than touching all signals)
if (!targets || targets.length === 0) {
  console.warn('No signals matched corridor:', v.corridor);
} else {
  const setLightForMode = (mode) => {
    if (mode === 'all-red') return { light: 'red', lights: { red: true, yellow: false, green: false } };
    return { light: 'green', lights: { red: false, yellow: false, green: true } };
  };

  const { light: setLight, lights } = setLightForMode(v.mode);
  const timer = v.duration;

  const updates = targets.map(sig =>
    update(ref(db, `TrafficSignals/${sig.id}`), {
      currentLight: setLight,
      currentLights: lights,
      timer,
      emergencyOverride: true,
      lastUpdated: new Date().toISOString()
    })
  );

  await Promise.all(updates);
}


    Swal.fire({
      icon: "success",
      title: "Emergency mode enabled",
      timer: 1400,
      showConfirmButton: false
    });
  } catch (err) {
    console.error(err);
    Swal.fire({ icon: "error", title: "Failed to enable emergency mode", text: err?.message || "Unknown error" });
  }
};


// add this helper at top of file
const makeId = (len = 8) =>
  Math.random().toString(36).slice(2, 2 + len) + Date.now().toString(36);

// updated handleSyncAll
const handleSyncAll = async () => {
  if (READ_ONLY) return;

  const res = await Swal.fire({
    title: "Sync All Signals?",
    text: "This will request all field controllers to align their cycles to the master clock. Devices will act on this command when they poll the database.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sync Now",
    width: 520,
    padding: "1.2rem"
  });

  if (!res.isConfirmed) return;

  const requestId = `sync-${makeId(6)}`;
  const now = Date.now();

  try {
    // publish a distinct sync request
    await update(ref(db, `GlobalCommands`), {
      syncRequestedAt: now,
      syncRequestId: requestId,
      syncRequestedBy: 'operator-ui' // optional metadata
    });

    console.debug('[Sync] GlobalCommands written', { requestId, now });

    // OPTIONAL: optimistic UI updates — enable if you want immediate visual feedback
    // We set syncPending:true so your UI can show a spinner/badge; devices should clear it
    /*
    const optimisticUpdates = signals.map(sig =>
      update(ref(db, `TrafficSignals/${sig.id}`), {
        syncPending: true,
        syncRequestId: requestId,
        syncRequestedAt: now,
        // small visual hint: reset timer to 0 (optional)
        // timer: 0,
        lastUpdated: new Date().toISOString()
      })
    );

    await Promise.all(optimisticUpdates);
    console.debug('[Sync] optimistic per-signal updates applied', optimisticUpdates.length);
    */

    Swal.fire({
      icon: "success",
      title: "Sync requested",
      text: "Controllers will align to the master clock shortly.",
      timer: 1400,
      showConfirmButton: false
    });
  } catch (err) {
    console.error("Sync all failed:", err);
    Swal.fire({
      icon: "error",
      title: "Sync failed",
      text: err?.message || "Unknown error"
    });
  }
};

// // helper: keep near top of file (if you already have it, skip)
// // const makeId = (len = 8) =>
// //   Math.random().toString(36).slice(2, 2 + len) + Date.now().toString(36);

// // Updated handleScheduleUpdate with prettier UI + optimistic per-signal updates
// const handleScheduleUpdate = async () => {
//   if (READ_ONLY) return;

//   const { value: cfg } = await Swal.fire({
//     title: "Update Schedule",
//     width: 720,
//     padding: "1.2rem",
//     html: `
//       <style>
//         .sch-wrap{ text-align:left; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue"; }
//         .lbl{ font-weight:700; font-size:13px; margin-bottom:6px; display:block; color:#111827; }
//         .muted{ font-size:13px; color:#6b7280; margin-bottom:10px; }
//         .card{ background:#fff; border-radius:12px; padding:14px; border:1px solid #eef2f7; box-shadow:0 8px 24px rgba(16,24,40,0.06); }
//         .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:10px; }
//         .in{ width:100%; padding:10px; font-size:14px; border-radius:10px; border:1px solid #e5e7eb; box-sizing:border-box; }
//         .in:focus{ outline:none; border-color:#6d28d9; box-shadow:0 0 0 6px rgba(109,40,217,0.06); }
//         .small{ width:120px; }
//         .row{ margin-bottom:12px; }
//         .hint{ font-size:12px; color:#6b7280; margin-top:6px; }
//         .note { font-size:12px; color:#374151; margin-top:6px; background:#f8fafc; padding:8px; border-radius:8px; border:1px solid #eef2f7; }
//       </style>

//       <div class="sch-wrap">
//         <div class="card">
//           <div class="row">
//             <label class="lbl">Plan Name</label>
//             <input id="sc-name" class="in" placeholder="e.g., Weekday Plan" value="Weekday Plan"/>
//           </div>

//           <div class="grid2">
//             <div>
//               <label class="lbl">Peak Green (s)</label>
//               <input id="peak-green" type="number" min="10" value="45" class="in"/>
//               <div class="hint">Green duration used during peak windows.</div>
//             </div>
//             <div>
//               <label class="lbl">Peak Yellow (s)</label>
//               <input id="peak-yellow" type="number" min="3" value="4" class="in"/>
//               <div class="hint">Yellow time during peak.</div>
//             </div>

//             <div>
//               <label class="lbl">Off-peak Green (s)</label>
//               <input id="off-green" type="number" min="5" value="25" class="in"/>
//               <div class="hint">Green duration used outside peak windows.</div>
//             </div>
//             <div>
//               <label class="lbl">Off-peak Yellow (s)</label>
//               <input id="off-yellow" type="number" min="3" value="3" class="in"/>
//               <div class="hint">Yellow time outside peak.</div>
//             </div>
//           </div>

//           <div class="grid2" style="margin-top:12px">
//             <div>
//               <label class="lbl">Peak Hours (HH:MM-HH:MM)</label>
//               <input id="peak-window" class="in" value="08:00-11:00,17:00-20:00" />
//               <div class="hint">Comma separated windows. Example: 08:00-11:00,17:00-20:00</div>
//             </div>
//             <div>
//               <label class="lbl">Weekend Mode</label>
//               <select id="weekend" class="in">
//                 <option value="off">Off</option>
//                 <option value="on">On</option>
//               </select>
//               <div class="hint">When enabled, devices will apply off-peak timings on weekends.</div>
//             </div>
//           </div>

//           <div class="note" style="margin-top:12px">
//             This will push the schedule to devices. Devices read <strong>GlobalCommands.scheduleRequestId</strong>
//             and then load <strong>GlobalConfig.schedule</strong>. The UI will optimistically update signal cards to show the new timings immediately.
//           </div>
//         </div>
//       </div>
//     `,
//     showCancelButton: true,
//     confirmButtonText: "Save Schedule",
//     didOpen: () => {},
//     preConfirm: () => {
//       const name = document.getElementById("sc-name").value.trim();
//       const peakGreen  = Number(document.getElementById("peak-green").value || 0);
//       const peakYellow = Number(document.getElementById("peak-yellow").value || 0);
//       const offGreen   = Number(document.getElementById("off-green").value || 0);
//       const offYellow  = Number(document.getElementById("off-yellow").value || 0);
//       const peakWindow = document.getElementById("peak-window").value.trim();
//       const weekend    = document.getElementById("weekend").value === "on";

//       if (!name) { Swal.showValidationMessage("Plan name is required"); return false; }
//       if (peakGreen < 10 || offGreen < 5) { Swal.showValidationMessage("Green durations look too small"); return false; }
//       if (peakYellow < 1 || offYellow < 1) { Swal.showValidationMessage("Yellow durations look too small"); return false; }

//       return {
//         name,
//         peak: { green: peakGreen, yellow: peakYellow },
//         offPeak: { green: offGreen, yellow: offYellow },
//         peakWindow,
//         weekend
//       };
//     }
//   });

//   if (!cfg) return;

//   const reqId = `schedule-${makeId(6)}`;
//   const now = Date.now();

//   // helper: check if now falls inside any peak window (windows are strings like "08:00-11:00")
//   const nowIsInPeak = (peakWindowStr) => {
//     if (!peakWindowStr) return false;
//     try {
//       const parts = peakWindowStr.split(',').map(p => p.trim()).filter(Boolean);
//       const nowDate = new Date();
//       const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();

//       for (const part of parts) {
//         const m = part.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
//         if (!m) continue;
//         const [ , s1, s2 ] = m;
//         const [h1, min1] = s1.split(':').map(Number);
//         const [h2, min2] = s2.split(':').map(Number);
//         const start = h1 * 60 + min1;
//         const end = h2 * 60 + min2;
//         // handle overnight windows (e.g., 22:00-02:00)
//         if (end >= start) {
//           if (nowMinutes >= start && nowMinutes <= end) return true;
//         } else {
//           // crosses midnight
//           if (nowMinutes >= start || nowMinutes <= end) return true;
//         }
//       }
//     } catch (e) {
//       console.warn('peak window parse failed', e);
//     }
//     return false;
//   };

//   try {
//     // 1) write authoritative GlobalConfig.schedule
//     await update(ref(db, `GlobalConfig`), {
//       schedule: { ...cfg, savedAt: now, savedBy: 'operator-ui', requestId: reqId }
//     });

//     // 2) nudge devices via GlobalCommands
//     await update(ref(db, `GlobalCommands`), {
//       scheduleRefreshAt: now,
//       scheduleRequestId: reqId,
//       scheduleRequestedBy: 'operator-ui'
//     });

//     // 3) optimistic per-signal updates — update cards instantly so user sees effect
//     // compute a sensible immediate timer (green duration) based on whether now is peak
//     const isPeakNow = nowIsInPeak(cfg.peakWindow);
//     const immediateGreen = isPeakNow ? (cfg.peak?.green ?? 45) : (cfg.offPeak?.green ?? 25);

//     // build per-signal update promises
//     const optimistic = signals.map(sig =>
//       update(ref(db, `TrafficSignals/${sig.id}`), {
//         schedulePending: true,
//         scheduleRequestId: reqId,
//         schedulePendingSince: now,
//         lastUpdated: new Date().toISOString(),
//         // visual hint: set timer to the green duration and set currentLight to green for visibility
//         timer: Number(immediateGreen),
//         currentLight: 'green',
//         currentLights: { red: false, yellow: false, green: true }
//       })
//     );

//     // wait for optimistic writes to complete (so UI realtime listener picks them up)
//     await Promise.all(optimistic);

//     Swal.fire({
//       icon: "success",
//       title: "Schedule updated",
//       text: "Devices will reload schedule shortly. Signal cards updated optimistically.",
//       timer: 1600,
//       showConfirmButton: false
//     });
//   } catch (err) {
//     console.error('Schedule update failed:', err);
//     Swal.fire({ icon: "error", title: "Failed to update schedule", text: err?.message || 'Unknown error' });
//   }
// };



const handleGenerateReport = async () => {
  if (!signals || signals.length === 0) {
    Swal.fire({ icon: 'info', title: 'No data', text: 'No signals to include in the report.' });
    return;
  }

  const choice = await Swal.fire({
    title: '',
    width: 760,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Download CSV',
    denyButtonText: 'Create PDF',
    cancelButtonText: 'Cancel',
    html: `
      <div style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue'; color:#111827;">
        

          <div style="flex:1">
            <h2 style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.3px">Generate Report</h2>
            <div style="color:#6b7280;font-size:13px;margin-top:6px">
              Export current traffic signal data as <strong>CSV</strong> or a printable <strong>PDF</strong>.
            </div>
          </div>

          <div style="text-align:right">
            <div style="font-weight:700;color:#374151">${signals.length} signals</div>
            <div style="font-size:12px;color:#9ca3af;margin-top:4px">SurakshaPath — Operator UI</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 340px;gap:18px;">
          <div style="background:#fff;border-radius:12px;padding:16px;border:1px solid #eef2f7;box-shadow:0 10px 30px rgba(16,24,40,0.04)">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
              <div style="background:#eef2ff;border-radius:8px;padding:8px 10px;font-weight:700;color:#4338ca;font-size:13px">Options</div>
              <div style="color:#6b7280;font-size:13px">Choose filename and whether to include a printable header.</div>
            </div>

            <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
              <div style="flex:1">
                <label style="display:block;font-size:13px;color:#111827;font-weight:700;margin-bottom:6px">Filename (base)</label>
                <input id="report-fname" class="swal2-input" placeholder="traffic_report" value="traffic_report" style="width:100%;padding:10px;border-radius:10px;border:1px solid #e6e9ef;box-sizing:border-box" />
              </div>

              <div style="width:120px;text-align:center">
                <label style="display:block;font-size:13px;color:#111827;font-weight:700;margin-bottom:6px">Include header</label>
                <div style="display:flex;align-items:center;justify-content:center">
                  <label style="position:relative;display:inline-block;width:54px;height:30px">
                    <input id="report-header" type="checkbox" checked style="opacity:0;width:0;height:0" />
                    <span style="
                      position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#e6e7ff;border-radius:30px;transition:.25s;
                      box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
                    "></span>
                    <span id="report-header-knob" style="
                      position:absolute;left:4px;top:4px;width:22px;height:22px;background:white;border-radius:50%;box-shadow:0 4px 10px rgba(16,24,40,0.12);
                      transition: .25s;
                    "></span>
                  </label>
                </div>
                <div style="font-size:11px;color:#9ca3af;margin-top:6px">Printable header on PDF</div>
              </div>
            </div>

            <div style="font-size:13px;color:#6b7280">CSV gives raw data for spreadsheets. PDF opens a printable, nicely-formatted report window (use browser Print → Save as PDF).</div>
          </div>

          <div style="background:linear-gradient(180deg,#ffffff,#fbfbff);border-radius:12px;padding:12px;border:1px solid #eef2f7;box-shadow:0 8px 22px rgba(16,24,40,0.03)">
            <div style="font-weight:700;margin-bottom:8px;color:#111827">Preview</div>
            <div style="max-height:260px;overflow:auto;border-radius:8px;border:1px solid #f1f5f9;padding:8px;background:#fff">
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead>
                  <tr>
                    <th style="text-align:left;padding:8px;border-bottom:1px solid #eef2f7;font-weight:700;background:#fbfbff">ID</th>
                    <th style="text-align:left;padding:8px;border-bottom:1px solid #eef2f7;font-weight:700;background:#fbfbff">Location</th>
                    <th style="text-align:left;padding:8px;border-bottom:1px solid #eef2f7;font-weight:700;background:#fbfbff">Current</th>
                  </tr>
                </thead>
                <tbody>
                  ${signals.slice(0,8).map(s => `
                    <tr>
                      <td style="padding:8px;border-bottom:1px solid #f8fafc">${escapeHtml(s.id)}</td>
                      <td style="padding:8px;border-bottom:1px solid #f8fafc">${escapeHtml(s.location)}</td>
                      <td style="padding:8px;border-bottom:1px solid #f8fafc;text-transform:capitalize">${escapeHtml(s.currentLight)}</td>
                    </tr>
                  `).join('')}
                  ${signals.length > 8 ? `<tr><td colspan="3" style="padding:8px;color:#6b7280">…and ${signals.length - 8} more</td></tr>` : ''}
                </tbody>
              </table>
            </div>
            <div style="margin-top:10px;font-size:12px;color:#9ca3af">Preview shows first 8 signals. Full data will be exported.</div>
          </div>
        </div>
      </div>
    `,
    didOpen: () => {
      // pretty toggle behaviour: move knob when checkbox toggled
      const cb = Swal.getPopup().querySelector('#report-header');
      const knob = Swal.getPopup().querySelector('#report-header-knob');
      const track = Swal.getPopup().querySelector('label[style] > span');
      const updateToggle = () => {
        if (cb.checked) {
          knob.style.transform = 'translateX(24px)';
          track.style.background = '#6d28d9';
        } else {
          knob.style.transform = 'translateX(0px)';
          track.style.background = '#e6e7ff';
        }
      };
      cb.addEventListener('change', updateToggle);
      updateToggle();
    },
    preConfirm: () => {
      const fname = (document.getElementById('report-fname')?.value || 'traffic_report').trim();
      const includeHeader = !!document.getElementById('report-header')?.checked;
      return { fname, includeHeader };
    },
    preDeny: () => {
      const fname = (document.getElementById('report-fname')?.value || 'traffic_report').trim();
      const includeHeader = !!document.getElementById('report-header')?.checked;
      return { fname, includeHeader };
    }
  });

  if (!choice) return;

  // CSV flow
  if (choice.isConfirmed) {
    const { fname, includeHeader } = choice.value || { fname: 'traffic_report', includeHeader: true };

    const rows = [];
    if (includeHeader) rows.push(["ID","Location","Status","CurrentLight","Timer(s)","TrafficFlow","LastUpdated"]);
    signals.forEach(s => {
      rows.push([
        s.id, s.location, s.status, s.currentLight, s.timer, s.trafficFlow, s.lastUpdated
      ]);
    });

    const csv = rows.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    a.download = fname + '_' + timestamp + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Swal.fire({ icon: "success", title: "CSV downloaded", timer: 1200, showConfirmButton: false });
    return;
  }

  // PDF flow
  if (choice.isDenied) {
    const { fname, includeHeader } = choice.value || { fname: 'traffic_report', includeHeader: true };

    const total = signals.length;
    const active = signals.filter(s => s.status === 'Active').length;
    const maint = signals.filter(s => s.status === 'Maintenance').length;
    const offline = signals.filter(s => s.status === 'Offline').length;

    const generatedAt = new Date().toLocaleString();

    // build table rows (string concat avoids accidental template escape issues)
    const tableRowsHtml = signals.map(s => (
      '<tr>' +
        '<td style="padding:6px 8px;border:1px solid #e6e9ef">' + escapeHtml(s.id) + '</td>' +
        '<td style="padding:6px 8px;border:1px solid #e6e9ef">' + escapeHtml(s.location) + '</td>' +
        '<td style="padding:6px 8px;border:1px solid #e6e9ef">' + escapeHtml(s.status) + '</td>' +
        '<td style="padding:6px 8px;border:1px solid #e6e9ef;text-transform:capitalize">' + escapeHtml(s.currentLight) + '</td>' +
        '<td style="padding:6px 8px;border:1px solid #e6e9ef">' + escapeHtml(String(s.timer)) + '</td>' +
        '<td style="padding:6px 8px;border:1px solid #e6e9ef">' + escapeHtml(s.trafficFlow) + '</td>' +
        '<td style="padding:6px 8px;border:1px solid #e6e9ef">' + escapeHtml(s.lastUpdated || '') + '</td>' +
      '</tr>'
    )).join('');

    const headerHtml = includeHeader ? (
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
        '<div>' +
          '<h1 style="margin:0;font-size:20px;color:#111827">SurakshaPath — Traffic Signals Report</h1>' +
          '<div style="color:#6b7280;font-size:13px">' + generatedAt + '</div>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<div style="font-size:14px;font-weight:700">' + total + ' signals</div>' +
          '<div style="color:#6b7280;font-size:13px">Active: ' + active + ' • Maint: ' + maint + ' • Offline: ' + offline + '</div>' +
        '</div>' +
      '</div>'
    ) : '';

    const reportHtml = '<!doctype html><html><head><meta charset="utf-8" /><title>Traffic Report</title>' +
      '<style>@page{size:A4;margin:18mm}body{font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue";color:#111827;font-size:12px}.container{max-width:820px;margin:0 auto}.card{background:#fff;padding:14px;border-radius:8px;border:1px solid #eef2f7;box-shadow:0 6px 18px rgba(16,24,40,0.03)}table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}th{text-align:left;padding:8px 10px;border-bottom:1px solid #e6e9ef;background:#fafafa;font-weight:700}td{vertical-align:top}.footer{margin-top:18px;font-size:11px;color:#6b7280}</style>' +
      '</head><body><div class="container"><div class="card">' +
      headerHtml +
      '<div style="overflow:auto"><table><thead><tr><th>ID</th><th>Location</th><th>Status</th><th>Current</th><th>Timer (s)</th><th>Traffic Flow</th><th>Last Updated</th></tr></thead><tbody>' +
      tableRowsHtml +
      '</tbody></table></div><div class="footer">Report generated by SurakshaPath operator UI — ' + escapeHtml(generatedAt) + '</div></div></div></body></html>';

    const win = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes');
    if (!win) {
      Swal.fire({ icon: 'error', title: 'Popup blocked', text: 'Please allow popups for this site to generate PDF.' });
      return;
    }
    win.document.open();
    win.document.write(reportHtml);
    win.document.close();

    setTimeout(() => {
      try { win.focus(); win.print(); } catch (e) { console.error(e); }
    }, 600);

    Swal.fire({ icon: "success", title: "PDF window opened", text: "Use your browser print dialog to save as PDF.", timer: 1400, showConfirmButton: false });
    return;
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
};




 // --- Send manual override command to Firebase ---
// --- Send manual override command to Firebase ---
const handleOverrideSignal = async (signalId) => {
  if (READ_ONLY) return;

  const { value: formValues } = await Swal.fire({
    title: "Manual Override",
    width: 520,
    padding: "1.2rem",
    html: `
      <style>
        .ovr-wrap{ text-align:left; }
        .ovr-section-title{
          font-weight:700; margin:6px 0 8px; font-size:14px; color:#111827;
        }
        .light-grid{
          display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:6px;
        }
        .light-option{
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:8px; padding:14px 10px; border:1px solid #e5e7eb; border-radius:12px;
          cursor:pointer; transition:all .15s ease; background:#fff;
        }
        .light-option:hover{ transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,0,0,.06); }
        .light-option.selected{ border-color:#4f46e5; box-shadow:0 8px 26px rgba(79,70,229,.15); }
        .light-circle{
          width:36px; height:36px; border-radius:9999px; box-shadow:0 0 0 2px rgba(0,0,0,.06) inset;
        }
        .light-red{ background:#ef4444; }
        .light-yellow{ background:#f59e0b; }
        .light-green{ background:#10b981; }
        .light-label{ font-size:13px; font-weight:600; color:#111827; }
        .timer-wrap{
          display:grid; grid-template-columns:1fr auto; gap:10px; align-items:center;
        }
        .timer-input{
          width:90px; padding:10px; font-size:14px; border-radius:10px; border:1px solid #e5e7eb; outline:none;
        }
        .timer-input:focus{ border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,.15); }
        .timer-range{ width:100%; }
        .helper{ margin-top:6px; font-size:12px; color:#6b7280; }
      </style>

      <div class="ovr-wrap">
        <div class="ovr-section-title">Select Light</div>
        <input type="hidden" id="light" value="green" />
        <div class="light-grid" id="lightGrid">
          <div class="light-option" data-val="red" id="opt-red">
            <div class="light-circle light-red"></div>
            <div class="light-label">Red</div>
          </div>
          <div class="light-option" data-val="yellow" id="opt-yellow">
            <div class="light-circle light-yellow"></div>
            <div class="light-label">Yellow</div>
          </div>
          <div class="light-option selected" data-val="green" id="opt-green">
            <div class="light-circle light-green"></div>
            <div class="light-label">Green</div>
          </div>
        </div>

        <div class="ovr-section-title">Timer (seconds)</div>
        <div class="timer-wrap">
          <input id="timerRange" type="range" min="5" max="120" step="5" value="30" class="timer-range" />
          <input id="timer" type="number" min="1" value="30" class="timer-input" />
        </div>
        <div class="helper">Use the slider or type a value. Range shortcut: 5–120s.</div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Apply Override",
    didOpen: () => {
      // handle light selection
      const grid = document.getElementById("lightGrid");
      const hidden = document.getElementById("light");
      grid.querySelectorAll(".light-option").forEach(el => {
        el.addEventListener("click", () => {
          grid.querySelectorAll(".light-option").forEach(x => x.classList.remove("selected"));
          el.classList.add("selected");
          hidden.value = el.getAttribute("data-val");
        });
      });

      // sync range & number
      const range = document.getElementById("timerRange");
      const num = document.getElementById("timer");
      range.addEventListener("input", () => { num.value = range.value; });
      num.addEventListener("input", () => {
        const v = Math.max(1, Number(num.value || 1));
        num.value = v;
        range.value = Math.min(120, Math.max(5, v));
      });
    },
    preConfirm: () => {
      const light = document.getElementById("light").value;
      const timer = Number(document.getElementById("timer").value || 0);
      if (!["red","yellow","green"].includes(light)) {
        Swal.showValidationMessage("Please choose a light.");
        return false;
      }
      if (!timer || timer < 1) {
        Swal.showValidationMessage("Timer must be at least 1 second.");
        return false;
      }
      return { light, timer };
    }
  });

  if (!formValues) return;

  const { light, timer } = formValues;

  const lights = {
    red:     light === "red",
    yellow:  light === "yellow",
    green:   light === "green",
  };

  try {
    await update(ref(db, `TrafficSignals/${signalId}`), {
      // used by your ESP / control loop
      mode: "manual",
      manualCommand: { light, timer: Number(timer) || 0 },

      // used by your React UI right now
      currentLight: light,
      currentLights: lights,
      timer: Number(timer) || 0,                       // what you display on the card
      lastUpdated: new Date().toISOString(),
    });

    Swal.fire({
      icon: "success",
      title: "Override Applied",
      text: `${light.toUpperCase()} for ${timer}s`,
      timer: 1800,
      showConfirmButton: false
    });
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Failed to apply override",
      text: err?.message || "Unknown error",
    });
  }
};


// --- Reset signal to auto mode ---
// --- Reset signal to auto mode ---
const handleResetSignal = async (signalId) => {
  if (READ_ONLY) return;

  const result = await Swal.fire({
    title: "Reset Signal",
    text: "Return this signal to AUTO mode?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Reset"
  });
  if (!result.isConfirmed) return;

  // safe default for UI while waiting
  const lights = { red: true, yellow: false, green: false };

  try {
    // 1) set top-level fields (mode, emergency flag etc.)
    await update(ref(db, `TrafficSignals/${signalId}`), {
      mode: "auto",
      autoRequestedAt: Date.now(),
      currentLight: "red",
      currentLights: lights,
      timer: 0,
      lastUpdated: new Date().toISOString(),
      emergencyOverride: false
    });

    // 2) explicitly remove manualCommand (reliable delete)
    await set(ref(db, `TrafficSignals/${signalId}/manualCommand`), null);

    Swal.fire({
      icon: "success",
      title: "Reset Successful",
      text: `Signal ${signalId} returned to AUTO`,
      timer: 1600,
      showConfirmButton: false
    });
  } catch (err) {
    console.error('Reset failed:', err);
    Swal.fire({
      icon: "error",
      title: "Reset failed",
      text: err?.message || "Unknown error"
    });
  }
};



  const activeSignals = signals.filter(s => s.status === 'Active').length;
  const maintenanceSignals = signals.filter(s => s.status === 'Maintenance').length;
  const offlineSignals = signals.filter(s => s.status === 'Offline').length;

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
            {/* <button className="action-btn btn-schedule" onClick={handleScheduleUpdate}>
              <Calendar size={16} />
              Update Schedule
            </button> */}
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
                      {/* {signal.status === 'Active' ? (
                        <span className="timer-display">{signal.timer}s</span>
                      ) : (
                        <span>--</span>
                      )} */}
  {/* {signal.status === 'Active' ? (
  <span className="timer-display">
    { (() => {
        const v = localTimers[String(signal.id ?? signal.key)];

        if (typeof v === 'number') return `${v}s`;   // show numeric countdown (including 0s)
        if (v === null) return '--';                 // explicit "no countdown"
        return '--';                                 // not initialized yet
      })()
    }
  </span>
) : (
  <span>--</span>
)} */}


{signal.status === 'Active' ? (
  <span className="timer-display">
    { (() => {
        const id = String(signal.id ?? signal.key);
        const v = localTimers[id];

        // 1) if we have an explicit running countdown, show it
        if (typeof v === 'number') return `${v}s`;

        // 2) if this signal is red, compute time until it becomes green in the cycle
        if (signal.currentLight === 'red') {
          const redRemaining = computeRedRemaining(id);
          if (typeof redRemaining === 'number') return `${redRemaining}s`;
          return '--';
        }

        // 3) explicit null means "no countdown" -> show --
        if (v === null) return '--';

        return '--';
      })()
    }
  </span>
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
                  {/* <button className="control-btn btn-config">
                    Config
                  </button> */}
                  <button
  className="control-btn btn-config"
  onClick={async (e) => {
    e.stopPropagation();

    // open details UI
    setSelectedSignal(signal);
    setShowModal(true);

    // OPTIONAL: also fetch config and attach it to the selected signal
    const configRef = ref(db, `TrafficSignals/${signal.id}/config`);
    onValue(configRef, (snapshot) => {
      const configData = snapshot.val() || {};
      setSelectedSignal((prev) => prev ? { ...prev, config: configData } : prev);
    }, { onlyOnce: true });
  }}
>
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
                
                {/* Performance Metrics */}
<div className="detail-section">
  <h3>Performance Metrics</h3>
  <div className="detail-list">
    <p><strong>Traffic Flow:</strong> <span>{selectedSignal.trafficFlow}</span></p>
    <p>
      <strong>Coordinates:</strong>{" "}
      <span>
        {(selectedSignal.coordinates?.lat ?? "--")}, {(selectedSignal.coordinates?.lng ?? "--")}
      </span>
    </p>
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
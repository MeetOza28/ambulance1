import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, AlertTriangle, Calendar, MapPin, Clock, Search, Filter, Download, Eye, FileText } from 'lucide-react';
import '../styles/HelmetViolation.css';
import Swal from 'sweetalert2';

const HelmetViolations = () => {
  const navigate = useNavigate();

  // --- UI state ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState('Overview');
  const [searchTerm, setSearchTerm] = useState('');
  // const [filterStatus, setFilterStatus] = useState('All');
  // timeFilter: { type: 'all'|'today'|'24h'|'7d'|'range', from: Date|null, to: Date|null }
const [timeFilter, setTimeFilter] = useState({ type: 'all', from: null, to: null });


  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);


  // ---- Replace static arrays with state that will hold DB data ----
  const [violationsData, setViolationsData] = useState([]); // will hold normalized records for UI
  const [challanData, setChallanData] = useState([]); 

  // Keep time updated
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  

// Helper: normalize a record from backend to the UI shape used below
  const makeKey = (s) => {
    if (!s && typeof s !== 'string') return '';
    return String(s).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  };

  const normalizeViolation = (raw) => {
  const id = raw.violationId || raw.violation_id || raw.id || raw._id || '';
  const vehicleNumber = raw.vehicleNumber || raw.number_plate || raw.numberPlate || raw.vehicle_number || '';

  // Location extraction (improved)
const rawLoc = raw.location ?? raw.location_name ?? raw.location_text ?? raw.place ?? raw.challan_location ?? raw.address ?? raw.loc ?? raw.metadata?.location ?? null;

let location = 'Unknown';
if (rawLoc) {
  // If GeoJSON Point
  if (typeof rawLoc === 'object' && rawLoc.type === 'Point' && Array.isArray(rawLoc.coordinates)) {
    const [lon, lat] = rawLoc.coordinates;
    location = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  } else if (typeof rawLoc === 'string' && rawLoc.trim()) {
    location = rawLoc;
  } else if (typeof rawLoc === 'object') {
    location =
      rawLoc.address ||
      rawLoc.name ||
      rawLoc.label ||
      rawLoc.place ||
      (rawLoc.formattedAddress || rawLoc.formatted || null) ||
      (rawLoc.street ? `${rawLoc.street}${rawLoc.city ? ', '+rawLoc.city : ''}` : null) ||
      JSON.stringify(rawLoc);
    if (!location || location === '{}') location = 'Unknown';
  }
}


  // rest of your normalization (time, fine, image, challanNumber) unchanged...
  let dateStr = '';
  let timeStr = '';
  const timeVal = raw.time || raw.timestamp || raw.createdAt || raw.timeStamp || raw.ts;
  if (timeVal) {
    const d = new Date(timeVal);
    if (!isNaN(d)) {
      dateStr = d.toISOString().slice(0, 10);
      timeStr = d.toISOString().slice(11, 19);
    } else if (typeof timeVal === 'string') {
      if (/^\d{2}:\d{2}:\d{2}/.test(timeVal)) timeStr = timeVal.split(' ')[0];
    }
  }
  if ((!dateStr || !timeStr) && raw.date) {
    dateStr = raw.date;
    if (raw.time && !timeStr) timeStr = raw.time.split(' ')[0] || raw.time;
  }

  const fineNum = raw.fineAmount ?? raw.fine_amount ?? raw.fine ?? 0;
  const fineAmount = typeof fineNum === 'number' ? `₹${Number(fineNum).toLocaleString('en-IN')}` : String(raw.fineAmount || raw.fine_amount || raw.fine || '₹0');
  const image = raw.imageUrl || raw.image_path || raw.image || raw.imageUrlPath || '';
  const challanNumber = raw.challanNumber || raw.challan_number || raw.challan || raw.challan_number_str || '';

  return {
    id: String(id),
    vehicleNumber: String(vehicleNumber),
    vehicleKey: makeKey(vehicleNumber),
    location,
    date: dateStr,
    time: timeStr,
    fineAmount,
    image,
    raw,
    challanNumber,
  };
};



  // ---- Fetch records from backend on mount ----
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const apiBase = 'http://localhost:5001/api'; // adjust if your server uses different base
    const violationsUrl = `${apiBase}/violation`;
    const challansUrl = `${apiBase}/challan`;

    const fetchAll = async () => {
//       try {
//         const [vRes, cRes] = await Promise.all([
//           fetch(violationsUrl, { method: 'GET', signal }),
//           fetch(challansUrl, { method: 'GET', signal }),
//         ]);

//         if (!vRes.ok) {
//           if (vRes.status === 404) {
//             console.warn('violations endpoint returned 404, try adjusting endpoint path.');
//           }
//         }

//         const vJson = await (vRes.ok ? vRes.json() : []);
//         const cJson = await (cRes.ok ? cRes.json() : []);

//         console.debug('violations raw from API:', vJson);
// console.debug('challans raw from API:', cJson);
      try {
    const apiBase = 'http://localhost:5001/api';
    const [vRes, cRes] = await Promise.all([
      fetch(`${apiBase}/violation`, { method: 'GET', signal }),
      fetch(`${apiBase}/challan`, { method: 'GET', signal }),
    ]);
    const vJson = await (vRes.ok ? vRes.json() : []);
    const cJson = await (cRes.ok ? cRes.json() : []);
    console.debug('violations raw from API:', vJson);
    console.debug('challans raw from API:', cJson);

        // Normalize both arrays into UI shapes
        const normalizedViolations = Array.isArray(vJson) ? vJson.map(normalizeViolation) : [];
        setViolationsData(normalizedViolations);

        // normalize challans minimally so findChallansByVehicle works
        const makeKeyInner = (s) => {
          if (!s && typeof s !== 'string') return '';
          return String(s).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        };

        const normalizedChallans = (Array.isArray(cJson) ? cJson : []).map((c) => {
          const vehicleNumber = c.vehicleNumber || c.number_plate || c.vehicle_number || c.numberPlate || '';
          const challanNum = c.challanNumber || c.challan_number || c.challan_number_str || c.challan || '';
          const rawLoc = c.location ?? c.location_name ?? c.place ?? c.challan_location ?? c.address ?? c.loc ?? c.metadata?.location ?? '';
  const location = typeof rawLoc === 'string' ? rawLoc : (rawLoc?.name || rawLoc?.label || '');
          // location and date/time fallbacks
          // const location = c.location || c.location_name || c.place || c.challan_location || c.address || '';
          const date = c.date || (c.timestamp ? new Date(c.timestamp).toISOString().slice(0, 10) : '');
          const time = c.time || (c.timestamp ? new Date(c.timestamp).toISOString().slice(11, 19) : '');

          return {
            challanNumber: challanNum,
            vehicleNumber: vehicleNumber,
            vehicleKey: makeKeyInner(vehicleNumber),
            fineAmount: c.fineAmount ?? c.fine_amount ?? c.fine ?? 0,
            status: c.status || c.paymentStatus || '',
            officerName: c.officerName || c.officer_name || '',
            location,
            date,
            time,
            raw: c,
            paymentMethod: c.paymentMethod || c.payment_method || '',
            violation: c.violation || c.offence || '',
          };
        });
        setChallanData(normalizedChallans);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Failed to fetch violations/challans:', err);
      }
    };

    fetchAll();
    return () => controller.abort();
  }, []); // run once on mount

  // ---------- Challan lookup helpers ----------
const findChallansByVehicle = (vehicleNumber) => {
  if (!vehicleNumber) return [];
  // const key = String(vehicleNumber).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const makeKeyInner = (s) => String(s || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  return challanData.filter((c) => (c.vehicleKey || '') === makeKeyInner(vehicleNumber));
};

// prefer challan location if available, else normalized violation.location, else raw fields
const getDisplayLocation = (violation) => {
  if (!violation) return 'Unknown';
  const challans = findChallansByVehicle(violation.vehicleNumber || violation.raw?.number_plate || violation.raw?.vehicle_number);
  const primary = challans && challans.length ? challans[0] : null;

  // Normalize primary location (if object)
  const normalizeLocValue = (loc) => {
    if (!loc && loc !== '') return null;
    if (typeof loc === 'string' && loc.trim()) return loc;
    if (typeof loc === 'object') return loc.name || loc.label || loc.address || loc.place || null;
    return null;
  };

  return (
    normalizeLocValue(primary?.location) ||
    normalizeLocValue(violation.location) ||
    normalizeLocValue(violation.raw?.location) ||
    normalizeLocValue(violation.raw?.location_name) ||
    normalizeLocValue(violation.raw?.place) ||
    'Unknown'
  );
};

const computeTopLocation = (data) => {
  const counts = {};
  data.forEach((v) => {
    const loc = getDisplayLocation(v) || 'Unknown';
    counts[loc] = (counts[loc] || 0) + 1;
  });
  let top = null, max = 0;
  Object.entries(counts).forEach(([loc, c]) => {
    if (c > max) {
      max = c;
      top = loc;
    }
  });
  return { location: top || '—', count: max };
};


  

  const computeAvgFine = (data) => {
    let sum = 0,
      cnt = 0;
    data.forEach((v) => {
      const f = String(v.fineAmount || '').replace(/[^\d.-]/g, '');
      const n = parseFloat(f);
      if (!isNaN(n)) {
        sum += n;
        cnt++;
      }
    });
    return cnt ? Math.round((sum / cnt) * 100) / 100 : 0;
  };

  const computePeakHour = (data) => {
    const hours = {};
    data.forEach((v) => {
      if (v.time) {
        const parts = v.time.split(':');
        if (parts.length >= 1) {
          const h = parseInt(parts[0], 10);
          if (!isNaN(h)) hours[h] = (hours[h] || 0) + 1;
        }
      }
    });
    let peakHour = null,
      max = 0;
    Object.entries(hours).forEach(([h, c]) => {
      if (c > max) {
        max = c;
        peakHour = Number(h);
      }
    });
    if (peakHour === null) return '—';
    const start = String(peakHour).padStart(2, '0') + ':00';
    const end = String((peakHour + 1) % 24).padStart(2, '0') + ':00';
    return `${start} - ${end}`;
  };

  // compute values once per render (fast for small arrays)
  const topLoc = computeTopLocation(violationsData);
  const avgFine = computeAvgFine(violationsData); // number
  const peakHour = computePeakHour(violationsData);

  // --- add right after peakHour (or near other computed helpers) ---
  const totalViolations = violationsData.length;

  const totalFine = useMemo(() => {
    let sum = 0;
    for (const v of violationsData) {
      const num = parseFloat(String(v.fineAmount || '').replace(/[^\d.-]/g, '')) || 0;
      sum += num;
    }
    try {
      return sum.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    } catch (e) {
      return '₹' + sum.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  }, [violationsData]);



  const getChallanBadgeClass = (status) => {
    switch (status) {
      case 'Paid':
        return 'status-paid';
      case 'Pending':
        return 'status-pending';
      case 'Overdue':
        return 'status-overdue';
      case 'Disputed':
        return 'status-disputed';
      default:
        return 'status-default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Resolved':
        return 'status-resolved';
      case 'Under Review':
        return 'status-under-review';
      default:
        return 'status-default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High':
        return 'severity-high';
      case 'Medium':
        return 'severity-medium';
      case 'Low':
        return 'severity-low';
      default:
        return 'severity-default';
    }
  };

  // ----------------- Analytics, filter, export, live monitoring handlers -----------------
  const handleOpenAnalytics = async () => {
    const all = Array.isArray(violationsData) ? violationsData.slice() : [];
    const total = all.length;

    const escapeHtml = (s) => {
      if (s == null) return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    const html = `
      <div style="font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue'; color:#111827;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div>
            <h2 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.3px">Analytics</h2>
            <div style="color:#6b7280;font-size:13px;margin-top:6px">Helmet violations — quick summary & exports</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700;color:#374151;font-size:18px">${total}</div>
            <div style="font-size:12px;color:#9ca3af">total records</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 420px;gap:18px;">
          <!-- Left panel -->
          <div style="background:#fff;border-radius:12px;padding:16px;border:1px solid #eef2f7;box-shadow:0 8px 26px rgba(16,24,40,0.04)">
            <div style="display:flex;gap:16px;align-items:center;margin-bottom:16px">
              <div style="min-width:120px">
                <label style="display:block;font-weight:700;color:#374151;margin-bottom:6px">Date range</label>
                <div style="display:flex;gap:8px">
                  <input id="analytics-from" type="date" style="padding:9px;border-radius:8px;border:1px solid #e6e9ef;background:#fff" />
                  <input id="analytics-to" type="date" style="padding:9px;border-radius:8px;border:1px solid #e6e9ef;background:#fff" />
                </div>
              </div>
            </div>

            <!-- Buttons -->
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px">
              <button id="analytics-apply"
                style="background:#6d28d9;color:#fff;border:none;padding:10px 16px;
                      border-radius:8px;cursor:pointer;font-weight:600;box-shadow:0 2px 6px rgba(109,40,217,0.4);
                      transition:all 0.2s ease;"
                onmouseover="this.style.background='#7c3aed'"
                onmouseout="this.style.background='#6d28d9'">
                Apply
              </button>

              <button id="export-analytics-csv"
                style="background:#4f46e5;color:#fff;border:none;padding:10px 16px;
                      border-radius:8px;cursor:pointer;font-weight:600;box-shadow:0 2px 6px rgba(79,70,229,0.4);
                      transition:all 0.2s ease;"
                onmouseover="this.style.background='#6366f1'"
                onmouseout="this.style.background='#4f46e5'">
                Export CSV
              </button>

              <button id="export-analytics-pdf"
                style="background:#dc2626;color:#fff;border:none;padding:10px 16px;
                      border-radius:8px;cursor:pointer;font-weight:600;box-shadow:0 2px 6px rgba(220,38,38,0.4);
                      transition:all 0.2s ease;"
                onmouseover="this.style.background='#ef4444'"
                onmouseout="this.style.background='#dc2626'">
                Printable PDF
              </button>

              <button id="analytics-close"
                style="background:#4b5563;color:#fff;border:none;padding:10px 16px;
                      border-radius:8px;cursor:pointer;font-weight:600;box-shadow:0 2px 6px rgba(75,85,99,0.4);
                      transition:all 0.2s ease;"
                onmouseover="this.style.background='#6b7280'"
                onmouseout="this.style.background='#4b5563'">
                Close
              </button>
            </div>

            <div style="margin-top:20px;font-size:14px;color:#374151;line-height:1.5">
              <strong>Note:</strong> Use the date range and export buttons to generate and download reports.
            </div>
          </div>

          <!-- Right panel -->
          <div style="background:linear-gradient(180deg,#fff,#fbfbff);border-radius:12px;padding:12px;border:1px solid #eef2f7;box-shadow:0 8px 22px rgba(16,24,40,0.03)">
            <div style="font-weight:700;margin-bottom:8px">Recent Violations (preview)</div>
            <div id="analytics-preview" style="max-height:360px;overflow:auto;border-radius:8px;border:1px solid #f1f5f9;padding:8px;background:#fff">
              <table style="width:100%;font-size:13px;border-collapse:collapse">
                <thead>
                  <tr style="color:#6b7280">
                    <th style="text-align:left;padding:8px">ID</th>
                    <th style="text-align:left;padding:8px">Vehicle</th>
                    <th style="text-align:left;padding:8px">Location</th>
                    <th style="text-align:left;padding:8px">Date</th>
                    <th style="text-align:left;padding:8px">Time</th>
                    <th style="text-align:left;padding:8px">Fine</th>
                    <th style="text-align:left;padding:8px">Challan No.</th>
                  </tr>
                </thead>
                <tbody>
                  ${all.slice(0,8).map(v => {
      const c = (findChallansByVehicle(v.vehicleNumber) || [null])[0];
      const challanNum = c?.challanNumber || v.challanNumber || v.raw?.challan_number || v.raw?.challan || '';
      return `
                      <tr>
                        <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.id)}</td>
                        <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.vehicleNumber)}</td>
                        <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(getDisplayLocation(v))}</td>
                        <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.date)}</td>
                        <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.time)}</td>
                        <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.fineAmount)}</td>
                        <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(challanNum)}</td>
                      </tr>
                    `;
    }).join('')}

                  ${all.length > 8 ? `<tr><td colspan="6" style="padding:8px;color:#6b7280">… and ${all.length - 8} more</td></tr>` : ''}
                </tbody>
              </table>
            </div>
            <div style="margin-top:10px;font-size:12px;color:#9ca3af">Preview shows first 8 results.</div>
          </div>
        </div>
      </div>
    `;

    await Swal.fire({
      html,
      width: 960,
      showConfirmButton: false,
      didOpen: () => {
        const popup = Swal.getPopup();

        const parseDateOnly = (s) => {
          if (!s) return null;
          const d = new Date(s);
          return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
        };

        const getFiltered = () => {
          const fromVal = popup.querySelector('#analytics-from').value;
          const toVal = popup.querySelector('#analytics-to').value;
          const from = parseDateOnly(fromVal);
          const to = parseDateOnly(toVal);
          return all.filter(v => {
            if (!v.date) return true;
            const d = parseDateOnly(v.date);
            if (!d) return true;
            if (from && d < from) return false;
            if (to && d > to) return false;
            return true;
          });
        };

        const refreshPreview = () => {
          const list = getFiltered();
          const preview = popup.querySelector('#analytics-preview');
          if (!preview) return;
          const rows = list.slice(0,8).map(v => {
            const c = (findChallansByVehicle(v.vehicleNumber) || [null])[0];
            const challanNum = c?.challanNumber || v.challanNumber || v.raw?.challan_number || v.raw?.challan || '';
            return `
              <tr>
                <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.id)}</td>
                <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.vehicleNumber)}</td>
                <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(getDisplayLocation(v))}</td>
                <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.date)}</td>
                <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.time)}</td>
                <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.fineAmount)}</td>
                <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(challanNum)}</td>
              </tr>`;
          }).join('');

          preview.innerHTML = `
            <table style="width:100%;font-size:13px;border-collapse:collapse">
              <thead><tr style="color:#6b7280">
                <th style="text-align:left;padding:8px">ID</th>
                <th style="text-align:left;padding:8px">Vehicle</th>
                <th style="text-align:left;padding:8px">Location</th>
                <th style="text-align:left;padding:8px">Date</th>
                <th style="text-align:left;padding:8px">Time</th>
                <th style="text-align:left;padding:8px">Fine</th>
                <th style="text-align:left;padding:8px">Challan No.</th>
              </tr></thead>
              <tbody>${rows}${list.length>8?`<tr><td colspan="6" style="padding:8px;color:#6b7280">… and ${list.length-8} more</td></tr>`:''}</tbody>
            </table>`;
        };

        popup.querySelector('#analytics-apply').addEventListener('click', refreshPreview);
        popup.querySelector('#analytics-close').addEventListener('click', () => Swal.close());

        // CSV export
        popup.querySelector('#export-analytics-csv').addEventListener('click', () => {
          const rows = [['ID','Date','Time','Vehicle','Location','Fine','Challan No.']];
          getFiltered().forEach(v => {
            const c = (findChallansByVehicle(v.vehicleNumber) || [null])[0];
            const challanNum = c?.challanNumber || v.challanNumber || v.raw?.challan_number || v.raw?.challan || '';
            rows.push([v.id||'', v.date||'', v.time||'', v.vehicleNumber||'', getDisplayLocation(v)||'', v.fineAmount||'', challanNum||'']);
          });

          const csv = rows.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `helmet_analytics_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          Swal.fire({ icon: 'success', title: 'CSV exported', timer: 1000, showConfirmButton: false });
        });

        // PDF export
        popup.querySelector('#export-analytics-pdf').addEventListener('click', () => {
          const list = getFiltered();
          const generatedAt = new Date().toLocaleString();

          const rowsHtml = list.map(v => {
            const c = (findChallansByVehicle(v.vehicleNumber) || [null])[0];
            const challanNum = c?.challanNumber || v.challanNumber || v.raw?.challan_number || v.raw?.challan || '';
            return `
              <tr>
                <td style="padding:8px;border:1px solid #e6e9ef">${escapeHtml(v.id)}</td>
                <td style="padding:8px;border:1px solid #e6e9ef">${escapeHtml(v.vehicleNumber)}</td>
                <td style="padding:8px;border:1px solid #e6e9ef">${escapeHtml(getDisplayLocation(v))}</td>
                <td style="padding:8px;border:1px solid #e6e9ef">${escapeHtml(v.date)}</td>
                <td style="padding:8px;border:1px solid #e6e9ef">${escapeHtml(v.time)}</td>
                <td style="padding:8px;border:1px solid #e6e9ef">${escapeHtml(v.fineAmount)}</td>
                <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(challanNum)}</td>
              </tr>
            `;
          }).join('');

          const headerHtml = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <div>
                <h2 style="margin:0;font-size:18px">Helmet Violations Report</h2>
                <div style="color:#6b7280;font-size:12px">${generatedAt}</div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:700">${list.length} records</div>
              </div>
            </div>
          `;

          const reportHtml = `
            <!doctype html><html><head><meta charset="utf-8"/><title>Helmet Report</title>
            <style>
              @page { size: A4; margin: 18mm; }
              body { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue"; color:#111827; font-size:12px; }
              table { width:100%; border-collapse: collapse; margin-top:8px; }
              th { text-align:left; padding:8px 10px; border-bottom:1px solid #e6e9ef; background:#fafafa; font-weight:700; }
              td { vertical-align:top; padding:8px; border:1px solid #e6e9ef; }
            </style>
            </head><body>
              ${headerHtml}
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vehicle</th>
                    <th>Location</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Fine</th>
                    <th>Challan No.</th>
                  </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
              </table>
            </body></html>`;

          const w = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
          if (!w) return Swal.fire({ icon: 'error', title: 'Popup blocked', text: 'Allow popups to print.' });
          w.document.open();
          w.document.write(reportHtml);
          w.document.close();
          setTimeout(() => {
            try { w.focus(); w.print(); } catch (e) { console.error(e); }
          }, 400);
        });

        refreshPreview();
      },
    });
  };

const handleLiveMonitoring = async () => {
  Swal.fire({
    title: '🚦 Live Monitoring',
    html: `
      <div id="live-monitor-container" style="
        font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto;
        color: #111827;
        text-align: left;
      ">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div>
            <h3 style="margin:0;font-weight:700;font-size:18px;">Helmet Violations — Live Feed</h3>
            <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">Auto-updating every 5 seconds</p>
          </div>
          <button id="refresh-live" style="
            background:#4f46e5;color:#fff;border:none;padding:6px 12px;
            border-radius:6px;cursor:pointer;font-weight:600;box-shadow:0 2px 5px rgba(79,70,229,0.4);
            transition:all 0.2s ease;">Refresh</button>
        </div>

        <div id="live-summary" style="
          background:#f9fafb;padding:8px 12px;border-radius:8px;margin-bottom:10px;
          display:flex;justify-content:space-between;align-items:center;
          font-size:14px;color:#374151;">
          <span>Active Cameras: 5</span>
          <span id="violation-count">New Violations Today: 0</span>
        </div>

        <div id="live-feed" style="
          border:1px solid #e5e7eb;border-radius:8px;
          padding:10px;max-height:380px;overflow:auto;background:#fff;">
          <p style="text-align:center;color:#9ca3af;">Fetching live data...</p>
        </div>
      </div>
    `,
    width: 700,
    showConfirmButton: false,
    didOpen: () => {
      const container = document.getElementById('live-feed');
      const countLabel = document.getElementById('violation-count');

      const loadData = () => {
        container.innerHTML = '<p style="text-align:center;color:#9ca3af;">Updating...</p>';
        
        // Simulate data — in real app, fetch from backend API here
        setTimeout(() => {
          const data = violationsData
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);

          countLabel.textContent = `New Violations Today: ${violationsData.length}`;
          if (data.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#6b7280;">✅ All clear — no new violations detected.</p>';
            return;
          }

          container.innerHTML = data.map(v => `
            <div style="display:flex;align-items:center;justify-content:space-between;
                        padding:10px;border-bottom:1px solid #f3f4f6;">
              <div>
                <div style="font-weight:600;color:#111827;">${v.vehicleNumber}</div>
                <div style="color:#6b7280;font-size:13px;">${getDisplayLocation(v)}</div>

                <div style="color:#9ca3af;font-size:12px;">${v.time} • ${v.date}</div>
              </div>
              <div style="text-align:right;">
                <span style="font-weight:600;color:#10b981;">${v.fineAmount}</span><br/>
                <img src="/images/${v.image}" alt="violation" style="width:60px;height:40px;border-radius:6px;margin-top:4px;object-fit:cover;border:1px solid #e5e7eb"/>
              </div>
            </div>
          `).join('');
        }, 700);
      };

      // Initial load
      loadData();

      // Refresh manually
      document.getElementById('refresh-live').addEventListener('click', loadData);

      // Auto-refresh every 5s
      const interval = setInterval(loadData, 5000);
      Swal.getPopup().addEventListener('click', (e) => {
        if (!Swal.isVisible()) clearInterval(interval);
      });
    }
  });
};

// small helper to produce initial inline-style for status buttons
const _btnStyle = (bg='#fff', fg='#111', extra='') =>
  `background:${bg};color:${fg};border:none;padding:12px 14px;border-radius:10px;font-weight:700;text-align:center;cursor:pointer;transition:all .14s ease;${extra}`;


  // ---------- Status filter modal (Swal) ----------
  // ---------- Time filter modal (replaces previous status modal) ----------
const handleOpenTimeFilter = async () => {
  const html = `
    <style>
      .tf-wrap { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue"; color:#111827; }
      .tf-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
      .tf-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-top:8px; }
      .tf-btn { padding:12px 14px; border-radius:10px; border:1px solid transparent; background:#f3f4f6; cursor:pointer; font-weight:700; text-align:center; }
      .tf-btn.active { background:linear-gradient(180deg,#4f46e5,#6d28d9); color:#fff; box-shadow:0 10px 30px rgba(79,70,229,0.08); transform:translateY(-3px); }
      .tf-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:14px; }
      .tf-input { padding:9px;border-radius:8px;border:1px solid #e6e9ef;width:100%;box-sizing:border-box; }
      .tf-ghost { background:#eef2ff;border:none;padding:10px 14px;border-radius:10px;font-weight:700;color:#374151;cursor:pointer; }
      .tf-apply { background:#4f46e5;color:#fff;border:none;padding:10px 14px;border-radius:10px;font-weight:800;cursor:pointer; }
    </style>

    <div class="tf-wrap">
      <div class="tf-head">
        <div>
          <h3 style="margin:0;font-size:18px;font-weight:800">Filter by time</h3>
          <div style="color:#6b7280;font-size:13px;margin-top:6px">Show violations for a specific time range</div>
        </div>
        <div style="font-size:12px;color:#9ca3af">Choose quick ranges or set custom dates</div>
      </div>

      <div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
          <button id="tf-all" class="tf-btn">All</button>
          <button id="tf-today" class="tf-btn">Today</button>
          <button id="tf-24" class="tf-btn">Last 24h</button>
          <button id="tf-7" class="tf-btn">Last 7d</button>
          <button id="tf-range" class="tf-btn">Custom Range</button>
        </div>

        <div id="tf-range-panel" style="display:none;gap:8px;margin-top:8px">
          <div style="display:flex;gap:8px">
            <input id="tf-from" class="tf-input" type="date" />
            <input id="tf-to" class="tf-input" type="date" />
          </div>
          <div style="margin-top:8px;font-size:12px;color:#9ca3af">If you pick custom range, both From and To are inclusive.</div>
        </div>

        <div class="tf-actions">
          <button id="tf-clear" class="tf-ghost" type="button">Clear</button>
          <button id="tf-apply" class="tf-apply" type="button">Apply</button>
        </div>
      </div>
    </div>
  `;

  await Swal.fire({
    html,
    width: 620,
    showConfirmButton: false,
    showCloseButton: true,
    didOpen: () => {
      const popup = Swal.getPopup();
      const btnAll = popup.querySelector('#tf-all');
      const btnToday = popup.querySelector('#tf-today');
      const btn24 = popup.querySelector('#tf-24');
      const btn7 = popup.querySelector('#tf-7');
      const btnRange = popup.querySelector('#tf-range');
      const rangePanel = popup.querySelector('#tf-range-panel');
      const fromInput = popup.querySelector('#tf-from');
      const toInput = popup.querySelector('#tf-to');

      // helper to set active UI
      const setActive = (type) => {
        [btnAll, btnToday, btn24, btn7, btnRange].forEach(b => b.classList.remove('active'));
        if (type === 'all') btnAll.classList.add('active');
        if (type === 'today') btnToday.classList.add('active');
        if (type === '24h') btn24.classList.add('active');
        if (type === '7d') btn7.classList.add('active');
        if (type === 'range') btnRange.classList.add('active');
        rangePanel.style.display = type === 'range' ? 'block' : 'none';
      };

      // initialize current selection from state
      const current = timeFilter?.type || 'all';
      if (timeFilter && timeFilter.type === 'range' && timeFilter.from) {
        const from = new Date(timeFilter.from);
        const to = new Date(timeFilter.to);
        if (!isNaN(from)) fromInput.value = from.toISOString().slice(0,10);
        if (!isNaN(to)) toInput.value = to.toISOString().slice(0,10);
      }
      setActive(current);

      // clicks
      btnAll.addEventListener('click', () => setActive('all'));
      btnToday.addEventListener('click', () => setActive('today'));
      btn24.addEventListener('click', () => setActive('24h'));
      btn7.addEventListener('click', () => setActive('7d'));
      btnRange.addEventListener('click', () => setActive('range'));

      popup.querySelector('#tf-clear').addEventListener('click', () => {
        setActive('all');
        fromInput.value = '';
        toInput.value = '';
      });

      popup.querySelector('#tf-apply').addEventListener('click', () => {
        const active = popup.querySelector('.tf-btn.active');
        let sel = active ? active.id.replace('tf-','') : 'all';
        if (sel === '24') sel = '24h';
        if (sel === 'range') {
          const fromVal = fromInput.value;
          const toVal = toInput.value;
          if (!fromVal || !toVal) {
            Swal.fire({ icon:'warning', title:'Select both dates', text:'Please provide both From and To dates.' });
            return;
          }
          // parse dates as start and end of day
          const from = new Date(fromVal + 'T00:00:00');
          const to = new Date(toVal + 'T23:59:59');
          setTimeFilter({ type: 'range', from, to });
        } else if (sel === 'today') {
          const now = new Date();
          const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0);
          const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59);
          setTimeFilter({ type: 'today', from, to });
        } else if (sel === '24h') {
          const now = new Date();
          setTimeFilter({ type: '24h', from: new Date(now.getTime() - 24*60*60*1000), to: now });
        } else if (sel === '7d') {
          const now = new Date();
          setTimeFilter({ type: '7d', from: new Date(now.getTime() - 7*24*60*60*1000), to: now });
        } else {
          setTimeFilter({ type: 'all', from: null, to: null });
        }

        setPage(1);
        Swal.close();
      });
    }
  });
};

  // ---------- Export modal (keeps behaviour from your version, with quick filters working) ----------
  const handleExport = async () => {
    // (I reused your full export modal code — it relies on `violationsData`.)
    // To keep this snippet focused I will reuse the same detailed modal you had in previous messages.
    // Paste your handleExport implementation here (the version that had functioning Last24/Last7/All).
    // For correctness in this single-file, I am including the working implementation below.

    const escapeHtml = (s) => {
      if (s == null) return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    const total = Array.isArray(violationsData) ? violationsData.length : 0;

    const html = `
      <style>
        .ex-wrap { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue"; color:#111827; }
        .ex-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:12px; }
        .ex-title { font-size:20px; font-weight:800; margin:0; }
        .ex-sub { color:#6b7280; font-size:13px; margin-top:6px; }
        .ex-body { display:grid; grid-template-columns:1fr 320px; gap:16px; align-items:start; }
        .ex-card { background:#fff;border-radius:12px;padding:14px;border:1px solid #eef2f7; box-shadow:0 10px 30px rgba(16,24,40,0.04) }
        .ex-field { display:flex;flex-direction:column;gap:6px;margin-bottom:10px; }
        .ex-input { padding:10px;border-radius:10px;border:1px solid #e6e9ef; font-size:14px; width:100%; box-sizing:border-box; }
        .ex-toggle { display:flex; align-items:center; gap:10px; }
        .ex-actions { display:flex; gap:10px; margin-top:8px; flex-wrap:wrap; }
        .ex-btn {
          display:inline-flex; align-items:center; justify-content:center;
          gap:10px; padding:10px 16px; border-radius:10px; cursor:pointer; font-weight:700; border:none;
          transition:transform .12s ease, box-shadow .12s ease, opacity .12s ease;
        }
        .ex-btn:active { transform:translateY(1px); }
        .ex-csv { background:linear-gradient(180deg,#6d28d9,#7c3aed); color:#fff; box-shadow:0 10px 30px rgba(99,102,241,0.12); }
        .ex-pdf { background:linear-gradient(180deg,#ef4444,#dc2626); color:#fff; box-shadow:0 10px 30px rgba(239,68,68,0.12); }
        .ex-close { background:#475569;color:#fff; box-shadow:0 6px 16px rgba(71,85,105,0.12); }
        .ex-small { font-size:13px; color:#6b7280; }
        .ex-preview { font-size:13px; color:#374151; margin-bottom:8px; }
        .ex-help { margin-top:8px; font-size:12px; color:#9ca3af; }
        .ex-file { display:flex; gap:8px; align-items:center; }
        .quick-btn { background:#f3f4f6;border-radius:10px;padding:8px 12px;border:1px solid transparent;cursor:pointer;font-weight:700;color:#374151 }
        .quick-btn.active { background:#4f46e5;color:#fff; box-shadow:0 8px 20px rgba(79,70,229,0.12) }
      </style>

      <div class="ex-wrap">
        <div class="ex-head">
          <div>
            <h3 class="ex-title">Export Violations</h3>
            <div class="ex-sub">Download raw CSV or printable PDF of the current dataset</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:800;font-size:18px;color:#111827">${total}</div>
            <div style="font-size:12px;color:#9ca3af">records</div>
          </div>
        </div>

        <div class="ex-body">
          <div class="ex-card">
            <div class="ex-field">
              <label style="font-weight:700;font-size:13px;color:#374151">Filename (base)</label>
              <input id="export-fname" class="ex-input" placeholder="helmet_violations" value="helmet_violations" />
            </div>

            <div class="ex-field">
              <label style="font-weight:700;font-size:13px;color:#374151">Include header (CSV & PDF)</label>
              <div class="ex-toggle">
                <input id="export-header" type="checkbox" checked />
                <div class="ex-small">Add readable column headers and a report header to PDF</div>
              </div>
            </div>

            <div class="ex-field">
              <label style="font-weight:700;font-size:13px;color:#374151">Quick options</label>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button id="ex-last24" class="quick-btn" type="button">Last 24h</button>
                <button id="ex-last7" class="quick-btn" type="button">Last 7d</button>
                <button id="ex-all" class="quick-btn active" type="button">All</button>
              </div>
              <div class="ex-help">These apply simple client-side date filters (if your items have date values).</div>
            </div>

            <div class="ex-actions">
              <button id="export-csv" class="ex-btn ex-csv" type="button">Download CSV</button>
              <button id="export-pdf" class="ex-btn ex-pdf" type="button">Printable PDF</button>
              <button id="export-close" class="ex-btn ex-close" type="button">Close</button>
            </div>
          </div>

          <div>
            <div class="ex-card">
              <div class="ex-preview">Preview (first 6)</div>
              <div style="max-height:320px;overflow:auto;border-radius:8px;border:1px solid #f1f5f9;padding:8px;background:#fff">
                <table style="width:100%;font-size:13px;border-collapse:collapse">
                  <thead style="color:#6b7280">
<tr>
  <th style="text-align:left;padding:6px">ID</th>
  <th style="text-align:left;padding:6px">Vehicle</th>
  <th style="text-align:left;padding:6px">Location</th>
  <th style="text-align:left;padding:6px">Date</th>
  <th style="text-align:left;padding:6px">Challan No.</th>
</tr>

                  </thead>
                  <tbody id="export-preview">
                    ${violationsData.slice(0,6).map(v => {
  const c = (findChallansByVehicle(v.vehicleNumber) || [null])[0];
  const challanNum = c?.challanNumber || v.challanNumber || v.raw?.challan_number || v.raw?.challan || '';
  return `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.id)}</td>
      <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.vehicleNumber)}</td>
      <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.location)}</td>
      <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.date)}</td>
      <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(challanNum)}</td>
    </tr>
  `;
}).join('')}

                  </tbody>
                </table>
              </div>

              <div style="margin-top:10px;font-size:12px;color:#9ca3af">Preview uses current in-memory dataset & selected quick filter.</div>
            </div>
          </div>
        </div>
      </div>
    `;

    await Swal.fire({
      html,
      width: 840,
      showConfirmButton: false,
      didOpen: () => {
        const popup = Swal.getPopup();
        const fnameInput = popup.querySelector('#export-fname');
        const headerChk = popup.querySelector('#export-header');
        const previewBody = popup.querySelector('#export-preview');

        let activeQuick = 'all';

        const parseRecordDate = (r) => {
          try {
            if (!r || !r.date) return null;
            const time = r.time ? r.time.split(' ')[0] : '00:00:00';
            const iso = `${r.date}T${time}`;
            const d = new Date(iso);
            if (!isNaN(d)) return d;
            const d2 = new Date(r.date);
            return isNaN(d2) ? null : d2;
          } catch (e) { return null; }
        };

        const computeFiltered = (quick = activeQuick) => {
          const now = new Date();
          let from = null;
          if (quick === '24') from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          else if (quick === '7') from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

          return violationsData.filter(v => {
            const d = parseRecordDate(v);
            if (!d) return quick === 'all';
            if (!from) return true;
            return d >= from && d <= now;
          });
        };

        const updatePreview = (list) => {
  const rows = list.slice(0, 6).map(v => {
    const c = (findChallansByVehicle(v.vehicleNumber) || [null])[0] || null;
    const challanNum = c?.challanNumber || v.challanNumber || v.raw?.challan_number || v.raw?.challan || '';
    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.id || '')}</td>
        <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.vehicleNumber || '')}</td>
        <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.location || '')}</td>
        <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(v.date || '')}</td>
        <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(challanNum || '')}</td>
      </tr>
    `;
  }).join('');
  previewBody.innerHTML = rows || `<tr><td colspan="5" style="padding:12px;color:#9ca3af">No results for this filter</td></tr>`;
};


        const setActiveButton = (which) => {
          activeQuick = which;
          popup.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('active'));
          if (which === '24') popup.querySelector('#ex-last24').classList.add('active');
          else if (which === '7') popup.querySelector('#ex-last7').classList.add('active');
          else popup.querySelector('#ex-all').classList.add('active');

          if (which === '24') fnameInput.value = 'helmet_violations_last24h';
          else if (which === '7') fnameInput.value = 'helmet_violations_last7d';
          else fnameInput.value = 'helmet_violations_all';

          const filtered = computeFiltered(which);
          updatePreview(filtered);
        };

        setActiveButton('all');

        popup.querySelector('#ex-last24').addEventListener('click', (e) => { e.preventDefault(); setActiveButton('24'); });
        popup.querySelector('#ex-last7').addEventListener('click', (e) => { e.preventDefault(); setActiveButton('7'); });
        popup.querySelector('#ex-all').addEventListener('click', (e) => { e.preventDefault(); setActiveButton('all'); });

        popup.querySelector('#export-close').addEventListener('click', () => Swal.close());

        popup.querySelector('#export-csv').addEventListener('click', () => {
          const fname = (fnameInput.value || 'helmet_violations').trim();
          const includeHeader = !!headerChk.checked;
          const list = computeFiltered(activeQuick);

          const rows = [];
          if (includeHeader) rows.push(['ID','Date','Time','Vehicle','Location','Fine','Challan No.']);
list.forEach(v => {
  const c = (findChallansByVehicle(v.vehicleNumber) || [null])[0];
  const challanNum = c?.challanNumber || v.challanNumber || v.raw?.challan_number || v.raw?.challan || '';
  rows.push([
    v.id || '',
    v.date || '',
    v.time || '',
    v.vehicleNumber || '',
    v.location || '',
    v.fineAmount || '',
    challanNum || ''
  ]);
});


          const csv = rows.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
          a.download = `${fname}_${ts}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          Swal.fire({ icon: 'success', title: 'CSV downloaded', timer: 1100, showConfirmButton: false });
        });

        popup.querySelector('#export-pdf').addEventListener('click', () => {
          const fname = (fnameInput.value || 'helmet_violations').trim();
          const includeHeader = !!headerChk.checked;
          const list = computeFiltered(activeQuick);

          const generatedAt = new Date().toLocaleString();
          const rowsHtml = list.map(v => {
  const c = (findChallansByVehicle(v.vehicleNumber) || [null])[0];
  const challanNum = c?.challanNumber || v.challanNumber || v.raw?.challan_number || v.raw?.challan || '';
  return `
    <tr>
      <td style="padding:8px;border:1px solid #e6e9ef">${escapeHtml(v.id)}</td>
      <td style="padding:8px;border:1px solid #e6e9ef">${escapeHtml(v.vehicleNumber)}</td>
      <td style="padding:8px;border:1px solid #e6e9ef">${escapeHtml(v.location)}</td>
      <td style="padding:8px;border:1px solid #e6e9ef">${escapeHtml(v.date)}</td>
      <td style="padding:8px;border:1px solid #e6e9ef">${escapeHtml(v.time)}</td>
      <td style="padding:8px;border:1px solid #e6e9ef">${escapeHtml(v.fineAmount)}</td>
      <td style="padding:8px;border-bottom:1px solid #f3f4f6">${escapeHtml(challanNum)}</td>
    </tr>
  `;
}).join('');


          const headerHtml = includeHeader ? `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <div>
                <h2 style="margin:0;font-size:18px">Helmet Violations Report</h2>
                <div style="color:#6b7280;font-size:12px">${generatedAt}</div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:700">${list.length} records</div>
              </div>
            </div>
          ` : '';

          const reportHtml = `
            <!doctype html><html><head><meta charset="utf-8"/><title>${fname}</title>
            <style>
              @page { size: A4; margin: 18mm; }
              body { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue"; color:#111827; font-size:12px; }
              table { width:100%; border-collapse: collapse; margin-top:8px; }
              th { text-align:left; padding:8px 10px; border-bottom:1px solid #e6e9ef; background:#fafafa; font-weight:700; }
              td { vertical-align:top; padding:8px; border:1px solid #e6e9ef; }
            </style>
            </head><body>
              ${headerHtml}
              <table>
                <thead><tr>
  <th>ID</th><th>Vehicle</th><th>Location</th><th>Date</th><th>Time</th><th>Fine</th><th>Challan No.</th>
</tr></thead>

                <tbody>${rowsHtml}</tbody>
              </table>
            </body></html>`;

          const w = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
          if (!w) return Swal.fire({ icon: 'error', title: 'Popup blocked', text: 'Allow popups to print.' });
          w.document.open();
          w.document.write(reportHtml);
          w.document.close();
          setTimeout(() => { try { w.focus(); w.print(); } catch (e) { console.error(e); } }, 400);
        });
      }
    });
  };

// ============= 1️⃣ View violation details popup =============
const handleViewViolation = (violation, challan = null) => {
  const resolved = challan || (findChallansByVehicle(violation.vehicleNumber) || [null])[0] || null;
  const displayLocation = resolved?.location || violation.location || 'Unknown';
  const challanNum = resolved?.challanNumber || violation.challanNumber || violation.raw?.challan_number || violation.raw?.challan || '';
  Swal.fire({
    title: `<strong>Violation Details</strong>`,
    html: `
      <div style="font-family:Inter, system-ui; text-align:left; color:#111827;">
        <div style="margin-bottom:10px;">
          <img src="/images/${violation.image}" alt="violation"
               style="width:100%;max-height:220px;object-fit:cover;border-radius:10px;margin-bottom:10px;border:1px solid #e5e7eb"/>
        </div>
        <div style="display:grid;grid-template-columns:120px 1fr;gap:6px 10px;font-size:14px">
          <div style="font-weight:600;">ID</div><div>${violation.id}</div>
          <div style="font-weight:600;">Vehicle</div><div>${violation.vehicleNumber}</div>
          <div style="font-weight:600;">Location</div><div>${displayLocation}</div>
          <div style="font-weight:600;">Date</div><div>${violation.date}</div>
          <div style="font-weight:600;">Time</div><div>${violation.time}</div>
          <div style="font-weight:600;">Fine</div><div>${violation.fineAmount}</div>
          ${ challanNum ? `<div style="font-weight:600;">Challan No.</div><div>${challanNum}</div>` : '' }
        </div>
      </div>
    `,
    width: 520,
    confirmButtonText: 'Close',
    confirmButtonColor: '#4f46e5',
    showCloseButton: true,
    backdrop: `rgba(17, 24, 39, 0.4)`
  });
};


const handleViewChallan = (challan) => {
    if (!challan) {
      Swal.fire({ icon: 'info', title: 'No challan', text: 'No challan found for this vehicle.' });
      return;
    }
    Swal.fire({
      title: `<strong>Challan Details</strong>`,
      html: `
        <div style="font-family:Inter, system-ui; text-align:left; color:#111827;">
          <div style="display:grid;grid-template-columns:120px 1fr;gap:6px 10px;font-size:14px">
            <div style="font-weight:600;">Challan</div><div>${challan.challanNumber}</div>
            <div style="font-weight:600;">Vehicle</div><div>${challan.vehicleNumber}</div>
            <div style="font-weight:600;">Violation</div><div>${challan.violation}</div>
            <div style="font-weight:600;">Location</div><div>${challan.location}</div>
            <div style="font-weight:600;">Date</div><div>${challan.date}</div>
            <div style="font-weight:600;">Time</div><div>${challan.time}</div>
            <div style="font-weight:600;">Fine</div><div>₹${challan.fineAmount}</div>
            <div style="font-weight:600;">Status</div><div>${challan.status}</div>
            <div style="font-weight:600;">Officer</div><div>${challan.officerName}</div>
            <div style="font-weight:600;">Payment</div><div>${challan.paymentMethod}</div>
          </div>
        </div>
      `,
      width: 520,
      confirmButtonText: 'Close',
      confirmButtonColor: '#4f46e5',
      showCloseButton: true,
    });
  };



// ============= 2️⃣ Download violation as PDF =============
const handleDownloadViolation = (violation, challan = null) => {
  const resolved = challan || (findChallansByVehicle(violation.vehicleNumber) || [null])[0] || null;
  const displayLocation = resolved?.location || violation.location || 'Unknown';
  const challanNum = resolved?.challanNumber || violation.challanNumber || violation.raw?.challan_number || violation.raw?.challan || '';
  const pdfWindow = window.open('', '_blank', 'width=800,height=700');
  const now = new Date().toLocaleString();
  const html = `
    <!doctype html><html><head><meta charset="utf-8"/>
    <title>Violation ${violation.id}</title>
    <style>
      body { font-family: Inter, system-ui; padding: 24px; color:#111827; }
      h2 { margin:0 0 16px 0; }
      img { width:100%; max-height:300px; border-radius:8px; object-fit:cover; margin-bottom:16px; }
      table { width:100%; border-collapse:collapse; font-size:14px; }
      th, td { padding:8px 10px; text-align:left; border:1px solid #e6e9ef; }
      th { background:#f9fafb; font-weight:700; }
    </style>
    </head><body>
      <h2>Helmet Violation Report</h2>
      <img src="/images/${violation.image}" alt="violation"/>
      <table>
        <tr><th>ID</th><td>${violation.id}</td></tr>
        <tr><th>Vehicle</th><td>${violation.vehicleNumber}</td></tr>
        <tr><th>Location</th><td>${displayLocation}</td></tr>
        <tr><th>Date</th><td>${violation.date}</td></tr>
        <tr><th>Time</th><td>${violation.time}</td></tr>
        <tr><th>Fine</th><td>${violation.fineAmount}</td></tr>
        ${ challanNum ? `<tr><th>Challan No.</th><td>${challanNum}</td></tr>` : '' }
      </table>
      <div style="margin-top:12px;font-size:12px;color:#6b7280;">Generated: ${now}</div>
    </body></html>`;
  pdfWindow.document.write(html);
  pdfWindow.document.close();
  setTimeout(() => pdfWindow.print(), 600);
};



  // ----------------- Filtering & Pagination logic -----------------
  // 1) filteredAll => result of applying searchTerm + filterStatus
  // 1) filteredAll => result of applying searchTerm + filterStatus
const filteredAll = useMemo(() => {
  const term = (searchTerm || '').trim().toLowerCase();

  const parseRecordDate = (r) => {
    try {
      if (!r || !r.date) return null;
      // combine date and time if time exists
      const timePart = r.time ? r.time.split(' ')[0] : '00:00:00';
      const iso = `${r.date}T${timePart}`;
      const d = new Date(iso);
      if (!isNaN(d)) return d;
      const d2 = new Date(r.date);
      return isNaN(d2) ? null : d2;
    } catch (e) { return null; }
  };

  const matchesTimeFilter = (record) => {
    if (!timeFilter || timeFilter.type === 'all') return true;
    const recDate = parseRecordDate(record);
    if (!recDate) return true; // keep items without date when using quick filters; adjust if you prefer otherwise

    if (timeFilter.type === 'today' || timeFilter.type === 'range' || timeFilter.type === '24h' || timeFilter.type === '7d') {
      const from = timeFilter.from ? new Date(timeFilter.from) : null;
      const to = timeFilter.to ? new Date(timeFilter.to) : null;
      if (from && recDate < from) return false;
      if (to && recDate > to) return false;
      return true;
    }
    return true;
  };

  return violationsData.filter(v => {
    // basic violation fields search
    const matchesSearch = !term
      || (v.vehicleNumber || '').toLowerCase().includes(term)
      || (v.location || '').toLowerCase().includes(term)
      || (v.id || '').toLowerCase().includes(term);

    // check challan fields linked to this violation's vehicle
    const challansForVehicle = findChallansByVehicle(v.vehicleNumber);
    const challanMatches = term && challansForVehicle.some(c => {
      return (c.challanNumber || '').toLowerCase().includes(term)
        || (c.violation || '').toLowerCase().includes(term)
        || String(c.fineAmount || '').toLowerCase().includes(term)
        || (c.officerName || '').toLowerCase().includes(term)
        || (c.status || '').toLowerCase().includes(term);
    });

    const matchesFilter = matchesTimeFilter(v);

    return (matchesSearch || challanMatches) && matchesFilter;
  });
}, [violationsData, searchTerm, timeFilter, challanData]);

  // 2) pagination calculations
  const totalFiltered = filteredAll.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));

  // ensure current page in range
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [page, totalPages]);

  // current page slice
  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredAll.slice(start, start + perPage);
  }, [filteredAll, page, perPage]);

  // page range text
  const pageStart = totalFiltered === 0 ? 0 : (page - 1) * perPage + 1;
  const pageEnd = Math.min(totalFiltered, page * perPage);

  // helper to build a small page number list (for many pages we show a window)
  const visiblePageNumbers = (() => {
    const pages = [];
    const maxButtons = 5;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;
    if (end > totalPages) { end = totalPages; start = Math.max(1, end - maxButtons + 1); }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  })();

  // ------------------- Logout handler -------------------
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const resData = await response.json().catch(() => ({}));
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');

      Swal.fire({ icon: 'success', title: 'Logged out', text: resData?.message || 'You have been logged out successfully.' });
      navigate('/login', { replace: true });
    } catch (err) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      Swal.fire({ icon: 'warning', title: 'Logged out locally', text: 'Could not contact server but you are logged out locally.' });
      navigate('/login', { replace: true });
    }
  };

  // ---------------- UI render ----------------
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
            <Link to="/" className="nav-item"><span className="nav-icon">⊞</span> Dashboard</Link>
            <Link to="/ambulance-tracker" className="nav-item"><span className="nav-icon">📍</span> Ambulance Tracker</Link>
            <Link to="/traffic-signal" className="nav-item"><span className="nav-icon">⚡</span> Traffic Signals</Link>
            <a href="#" className="nav-item active"><Shield className="nav-icon-svg"/> Helmet Violations</a>
            {/* <Link to="/challan-history" className="nav-item"><span className="nav-icon">📄</span> Challan History</Link> */}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="last-updated">
            <p>Last Updated</p>
            <p className="update-time">{currentTime.toLocaleTimeString()}</p>
          </div>
          <div className="logout-container">
            <button onClick={handleLogout} className="logout-button"><span className="logout-icon">🔒</span> Logout</button>
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
          {/* <div className="header-actions">
            <div className="notification-icon"><AlertTriangle className="icon" /></div>
            <div className="user-avatar">A</div>
          </div> */}
        </div>

        {/* Stats Cards (kept unchanged) */}
        <div className="stats-grid">
          <div className="stat-card violations-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-label">Total Violations </h3>
                <p className="stat-value">{totalViolations}</p>
              </div>
              <Shield className="stat-icon" />
            </div>
          </div>
          <div className="stat-card pending-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-label">Top Violation Location </h3>
                {/* <p className="stat-value" style={{fontSize: '20px'}}>{getDisplayLocation()}</p> */}
                {/* <p className="stat-value" style={{fontSize: '20px'}}>
  {topLoc?.location && topLoc.location !== '—' ? `${topLoc.location} ${topLoc.count? `(${topLoc.count})` : ''}` : 'Unknown'}
</p> */}
  <p className="stat-value" style={{ fontSize: '20px' }}>
  {topLoc?.location && topLoc.location !== '—'
    ? `${topLoc.location}${(typeof topLoc.count === 'number' && topLoc.count > 1) ? ` (${topLoc.count})` : ''}`
    : 'Unknown'}
</p>

                
              </div>
              {/* <Clock className="stat-icon" /> */}
              <div className="stat-icon-custom resolved-icon"></div>
            </div>
          </div>
          <div className="stat-card resolved-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-label">Peak Violation Hour</h3>
      <p className="stat-value">{peakHour}</p>
              </div>
              {/* <div className="stat-icon-custom resolved-icon"></div> */}
              <Clock className="stat-icon" />
            </div>
          </div>
          <div className="stat-card revenue-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-label">Total Fine </h3>
                <p className="stat-value">{totalFine}</p>
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
      onClick={() => {
        // Only update selectedTab for actual content tabs.
        if (tab === 'Overview') {
          setSelectedTab('Overview');
        } else if (tab === 'Analytics') {
          // open modal, but do not change selectedTab so page content remains 'Overview'
          handleOpenAnalytics();
        } else if (tab === 'Live Monitoring') {
          handleLiveMonitoring();
        }
      }}
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
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="search-input"
              />
            </div>
            {/* removed native select; using modal filter */}
          </div>

          <div className="action-buttons">
            <button className="filter-button" onClick={handleOpenTimeFilter}><Filter className="button-icon" /> Filter</button>

            <button className="export-button" onClick={handleExport}><Download className="button-icon" /> Export</button>
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
          <th className="table-header">Challan Details</th>
          <th className="table-header">Actions</th>
        </tr>
      </thead>

      <tbody>
        {paginated.map((violation) => {
          const challans = findChallansByVehicle(violation.vehicleNumber);
          const primaryChallan = challans.length ? challans[0] : null;

          return (
            <tr key={violation.id} className="table-row">
              <td className="table-cell">
                <span className="violation-id">{violation.id}</span>
              </td>

              <td className="table-cell">
                <div className="vehicle-details">
                  <p className="vehicle-number">{violation.vehicleNumber}</p>
                </div>
              </td>

              <td className="table-cell">
                <div className="location-info">
                  <MapPin className="location-icon" />
                  <span className="location-text">{getDisplayLocation(violation)}</span>
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
                {primaryChallan ? (
                  <div className="challan-summary">
                    <div className="challan-number">{primaryChallan.challanNumber}</div>
                  </div>
                ) : (
                  (violation.challanNumber || violation.raw?.challan_number || violation.raw?.challan || '—')
                )}
              </td>

              <td className="table-cell">
                <div className="action-buttons-cell">
                  <button
                    className="action-button view-button"
                    onClick={() => handleViewViolation(violation, primaryChallan)}
                    title="View violation"
                  >
                    <Eye className="action-icon" />
                  </button>

                  <button
                    className="action-button download-button"
                    onClick={() => handleDownloadViolation(violation, primaryChallan)}
                    title="Download violation report"
                    style={{ marginLeft: 8 }}
                  >
                    <Download className="action-icon" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}

        {paginated.length === 0 && (
          <tr>
            <td colSpan={7} style={{ padding: 16, color: '#6b7280' }}>
              No results found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>


        {/* Pagination */}
        <div className="pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
          <p className="pagination-info">Showing {pageStart} – {pageEnd} of {totalFiltered} violations</p>

          <div className="pagination-controls" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="pagination-button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ opacity: page <= 1 ? 0.5 : 1 }}
            >
              Previous
            </button>

            {visiblePageNumbers.map(pn => (
              <button
                key={pn}
                className={`pagination-button ${pn === page ? 'active' : ''}`}
                onClick={() => setPage(pn)}
                aria-current={pn === page ? 'page' : undefined}
              >
                {pn}
              </button>
            ))}

            <button
              className="pagination-button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{ opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelmetViolations;





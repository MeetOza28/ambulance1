// src/services/helmetServices.js
export const getHelmetStats = async (opts = {}) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const safeNumber = (v) => {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const n = Number(String(v).replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  try {
    const res = await fetch('http://localhost:5001/api/violation/stats', { headers });
    if (res.ok) {
      const j = await res.json().catch(() => null);
      const payload = j?.data ? j.data : j || {};
      const totalViolations = payload?.totalViolations ?? payload?.total ?? payload?.count ?? null;

      // Accept server names and convert
      const revenueRaw =
        payload?.revenue ??
        payload?.totalFine ??
        payload?.totalRevenue ??
        payload?.fineTotal ??
        payload?.revenueCollected ??
        payload?.fine_amount ??
        null;

      const revenue = safeNumber(revenueRaw);
      return { data: { totalViolations, revenue, raw: payload } };
    }
  } catch (e) {
    console.warn('helmetStats summary fetch failed, falling back', e);
  }

  // fallback: fetch list and sum (you already have this, keep it)
  try {
    const resAll = await fetch('http://localhost:5001/api/violations', { headers });
    if (!resAll.ok) throw new Error(`Failed to fetch violations (${resAll.status})`);
    const json = await resAll.json().catch(() => null);

    const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : (json?.violations || []));
    const totalViolations = list.length;

    let revenue = 0;
    for (const it of list) {
      const raw =
        it?.fine_amount ??
        it?.fineAmount ??
        it?.fine ??
        it?.amount ??
        it?.totalFine ??
        it?.fine_total ??
        0;
      revenue += safeNumber(raw);
    }

    return { data: { totalViolations, revenue } };
  } catch (err) {
    console.error('Failed to compute helmet stats fallback:', err);
    return { data: { totalViolations: null, revenue: null } };
  }
};

// src/services/trafficServices.js
const FIREBASE_DB = 'https://surakshapath-61e6f-default-rtdb.firebaseio.com';

const doFetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText}`);
  return res.json();
};

/**
 * getTrafficStats({ shallow = true })
 * returns { data: { totalSignals, online, offline, maintenance } }
 */
export const getTrafficStats = async ({ shallow = true } = {}) => {
  try {
    if (shallow) {
      const json = await doFetchJson(`${FIREBASE_DB}/TrafficSignals.json?shallow=true`);
      const totalSignals = json && typeof json === 'object' ? Object.keys(json).length : 0;
      return { data: { totalSignals, online: 0, offline: 0, maintenance: 0 } };
    }

    const json = await doFetchJson(`${FIREBASE_DB}/TrafficSignals.json`);
    const signals = json && typeof json === 'object' ? Object.values(json) : [];

    const normalize = (s) => String(s || '').trim().toLowerCase();
    const online = signals.filter(s => normalize(s.status) === 'active' || normalize(s.status) === 'online').length;
    const offline = signals.filter(s => normalize(s.status) === 'offline').length;
    const maintenance = signals.filter(s => normalize(s.status) === 'maintenance').length;

    return { data: { totalSignals: signals.length, online, offline, maintenance } };
  } catch (err) {
    console.error('getTrafficStats (firebase) failed:', err);
    return { data: { totalSignals: 0, online: 0, offline: 0, maintenance: 0 } };
  }
};

export default { getTrafficStats };

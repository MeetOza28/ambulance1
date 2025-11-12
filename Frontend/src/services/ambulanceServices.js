// // // // src/services/ambulanceService.js
// import axios from 'axios';

// // const API_URL = 'http://localhost:5001/api/ambulances'; // Replace with your backend URL

// // // export const getAllAmbulances = () => axios.get(`${API_URL}/`);
// // // export const getStats = () => axios.get(`${API_URL}/stats`);
// // // export const getAmbulanceById = (id) => axios.get(`/api/ambulances/${id}`);


// // // src/services/ambulanceService.js
// // import axios from 'axios';

// const BASE_URL = 'http://localhost:5001/api/ambulances'; // <- change to /ambulances if your backend uses that

// const api = axios.create({
//   baseURL: BASE_URL,
//   timeout: 10000,
// });

// // attach token automatically
// api.interceptors.request.use(cfg => {
//   const token = localStorage.getItem('token') || sessionStorage.getItem('token');
//   if (token) cfg.headers.Authorization = `Bearer ${token}`;
//   return cfg;
// }, err => Promise.reject(err));

// export const getAllAmbulances = (opts = {}) => api.get('/', opts);
// // export const getStats = () => api.get('/stats'); // returns axios response; caller should read res.data
// export const getAmbulanceById = (id) => api.get(`/${encodeURIComponent(id)}`);

// // export default { getAllAmbulances, getStats, getAmbulanceById };

// // src/services/ambulanceServices.js
// const FIREBASE_DB = 'https://surakshapath-61e6f-default-rtdb.firebaseio.com';

// const doFetchJson = async (url) => {
//   const res = await fetch(url);
//   if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText}`);
//   return res.json();
// };

// /**
//  * getStats({ shallow = true })
//  * - shallow=true -> very fast key-only count (uses ?shallow=true)
//  * - shallow=false -> fetch full node and compute breakdowns (status counts)
//  */
// export const getStats = async ({ shallow = true } = {}) => {
//   try {
//     if (shallow) {
//       const json = await doFetchJson(`${FIREBASE_DB}/Ambulances.json?shallow=true`);
//       const total = json && typeof json === 'object' ? Object.keys(json).length : 0;
//       return { data: { totalActive: total, emergency: 0, enRoute: 0, available: 0 } };
//     }

//     const all = await doFetchJson(`${FIREBASE_DB}/Ambulances.json`);
//     const list = all && typeof all === 'object' ? Object.values(all) : [];

//     let emergency = 0, enRoute = 0, available = 0;
//     list.forEach(a => {
//       const s = String(a.status || '').toLowerCase();
//       if (s === 'emergency') emergency++;
//       else if (s === 'en route' || s === 'enroute' || s === 'en_route') enRoute++;
//       else if (s === 'available') available++;
//     });

//     return { data: { totalActive: list.length, emergency, enRoute, available } };
//   } catch (err) {
//     console.error('getStats (firebase ambulances) failed:', err);
//     return { data: { totalActive: 0, emergency: 0, enRoute: 0, available: 0 } };
//   }
// };

// // export const getAllAmbulances = async () => {
// //   try {
// //     const json = await doFetchJson(`${FIREBASE_DB}/Ambulances.json`);
// //     const arr = json && typeof json === 'object' ? Object.entries(json).map(([k,v]) => ({ id: k, ...v })) : [];
// //     return { data: arr };
// //   } catch (err) {
// //     console.error('getAllAmbulances failed:', err);
// //     return { data: [] };
// //   }
// // };

// export default { getStats, getAllAmbulances };




// ambulanceServices.js
const FIREBASE_DB = 'https://surakshapath-61e6f-default-rtdb.firebaseio.com';

const doFetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText}`);
  return res.json();
};

export const getAllAmbulances = async () => {
  try {
    const json = await doFetchJson(`${FIREBASE_DB}/Ambulances.json`);
    // convert object map to array with ambulanceId field
    const arr = json && typeof json === 'object' ?
      Object.entries(json).map(([id, val]) => ({ ambulanceId: id, ...val })) : [];
    return { data: arr };
  } catch (err) {
    console.error('getAllAmbulances failed:', err);
    return { data: [] };
  }
};

export const getAmbulanceById = async (id) => {
  try {
    const json = await doFetchJson(`${FIREBASE_DB}/Ambulances/${encodeURIComponent(id)}.json`);
    return { data: json };
  } catch (err) {
    console.error('getAmbulanceById failed:', err);
    return { data: null };
  }
};

export const getStats = async ({ shallow = true } = {}) => {
  try {
    if (shallow) {
      const keys = await doFetchJson(`${FIREBASE_DB}/Ambulances.json?shallow=true`);
      const total = keys && typeof keys === 'object' ? Object.keys(keys).length : 0;
      return { data: { totalActive: total, emergency: 0, enRoute: 0, available: 0 } };
    }
    const all = await doFetchJson(`${FIREBASE_DB}/Ambulances.json`);
    const list = all && typeof all === 'object' ? Object.values(all) : [];
    let emergency = 0, enRoute = 0, available = 0;
    list.forEach(a => {
      const s = String(a.status || '').toLowerCase();
      if (s === 'emergency') emergency++;
      else if (s.includes('en')) enRoute++;
      else if (s.includes('available')) available++;
    });
    return { data: { totalActive: list.length, emergency, enRoute, available } };
  } catch (err) {
    console.error('getStats failed:', err);
    return { data: { totalActive: 0, emergency: 0, enRoute: 0, available: 0 } };
  }
};

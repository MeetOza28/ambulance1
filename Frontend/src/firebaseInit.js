// src/firebaseInit.js
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Minimal config — you only need databaseURL for RTDB reads.
// Add apiKey/authDomain if you use other Firebase features.
const firebaseConfig = {
  databaseURL: 'https://surakshapath-61e6f-default-rtdb.firebaseio.com',
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export const db = getDatabase();

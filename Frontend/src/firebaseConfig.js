// src/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDrUV2mnBOyDzUJHCISr9cpbEKVu4XNFxk",
  authDomain: "surakshapath-61e6f.firebaseapp.com",
  databaseURL: "https://surakshapath-61e6f-default-rtdb.firebaseio.com",
  projectId: "surakshapath-61e6f",
  storageBucket: "surakshapath-61e6f.firebasestorage.app",
  messagingSenderId: "1088718037273",
  appId: "1:1088718037273:web:0a65797ec575418d906588",
  measurementId: "G-B0EQCV3F1Y"
};

// ✅ Initialize only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Export Realtime Database reference
export const db = getDatabase(app);
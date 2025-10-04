// import admin from "firebase-admin";
// import fs from "fs";
// import logger from "../utils/logger.js";

// const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./config/serviceAccountKey.json";
// if (!fs.existsSync(keyPath)) {
//   logger.warn("Firebase service account JSON not found at " + keyPath + " — Firebase features will fail until provided.");
// } else {
//   const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: process.env.FIREBASE_DB_URL || undefined
//   });
//   logger.info("Firebase admin initialized");
// }

// export default admin;

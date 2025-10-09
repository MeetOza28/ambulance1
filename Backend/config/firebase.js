import admin from "firebase-admin";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./config/serviceAccountKey.json";
console.log("Using Firebase service account path:", keyPath);

if (!fs.existsSync(keyPath)) {
  console.error("⚠️ Firebase service account JSON not found at " + keyPath);
} else if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL
  });
  console.log("✅ Firebase admin initialized successfully");
}

export default admin;

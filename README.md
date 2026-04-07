<div align="center">

# 🚑 SurakshaPath

### Real-Time Ambulance Tracking & Emergency Response System

[![JavaScript](https://img.shields.io/badge/JavaScript-88.8%25-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Maps](https://img.shields.io/badge/Google_Maps-API-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white)](https://developers.google.com/maps)

</div>

---

## 📌 Overview

**SurakshaPath** (सुरक्षापथ — *"Safe Path"* in Sanskrit) is a real-time ambulance tracking and emergency response system designed to improve coordination between hospitals, ambulances, and traffic signals during medical emergencies.

The system enables hospitals to dispatch and monitor ambulances in real time, helps drivers navigate the fastest route, and provides a live dashboard for coordinators — ultimately reducing emergency response time.

---

## 🎯 Problem Statement

In India, delayed ambulance response is a leading cause of preventable deaths. Poor coordination between hospitals and ambulances, lack of live tracking, and manual communication create critical delays. SurakshaPath addresses this with a real-time, GPS-powered coordination platform.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Frontend | React.js, CSS |
| Real-time Database | Firebase Realtime Database |
| Data Storage | MongoDB |
| Maps & Routing | Google Maps API (`@react-google-maps/api`) |
| Communication | Firebase for live sync |

---

## ✨ Features

### 🗺️ Real-Time GPS Tracking
- Live ambulance location updated continuously via GPS
- Ambulance movement visible on interactive Google Maps
- Automatic map re-centering as ambulance moves

### 🏥 Hospital Dashboard
- Monitor all active ambulances from a central web dashboard
- View ambulance status: dispatched, en route, arrived
- Assign ambulances to emergency calls

### 🚦 Smart Routing
- Automated optimal route calculation to destination
- Dynamic re-routing for traffic and road conditions
- Route visualization on map with ETA display

### 📡 Real-Time Communication
- Firebase Realtime Database for instant data sync
- Zero-latency updates between ambulance app and hospital dashboard
- Emergency alerts pushed to relevant stakeholders

### 📊 Emergency Coordination
- Emergency case logging and status tracking
- Ambulance dispatch history
- Multi-role access: Hospital Coordinator, Driver

---

## 📁 Project Structure

```
SurakshaPath/
├── Backend/
│   ├── routes/            # Express API routes
│   ├── controllers/       # Business logic handlers
│   ├── models/            # MongoDB data models
│   ├── config/            # Firebase & DB configuration
│   └── index.js           # Server entry point
├── Frontend/
│   ├── src/
│   │   ├── components/    # React UI components
│   │   ├── pages/         # Dashboard, Map, Login pages
│   │   ├── services/      # Firebase & API services
│   │   └── App.js         # Root component
│   └── public/
├── package.json
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16
- MongoDB (local or Atlas)
- Firebase project (Realtime Database enabled)
- Google Maps API Key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/MeetOza28/SurakshaPath.git
cd SurakshaPath
```

#### Backend Setup

```bash
cd Backend
npm install

# Create .env file
cp .env.example .env
# Fill in your MongoDB URI, Firebase config, etc.

npm start
```

#### Frontend Setup

```bash
cd Frontend
npm install

# Add your Google Maps API key and Firebase config
# in src/config/ or .env

npm start
```

---

## 🔧 Environment Variables

### Backend `.env`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/surakshapath

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

### Frontend `.env`

```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_BACKEND_URL=http://localhost:5000
```

---

## 🖥️ System Architecture

```
┌─────────────────┐        ┌──────────────────────┐
│  Ambulance App  │──GPS──▶│  Firebase Realtime DB │
└─────────────────┘        └──────────┬───────────┘
                                      │ Live Sync
                           ┌──────────▼───────────┐
                           │  Hospital Dashboard   │
                           │  (React + Google Maps)│
                           └──────────┬───────────┘
                                      │ REST API
                           ┌──────────▼───────────┐
                           │  Node.js + Express    │
                           │  Backend Server       │
                           └──────────┬───────────┘
                                      │
                           ┌──────────▼───────────┐
                           │       MongoDB         │
                           │  (Case & History DB)  │
                           └──────────────────────┘
```

---

## 🌐 Key Use Cases

| Role | Capability |
|---|---|
| Hospital Coordinator | View live map, dispatch ambulance, monitor status |
| Ambulance Driver | Receive dispatch, navigate via Maps, update status |
| System | Auto-sync GPS data, push real-time updates |

---

## 📌 Future Enhancements

- [ ] Traffic signal integration for green corridor
- [ ] Mobile app for ambulance drivers (React Native)
- [ ] Predictive ETA using ML
- [ ] Integration with government health APIs
- [ ] Push notifications for patients/family
- [ ] Multi-city support

---

## 👤 Author

**Meet Oza**
- GitHub: [@MeetOza28](https://github.com/MeetOza28)
- LinkedIn: [meetoza28](https://linkedin.com/in/meetoza28)
- Email: meetoza28@gmail.com

---

<div align="center">

⭐ If SurakshaPath resonates with you, consider giving it a star — it helps!

*Built with ❤️ to save lives through technology*

</div>

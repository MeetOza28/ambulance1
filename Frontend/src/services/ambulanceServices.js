// src/services/ambulanceService.js
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/ambulances'; // Replace with your backend URL

export const getAllAmbulances = () => axios.get(`${API_URL}/`);
export const getStats = () => axios.get(`${API_URL}/stats`);
export const getAmbulanceById = (id) => axios.get(`/api/ambulances/${id}`);
// src/api.js
import axios from 'axios';
export const API = axios.create({ baseURL: 'http://localhost:8000' });


API.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function signup(username, password) {
  const data = new URLSearchParams();
  data.append("username", username);
  data.append("password", password);
  return API.post("/signup", data);
}

export function login(username, password) {
  const data = new URLSearchParams();
  data.append("username", username);
  data.append("password", password);
  return API.post("/token", data);
}
export function uploadResume(formData) {
  return API.post('/upload_resume', formData);
}

export function getProgress() {
  // Returns the most recent progress for the logged-in user
  return API.get('/progress/'); // <-- trailing slash
}

export function saveProgress(goal, skills, roadmap) {
  // Save or update the user's progress
  return API.post('/progress/', { goal, skills, roadmap }); // <-- trailing slash
}

export function getAllProgress() {
  // Returns all progress entries for the logged-in user
  return API.get('/progress/all/');
}

export function deleteProgress(id) {
  return API.delete(`/progress/${id}/`);
}

export function renameProgress(id, new_goal) {
  return API.patch(`/progress/${id}/`, { new_goal });
}

export function toggleStep(id, step_idx, done) {
  return API.patch(`/progress/${id}/step/`, { step_idx, done });
}





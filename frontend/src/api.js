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
export function uploadResume(file, goal) {
  const form = new FormData();
  form.append('file', file);
  form.append('goal', goal);
  return API.post('/upload_resume', form);
}

export function getProgress(userId) {
  return API.get(`/progress/${userId}`);
}

export function patchProgress(userId, step, done) {
  // отправляем PATCH с query-параметрами
  return API.patch(`/progress/${userId}`, null, {
    params: { step, done }
  });
}





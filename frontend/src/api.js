
// frontend/src/api.js
import axios from "axios";

const API_BASE = "http://localhost:3001";

// IMPORTANT: ALWAYS send cookies for session authentication
axios.defaults.withCredentials = true;

// ======================= LOGIN =======================
export async function login(username, password) {
  const res = await axios.post(
    `${API_BASE}/api/login`,
    { username, password },
    { withCredentials: true }
  );
  return res.data;
}

// ======================= REQUESTS =======================
export async function fetchRequests() {
  const res = await axios.get(`${API_BASE}/api/requests`, {
    withCredentials: true,
  });
  return res.data;
}

export async function assignRequest(id, assigned_to) {
  return axios.post(
    `${API_BASE}/api/requests/${id}/assign`,
    { assigned_to },
    { withCredentials: true }
  );
}

export async function updateStatus(id, status) {
  return axios.post(
    `${API_BASE}/api/requests/${id}/status`,
    { status },
    { withCredentials: true }
  );
}

// ======================= DRIVERS =======================

export async function fetchDrivers() {
  const res = await axios.get(`${API_BASE}/api/drivers`, {
    withCredentials: true,
  });
  return res.data;
}

export async function addDriver(driver) {
  return axios.post(`${API_BASE}/api/drivers`, driver, {
    withCredentials: true,
  });
}

// ⭐ FIXED: backend requires PUT not POST
export async function updateDriverStatus(id, status) {
  return axios.put(
    `${API_BASE}/api/drivers/${id}`,
    { status },
    { withCredentials: true }
  );
}

// ⭐ DELETE route correct
export async function deleteDriver(id) {
  return axios.delete(`${API_BASE}/api/drivers/${id}`, {
    withCredentials: true,
  });
}

// ======================= STATS =======================

export async function fetchStats() {
  const res = await axios.get(`${API_BASE}/api/stats`, {
    withCredentials: true,
  });
  return res.data;
}

export async function fetchRecentRequests() {
  const res = await axios.get(`${API_BASE}/api/requests/recent`, {
    withCredentials: true,
  });
  return res.data;
}

export async function fetchDailyStats(days = 7) {
  const res = await axios.get(
    `${API_BASE}/api/stats/daily?days=${days}`,
    { withCredentials: true }
  );
  return res.data;
}

export async function fetchStatusDistribution() {
  const res = await axios.get(`${API_BASE}/api/stats/status`, {
    withCredentials: true,
  });
  return res.data;
}

export async function fetchServiceDistribution() {
  const res = await axios.get(`${API_BASE}/api/stats/service`, {
    withCredentials: true,
  });
  return res.data;
}

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const client = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request automatically, if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend says the token is invalid/expired, send the user back to login
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ---------------- Auth ----------------
export async function login(username, password) {
  const res = await client.post("/auth/login", { username, password });
  return res.data; // { token, role, username }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem("token"));
}

// ---------------- Cases ----------------
export async function fetchCases() {
  const res = await client.get("/cases");
  return res.data;
}

export async function fetchCaseById(caseId) {
  const res = await client.get(`/cases/${caseId}`);
  return res.data;
}

export async function createCase(caseData) {
  const res = await client.post("/cases", caseData);
  return res.data;
}

// ---------------- Evidence ----------------
export async function uploadEvidence(caseId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await client.post(`/evidence/${caseId}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function fetchEvidenceForCase(caseId) {
  const res = await client.get(`/evidence/${caseId}`);
  return res.data;
}

// ---------------- Analysis ----------------
export async function runAnalysis(evidenceId) {
  const res = await client.post(`/analysis/${evidenceId}/run`);
  return res.data;
}

export async function fetchAnalysisResult(evidenceId) {
  const res = await client.get(`/analysis/${evidenceId}`);
  return res.data;
}

export async function fetchTimeline(caseId) {
  const res = await client.get(`/analysis/${caseId}/timeline`);
  return res.data;
}

export async function fetchEvidenceGraph(caseId) {
  const res = await client.get(`/analysis/${caseId}/graph`);
  return res.data;
}

// ---------------- Copilot ----------------
export async function askCopilot(caseId, question) {
  const res = await client.post(`/copilot/${caseId}/ask`, { question });
  return res.data; // { answer }
}

// ---------------- Reports ----------------
export async function generateReport(caseId) {
  const res = await client.post(`/reports/${caseId}/generate`);
  return res.data; // { report_text }
}

export function getReportPdfUrl(caseId) {
  return `${API_BASE}/reports/${caseId}/pdf`;
}

// ---------------- Audit Logs ----------------
export async function fetchAuditLogs() {
  const res = await client.get("/audit");
  return res.data;
}

export default client;

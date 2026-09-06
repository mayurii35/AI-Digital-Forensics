import axios from "axios";
import { auth } from "./firebase";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const client = axios.create({
  baseURL: API_BASE,
});

// Attach Firebase ID token to every request
client.interceptors.request.use(async (config) => {
  await auth.authStateReady();

  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();

    config.headers = config.headers || {};
    config.headers.Authorization = "Bearer " + token;
  }

  return config;
});

// Handle unauthorized requests
client.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await auth.signOut();
      window.location.href = "/login";
    }

    return Promise.reject(err);
  }
);

// ==================== CASES ====================

export async function fetchCases() {
  const res = await client.get("/cases");
  return res.data.cases || [];
}

export async function fetchCaseById(caseId) {
  const res = await client.get(`/cases/${caseId}`);
  return res.data;
}

export async function createCase(caseData) {
  const res = await client.post("/cases", caseData);
  return res.data;
}

// ==================== EVIDENCE ====================

export async function uploadEvidence(
  caseId,
  file,
  evidenceType = file.type || "unknown",
  description = ""
) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("case_id", caseId);
  formData.append("evidence_type", evidenceType);

  if (description) {
    formData.append("description", description);
  }

  const res = await client.post("/upload-evidence", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

export async function fetchEvidenceForCase(caseId) {
  const res = await client.get(`/cases/${caseId}/evidence`);
  return res.data.evidence || [];
}

export async function fetchEvidenceChain(evidenceId) {
  const res = await client.get(`/audit/evidence/${evidenceId}/chain`);
  return res.data;
}

// Verify evidence hash
export async function verifyEvidenceHash(evidenceId) {
  const res = await client.get(
    `/audit/evidence/${evidenceId}/verify-hash`
  );

  return res.data;
}

// ==================== AI ANALYSIS ====================

export async function runAnalysis(evidenceId) {
  const res = await client.post(`/ai/analyze/${evidenceId}`);
  return res.data;
}

export async function fetchAnalysisResult(evidenceId) {
  const res = await client.get(`/ai/analysis/${evidenceId}`);
  return res.data;
}

export async function fetchTimeline(caseId) {
  const res = await client.get(`/cases/${caseId}/timeline`);
  return res.data;
}

export async function fetchEvidenceGraph(caseId) {
  const res = await client.get(`/cases/${caseId}/graph`);
  return res.data;
}

export async function fetchCaseAnalysisDashboard(caseId) {
  const res = await client.get(`/ai/case/${caseId}/dashboard`);
  return res.data;
}

// ==================== COPILOT / GENAI ====================

export async function askCopilot(caseId, question) {
  const res = await client.post(`/copilot/${caseId}/ask`, {
    question,
  });

  return res.data;
}

// ==================== REPORTS ====================

export async function generateReport(caseId) {
  const res = await client.post(`/reports/${caseId}/generate`);
  return res.data;
}

export function getReportPdfUrl(caseId) {
  return `${API_BASE}/reports/${caseId}/pdf`;
}

export async function fetchReportPdf(caseId) {
  const res = await client.get(`/reports/${caseId}/pdf`, {
    responseType: "blob",
  });

  return res.data;
}

// ==================== AUDIT LOGS ====================

export async function fetchAuditLogs() {
  const res = await client.get("/audit");
  return res.data.audit_logs || [];
}

export default client;
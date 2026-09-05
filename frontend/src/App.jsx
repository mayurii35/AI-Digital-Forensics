import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/Sidebar.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Cases from "./pages/Cases.jsx";
import CreateCase from "./pages/CreateCase.jsx";
import CaseDetails from "./pages/CaseDetails.jsx";
import Evidence from "./pages/Evidence.jsx";
import Analysis from "./pages/Analysis.jsx";
import Timeline from "./pages/Timeline.jsx";
import EvidenceGraph from "./pages/EvidenceGraph.jsx";
import Copilot from "./pages/Copilot.jsx";
import Reports from "./pages/Reports.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Cases />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/create"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CreateCase />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:caseId"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CaseDetails />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:caseId/evidence"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Evidence />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:caseId/analysis"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Analysis />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:caseId/timeline"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Timeline />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:caseId/graph"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EvidenceGraph />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:caseId/copilot"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Copilot />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Reports />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AuditLogs />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

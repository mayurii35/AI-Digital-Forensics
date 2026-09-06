import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import Loading from "./Loading.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Never redirect while Firebase is still restoring browserLocalPersistence.
  if (loading || currentUser === undefined) return <Loading label="Restoring your secure session…" />;
  if (currentUser === null) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

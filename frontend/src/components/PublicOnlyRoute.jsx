import React from "react";
import { Navigate } from "react-router-dom";
import Loading from "./Loading.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Login and signup are available only after Firebase has confirmed no session.
export default function PublicOnlyRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading || currentUser === undefined) return <Loading label="Checking your secure session…" />;
  if (currentUser !== null) return <Navigate to="/dashboard" replace />;
  return children;
}

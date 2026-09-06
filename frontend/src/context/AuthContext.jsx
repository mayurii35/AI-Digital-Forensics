import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { browserLocalPersistence, onAuthStateChanged, setPersistence } from "firebase/auth";
import { auth } from "../services/firebase";

const AuthContext = createContext(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export function AuthProvider({ children }) {
  // `undefined` is deliberately different from `null`: Firebase has not yet
  // restored the persisted session while it is undefined.
  const [currentUser, setCurrentUser] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    async function initializeAuth() {
      try {
        // Explicitly retain Firebase sessions across browser refreshes/restarts.
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        // Firebase still reports auth state below; retain the error for UI/debugging.
        if (active) setAuthError(error);
      }

      if (!active) return;
      unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          if (!active) return;
          setCurrentUser(user); // user is null only after Firebase confirms sign-out.
          setLoading(false);
        },
        (error) => {
          if (!active) return;
          setAuthError(error);
          setCurrentUser(null);
          setLoading(false);
        },
      );
    }

    initializeAuth();
    return () => { active = false; unsubscribe(); };
  }, []);

  const value = useMemo(() => ({ currentUser, loading, authError }), [currentUser, loading, authError]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { useEffect, useState } from "react";
import AuthContext from "./authContext";
import { signInWithGoogle, signOutUser, subscribeToAuth } from "../lib/auth";
import { clearSyncSession } from "../lib/secureSync";
import { isFirebaseConfigured } from "../lib/firebaseConfig";

export const AuthProvider = ({ children }) => {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(configured);
  const [authError, setAuthError] = useState(null);

  const applyAuthUser = (nextUser) => {
    setUser(nextUser);
    setAuthLoading(false);
    if (!nextUser) clearSyncSession();
  };

  useEffect(() => {
    if (!configured) return;
    let active = true;
    const unsubscribe = subscribeToAuth((nextUser) => {
      if (active) applyAuthUser(nextUser);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [configured]);

  const signIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      const code = error?.code || "";
      if (
        code !== "auth/popup-closed-by-user" &&
        code !== "auth/cancelled-popup-request"
      ) {
        setAuthError(error?.message || "Sign-in failed");
      }
    }
  };

  const signOut = async () => {
    clearSyncSession();
    try {
      await signOutUser();
    } catch (error) {
      setAuthError(error?.message || "Sign-out failed");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        authError,
        signIn,
        signOut,
        configured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

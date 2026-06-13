import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import supabase from "../lib/supabaseClient";
import { popupManager } from "../utils/popupManager";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLivePopup, setShowLivePopup] = useState(false);
  // ── NEW: track if the user was kicked out by a new login elsewhere
  const [sessionKicked, setSessionKicked] = useState(false);
  const fetchedEmailRef = useRef(null);
  const sessionCheckIntervalRef = useRef(null); // ── NEW

  const fetchRole = async (email) => {
    if (fetchedEmailRef.current === email) return;
    fetchedEmailRef.current = email;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("email", email)
      .single();
    setRole(data?.role || null);
  };

  // ── NEW: validate that this browser's session token is still the latest one
  const validateSession = useCallback(async () => {
    const email = localStorage.getItem("verto_user_email");
    const token = localStorage.getItem("verto_session_token");

    // If there's no token stored, nothing to validate (fresh page, not logged in)
    if (!email || !token) return;

    const { data, error } = await supabase.rpc("validate_session", {
      p_email: email,
      p_token: token,
    });

    if (error || !data?.valid) {
      // Another device has logged in — force sign out here
      clearInterval(sessionCheckIntervalRef.current);
      localStorage.removeItem("verto_session_token");
      localStorage.removeItem("verto_user_email");
      localStorage.removeItem("loginDate");
      setSessionKicked(true); // ── shows the "You've been signed out" screen
      await supabase.auth.signOut();
      fetchedEmailRef.current = null;
      popupManager.clearSession();
      setUser(null);
      setRole(null);
      setShowLivePopup(false);
    }
  }, []);

  // ── NEW: start polling every 30 seconds once logged in
  const startSessionPolling = useCallback(() => {
    clearInterval(sessionCheckIntervalRef.current);
    sessionCheckIntervalRef.current = setInterval(() => {
      validateSession();
    }, 3000);
  }, [validateSession]);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        await fetchRole(data.user.email);
        await validateSession(); // ── NEW: validate on first load too
        startSessionPolling();   // ── NEW: begin polling
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          clearInterval(sessionCheckIntervalRef.current); // ── NEW
          fetchedEmailRef.current = null;
          popupManager.clearSession();
          setUser(null);
          setRole(null);
          setShowLivePopup(false);
          return;
        }

        if (event === "SIGNED_IN" && session?.user) {
          popupManager.initializeSession(session.user.id);
          if (popupManager.shouldShowPopup()) {
            setShowLivePopup(true);
          }
          startSessionPolling(); // ── NEW: start polling on sign in
        }

        if (session?.user) {
          setUser(session.user);
          fetchRole(session.user.email);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
      clearInterval(sessionCheckIntervalRef.current); // ── NEW: cleanup
    };
  }, [validateSession, startSessionPolling]);

  const handleClosePopup = () => {
    popupManager.markPopupShown();
    setShowLivePopup(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        showLivePopup,
        sessionKicked,       // ── NEW: expose for App.jsx to show kicked screen
        setShowLivePopup: handleClosePopup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
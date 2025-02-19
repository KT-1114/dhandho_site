import React, { createContext, useContext, useEffect, useState } from "react";
import supabase from "../../utils/supabaseClient";
import Toast from "../Toast";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [userBusinessData, setUserBusinessData] = useState(null);
  const [toast, setToast] = useState({ show: false, type: "", message: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
          setSession(session);
          setUser(session.user);
          await getUserBusinessData(session.user.id);
        }
      } catch (error) {
        console.error("Error loading session:", error.message);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setLoading(true);
      if (session) {
        setSession(session);
        setUser(session.user);
        getUserBusinessData(session.user.id).finally(() => setLoading(false));
      } else {
        setSession(null);
        setUser(null);
        setUserBusinessData(null);
        setLoading(false);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const getUserBusinessData = async (userId) => {
    if (!userId) return setUserBusinessData(null);
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", userId)
      .single();

    if (error) console.error("Error fetching business data:", error.message);
    setUserBusinessData(data);
  };

  const employeeSignIn = async (email, password) => {
    const { data, error } = await supabase
      .from("employee_requests")
      .select("request_status, business_id")
      .eq("email", email)
      .single();

    if (data) {
      const { request_status, business_id } = data;
      if (request_status === "pending" || request_status === "rejected") {
        setToast({ show: true, type: "warning", message: `Your request for business ${business_id} is ${request_status}.` });
        return;
      }
      if (request_status === "approved") {
        window.location.href = "/create-password"; // Redirect without useNavigate
        return;
      }
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setToast({ show: true, type: "danger", message: signInError.message });
    }
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setToast({ show: true, type: "danger", message: error.message });
    } else {
      setSession(data.session);
      setUser(data.session.user);
      window.location.href = "/"; // Redirect to home after sign-in
    }
  };

  const businessSignUp = async (formData) => {
    const { email, password, ...metadata } = formData;
    const { data, error } = await supabase.auth.signUp({
      email: email || null,
      password,
      options: { data: { ...metadata, user_role: "Business Owner" } },
    });

    if (error) {
      setToast({ show: true, type: "danger", message: error.message });
    } else {
      setSession(data.session);
      setUser(data.session.user);
      window.location.href = "/"; // Redirect after sign-up
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserBusinessData(null);
    setToast({ show: true, type: "info", message: "Successfully signed out!" });
    window.location.href = "/rolePage"; // Redirect after sign-out
  };

  const handleToastClose = () => {
    setToast({ ...toast, show: false });
  };

  // Authentication object for external usage
  const authentication = {
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userBusinessData, signIn, businessSignUp, signOut, authentication }}>
      {children}
      <Toast type={toast.type} message={toast.message} show={toast.show} onClose={handleToastClose} />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;

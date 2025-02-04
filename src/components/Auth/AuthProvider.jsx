import React, { createContext, useContext, useEffect, useState } from "react";
import supabase from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import Toast from "../Toast";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userBusinessData, setUserBusinessData] = useState(null);
  const [toast, setToast] = useState({ show: false, type: "", message: "" });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
  
        if (session?.user) {
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
      if (session?.user) {
        setUser(session.user);
        getUserBusinessData(session.user.id);
      } else {
        setUser(null);
        setUserBusinessData(null);
      }
    });
  
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);
  
  const getUserBusinessData = async (userId) => {
    if (userId) {
      const { data, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id",userId)
        .single();
      if (businessError) throw businessError;

      setUserBusinessData(data);
    } else {
      setUserBusinessData(null);
    }

  }

  const employeeSignIn = async (email, password) => {
    const { data, error } = await supabase
      .from("employee_requests")
      .select("request_status, business_id")
      .eq("email", email)
      .single();
    if (data) {
      const { request_status, business_id } = data;

      if (request_status === "pending" || request_status === "rejected") {
        setToast({
          show: true,
          type: "warning",
          message: `Your request for business ${business_id} is ${request_status}.`,
        });
        return;
      }

      if (request_status === "approved") {
        navigate("/create-password", { state: { email } });
        return;
      }
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setToast({ show: true, type: "danger", message: signInError.message });
    }
  };

  const signIn = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setToast({ show: true, type: "danger", message: error.message });
    } else {
      navigate("/");
    }
  };

  const businessSignUp = async (formData) => {
    const { email, password, ...metadata } = formData;
    const { error } = await supabase.auth.signUp({
      email: email || null,
      password,
      options: { data: { ...metadata, user_role: "Business Owner" } },
    });

    if (error) {
      setToast({ show: true, type: "danger", message: error.message });
    } else {
      navigate("/");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserBusinessData(null);
    setToast({ show: true, type: "info", message: "Successfully signed out!" });
  };

  const handleToastClose = () => {
    setToast({ ...toast, show: false });
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, userBusinessData, signIn, businessSignUp, signOut }}
    >
      {children}
      <Toast
        type={toast.type}
        message={toast.message}
        show={toast.show}
        onClose={handleToastClose}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;

import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth(); // Check for `user` state
  const location = useLocation();


  if (loading) {
    // Show a loading spinner while the authentication state is loading
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-" role="status">
          <span className="visually-hidden"></span>
        </div>
      </div>
    );
  }

  return user ? (
    children // Render children (e.g., Home page) if authenticated
  ) : (
    <>
      <Navigate to="/rolePage" state={{ from: location }} />
    </>
  );
};

export default ProtectedRoute;

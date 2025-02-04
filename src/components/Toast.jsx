import React, { useEffect } from "react";

const Toast = ({
  type = "success",
  message,
  show,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose(); // Automatically close toast after the duration
      }, duration);

      return () => clearTimeout(timer); // Clean up the timer when component unmounts
    }
  }, [show, duration, onClose]);
  // Define toast classes for Bootstrap styling based on type
  const toastClasses = {
    success: "bg-success text-white",
    danger: "bg-danger text-white",
    warning: "bg-warning text-dark",
    info: "bg-info text-white",
  };

  return (
    <div
      className={`toast align-items-center ${
        show ? "show" : "hide"
      } position-fixed top-50 start-50 translate-middle m-3`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{ zIndex: 1050 }} // Optional: Ensures toast appears above other components
    >
      <div className={`toast-header ${toastClasses[type]}`}>
        <strong className="me-auto">
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </strong>
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onClose}
        ></button>
      </div>
      <div className="toast-body">{message}</div>
    </div>
  );
};

export default Toast;

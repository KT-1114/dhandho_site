import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo_white.png";
import Toast from "../components/Toast";
import { useAuth } from "../components/Auth/AuthProvider";
import '../styles/AuthStyles.css';

const EmployeeAuth = () => {
  const [steplogin, setSteplogin] = useState(1);
  const [stepsignup, setStepsignup] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [formType, setFormType] = useState("login"); // 'login', 'checkRequest', or 'signUp'
  const [isRequestApproved, setIsRequestApproved] = useState(false); // State for request approval
  const { signIn, checkRequest, employeeSignUp, newEmployeeSignUp } = useAuth();
  const navigate = useNavigate();

  // Toast state
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const handleNextlogin = () => {
    if (steplogin === 1) {
    }
    setSteplogin(steplogin + 1);
  };

  const handleNextsignup = () => {
    if (stepsignup === 1) {
      if (!firstName || !lastName || !phone) {
        setToast({
          show: true,
          message: "Please fill out all fields.",
          type: "danger",
        });
        return;
      }
    }

    if (stepsignup === 2) {
      if (!email || !businessId) {
        setToast({
          show: true,
          message: "Please fill out all fields.",
          type: "danger",
        });
        return;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setToast({
            show: true,
            message: "Please enter a valid email address.",
            type: "danger",
          });
          return;
        }
      }
    }

    setStepsignup(stepsignup + 1);
  };

  const handlePrevioussignup = () => setStepsignup(stepsignup - 1);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      await signIn({ email, password });
    } catch (error) {
      setToast({ show: true, message: error.message, type: "danger" });
    }
  };

  const handleCheckRequestSubmit = async (e) => {
    e.preventDefault();
    const request = await checkRequest({ email });
    
    if (request) {
      if (request.request_status === "approved") {
        setIsRequestApproved(true);
        setFirstName(request.first_name);
        setLastName(request.last_name);
        setPhone(request.phone);
        setBusinessId(request.business_id);
      } else {
        setToast({
          show: true,
          type: "info",
          message: `The request status is: ${request.request_status}`,
        });
      }
    } else {
      // Handle the case where no request was found (no request or valid data)
      setToast({
        show: true,
        type: "warning",
        message: "No request found for the provided email.",
      });
    }
  };
  
  
  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setToast({
        show: true,
        message: "Passwords do not match.",
        type: "danger",
      });
      return;
    }
    employeeSignUp({
      firstName,
      lastName,
      email,
      password,
      phone,
      businessId,
    });
  };

  const handleNewSignUpSubmit = (e) => {
    e.preventDefault();
    newEmployeeSignUp({
      firstName,
      lastName,
      email,
      phone,
      businessId,
    });
  };

  const closeToast = () => setToast({ ...toast, show: false });

  return (
    <>
      <div className="main">
        <button
          className="back-anchor-container  border rounded-5"
          onClick={() => {
            navigate("/rolePage");
          }}
        >
          <i className="bx bx-arrow-back"></i>
          Back
        </button>
        <div className={`wrapper ${formType === "signUp" ? "active" : ""}`}>
          <Toast {...toast} onClose={closeToast} />
          <span className="rotate-bg"></span>
          <span className="rotate-bg2"></span>
          <div className="form-box login">
            <form onSubmit={handleLoginSubmit}>
              {steplogin === 1 && (
                <>
                  <h2
                    className="title animation"
                    style={{ "--i": 1, "--j": 21 }}
                  >
                    Login
                  </h2>
                  <div
                    className="input-box animation"
                    style={{ "--i": 2, "--j": 22 }}
                  >
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <label>Email</label>
                    <i className="bx bxs-envelope"></i>
                  </div>

                  <div
                    className="input-box animation"
                    style={{ "--i": 3, "--j": 23 }}
                  >
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <label>Password</label>
                    <i className="bx bxs-lock-alt"></i>
                  </div>

                  <button
                    type="submit"
                    className="animation manual-btn"
                    style={{
                      "--i": 4,
                      "--j": 24,
                    }}
                  >
                    Login
                  </button>

                  <div
                    className="linkTxt animation"
                    style={{ "--i": 5, "--j": 25 }}
                  >
                    <p>
                      Don't have an account?{" "}
                      <a
                        href="#"
                        className="register-link"
                        onClick={(e) => {
                          e.preventDefault();
                          setFormType("signUp");
                        }}
                      >
                        Sign Up
                      </a>
                    </p>
                  </div>

                  <div
                    className="linkTxt animation"
                    style={{ "--i": 6, "--j": 26 }}
                  >
                    <p>
                      Already sent a request?&nbsp;
                      <a
                        href="#"
                        className="register-link"
                        onClick={(e) => {
                          e.preventDefault();
                          setFormType("checkRequest");
                          handleNextlogin(2);
                        }}
                      >
                        Check Request
                      </a>
                    </p>
                  </div>
                </>
              )}
            </form>

            {formType === "checkRequest" && (
              <>
                <div className="" style={{ marginTop: 50 }}>
                  <h2 style={{ position: "relative" }} className="title">
                    Check Request
                  </h2>
                  <form onSubmit={handleCheckRequestSubmit}>
                    {!isRequestApproved && (
                      <>
                        <div className="input-box">
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                          <label>Email</label>
                          <i className="bx bxs-envelope"></i>
                        </div>
                        <button type="submit" className="manual-btn">
                          Check
                        </button>

                        <div className="linkTxt">
                          <p>
                            Already have an account?{" "}
                            <a
                              href="#"
                              className="login-link"
                              onClick={(e) => {
                                e.preventDefault();
                                setFormType("login");
                                setSteplogin(1);
                              }}
                            >
                              Login
                            </a>
                          </p>
                        </div>
                      </>
                    )}
                  </form>

                  <form onSubmit={handleSignUpSubmit}>
                    {isRequestApproved && (
                      <>
                        <div className="input-box">
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                          <label>Email</label>
                          <i className="bx bxs-envelope"></i>
                        </div>

                        <div className="input-box">
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <label>Password</label>
                          <i className="bx bxs-lock-alt"></i>
                        </div>

                        <div className="input-box">
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                          <label>Confirm Password</label>
                          <i className="bx bxs-lock-alt"></i>
                        </div>

                        <button type="submit" className="manual-btn">
                          Submit
                        </button>

                        <div className="linkTxt">
                          <p>
                            Already have an account?{" "}
                            <a
                              href="#"
                              className="login-link"
                              onClick={(e) => {
                                e.preventDefault();
                                setFormType("login");
                                setSteplogin(1);
                              }}
                            >
                              Login
                            </a>
                          </p>
                        </div>
                      </>
                    )}
                  </form>
                </div>
              </>
            )}
          </div>

          <div className="info-text login">
            <div
              style={{ "--i": 1, "--j": 21, marginLeft: -40, marginTop: -20 }}
              className="animation"
            >
              <h2>Welcome Back To</h2>
              <img src={logo} height={"90px"} alt="Logo" />
            </div>
          </div>

          <div className="form-box register">
            <h2 className="title animation" style={{ "--i": 17, "--j": 0 }}>
              Sign Up
            </h2>

            <form onSubmit={handleNewSignUpSubmit}>
              {stepsignup === 1 && (
                <>
                  <div
                    className="input-box animation"
                    style={{ "--i": 18, "--j": 1 }}
                  >
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <label>First Name</label>
                    <i className="bx bxs-user"></i>
                  </div>

                  <div
                    className="input-box animation"
                    style={{ "--i": 19, "--j": 2 }}
                  >
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                    <label>Last Name</label>
                    <i className="bx bxs-user"></i>
                  </div>

                  <div
                    className="input-box animation"
                    style={{ "--i": 20, "--j": 3 }}
                  >
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <label>Phone</label>
                    <i className="bx bxs-phone"></i>
                  </div>

                  <button
                    type="button"
                    className="animation manual-btn"
                    onClick={handleNextsignup}
                    style={{
                      "--i": 21,
                      "--j": 4,
                    }}
                  >
                    Next
                  </button>

                  <div
                    className="linkTxt animation"
                    style={{ "--i": 22, "--j": 5 }}
                  >
                    <p>
                      Already have an account?{" "}
                      <a
                        href="#"
                        className="login-link"
                        onClick={(e) => {
                          e.preventDefault();
                          setFormType("login");
                        }}
                      >
                        Login
                      </a>
                    </p>
                  </div>
                </>
              )}
              {stepsignup === 2 && (
                <>
                  <div
                    className="input-box animation"
                    style={{ "--i": 18, "--j": 1 }}
                  >
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <label>Email</label>
                    <i className="bx bxs-envelope"></i>
                  </div>

                  <div
                    className="input-box animation"
                    style={{ "--i": 19, "--j": 2 }}
                  >
                    <input
                      type="text"
                      required
                      value={businessId}
                      onChange={(e) => setBusinessId(e.target.value)}
                    />
                    <label>Business ID</label>
                    <i className="bx bxs-lock-alt"></i>
                  </div>

                  <div
                    className="w-300 alert alert-secondary animation"
                    role="alert"
                    style={{
                      "--i": 20,
                      "--j": 3,
                      width: 300,
                      border: 0,
                      position: "relative",
                      left: -13,
                      padding: 10,
                      marginBottom: 12,
                    }}
                  >
                    NOTE: This will only send an approval request to the
                    business having the public id you enter.
                  </div>

                  <div className="btn btn-div">
                    <button
                      type="button"
                      className="animation manual-btn"
                      onClick={handlePrevioussignup}
                      style={{
                        "--i": 21,
                        "--j": 4,
                        width: 137.5,
                      }}
                    >
                      Back
                    </button>

                    <button
                      type="submit"
                      className="animation manual-btn"
                      style={{
                        "--i": 22,
                        "--j": 5,
                        width: 137.5,
                      }}
                    >
                      Submit
                    </button>
                  </div>

                  <div
                    className="linkTxt animation"
                    style={{ "--i": 23, "--j": 6, marginBottom: 0 }}
                  >
                    <p>
                      Already have an account?{" "}
                      <a
                        href="#"
                        className="login-link"
                        onClick={(e) => {
                          e.preventDefault();
                          setFormType("login");
                        }}
                      >
                        Login
                      </a>
                    </p>
                  </div>
                </>
              )}
            </form>
          </div>

          <div className="info-text register">
            <h2
              className="animation"
              style={{ "--i": 17, "--j": 0, width: 250 }}
            >
              Welcome To
              <img src={logo} height={"90px"} alt="Logo" />
            </h2>
            <p className="animation" style={{ "--i": 18, "--j": 1 }}>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeAuth;

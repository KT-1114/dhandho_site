import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo_white.png";
import Toast from "../components/Toast";
import { useAuth } from "../components/Auth/AuthProvider";
import { Campaign } from "@mui/icons-material";

const BusinessAuth = () => {
  const [step, setStep] = useState(1);
  const [formType, setFormType] = useState("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessContact, setBusinessContact] = useState("");
  const [businessSlogan, setBusinessSlogan] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const { businessSignUp, signIn } = useAuth();
  const navigate = useNavigate();

  // Toast state
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const handleNext = () => {
    if (step === 1) {
      if (!firstName || !lastName || !phone) {
        setToast({
          show: true,
          message: "Please fill out all fields.",
          type: "danger",
        });
        return;
      }
    }

    if (step === 2) {
      if (!email || !password || !confirmPassword) {
        setToast({
          show: true,
          message: "Please fill out all fields.",
          type: "danger",
        });
        return;
      }
      if (password !== confirmPassword) {
        setToast({
          show: true,
          message: "Passwords do not match.",
          type: "danger",
        });
        return;
      }
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

    if (step === 3) {
      if (!businessName || !businessSlogan || !businessEmail) {
        setToast({
          show: true,
          message: "Please fill out all business details.",
          type: "danger",
        });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(businessEmail)) {
        setToast({
          show: true,
          message: "Please enter a valid business email address.",
          type: "danger",
        });
        return;
      }
    }

    if (step === 4) {
      if (!businessContact || !businessAddress) {
        setToast({
          show: true,
          message: "Please fill out all fields.",
          type: "danger",
        });
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrevious = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formType == "login") {
      try {
        await signIn({ email, password });
      } catch (error) {
        setToast({ show: true, message: error.message, type: "danger" });
      }
    } else {
      try {
        await businessSignUp({
          firstName,
          lastName,
          email,
          password,
          phone,
          businessName,
          businessContact,
          businessEmail,
          businessSlogan,
          businessAddress,
        });
        setToast({
          show: true,
          message: "Successfully signed up!",
          type: "success",
        });
        navigate("/");
      } catch (error) {
        setToast({ show: true, message: error.message, type: "danger" });
      }
    }
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
        <div className={`wrapper ${formType === "signup" ? "active" : ""}`}>
          <Toast {...toast} onClose={closeToast} />
          <span className="rotate-bg"></span>
          <span className="rotate-bg2"></span>
          <div className="form-box login">
            <h2 className="title animation" style={{ "--i": 1, "--j": 21 }}>
              Login
            </h2>

            <form onSubmit={handleSubmit}>
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
                      setFormType("signup");
                    }}
                  >
                    Sign Up
                  </a>
                </p>
              </div>
            </form>
          </div>

          <div className="info-text login">
            <div
              style={{ "--i": 1, "--j": 21, marginLeft: -40, marginTop: -20 }}
              className="animation"
            >
              <h2>Welcome Back To</h2>
              <img src={logo} height={"90px"} alt="Logo" />
            </div>
            <p className="animation" style={{ "--i": 1, "--j": 21 }}></p>
          </div>

          <div className="form-box register">
            <h2 className="title animation" style={{ "--i": 17, "--j": 0 }}>
              Sign Up
            </h2>

            <form action="#" onSubmit={handleSubmit}>
              {step === 1 && (
                <>
                  <div //
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
                    onClick={handleNext}
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
              {step === 2 && (
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
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <label>Password</label>
                    <i className="bx bxs-lock-alt"></i>
                  </div>

                  <div
                    className="input-box animation"
                    style={{ "--i": 20, "--j": 3 }}
                  >
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <label>Confirm Password</label>
                    <i className="bx bxs-lock-alt"></i>
                  </div>
                  <div className="btn btn-div">
                    <button
                      type="button"
                      className="animation manual-btn"
                      onClick={handlePrevious}
                      style={{
                        "--i": 21,
                        "--j": 4,
                        width: 137.5,
                      }}
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      className="animation manual-btn"
                      onClick={handleNext}
                      style={{
                        "--i": 22,
                        "--j": 5,
                        width: 137.5,
                      }}
                    >
                      Next
                    </button>
                  </div>

                  <div
                    className="linkTxt animation"
                    style={{ "--i": 23, "--j": 6 }}
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

              {step === 3 && (
                <>
                  <div
                    className="input-box animation"
                    style={{ "--i": 18, "--j": 1 }}
                  >
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                    <label>Business Name</label>
                    <i className="bx bxs-briefcase"></i>
                  </div>

                  <div
                    className="input-box animation"
                    style={{ "--i": 19, "--j": 2 }}
                  >
                    <input
                      type="text"
                      required
                      value={businessSlogan}
                      onChange={(e) => setBusinessSlogan(e.target.value)}
                    />
                    <label>Business Slogan</label>
                    <i>
                      <Campaign />
                    </i>
                  </div>

                  <div
                    className="input-box animation"
                    style={{ "--i": 20, "--j": 3 }}
                  >
                    <input
                      type="email"
                      required
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                    />
                    <label>Business Email</label>
                    <i className="bx bxs-envelope"></i>
                  </div>

                  <div className="btn btn-div">
                    <button
                      type="button"
                      className="animation manual-btn"
                      onClick={handlePrevious}
                      style={{
                        "--i": 21,
                        "--j": 4,
                        width: 137.5,
                      }}
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      className="animation manual-btn"
                      onClick={handleNext}
                      style={{
                        "--i": 22,
                        "--j": 5,
                        width: 137.5,
                      }}
                    >
                      Next
                    </button>
                  </div>
                  <div
                    className="linkTxt animation"
                    style={{ "--i": 23, "--j": 6 }}
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

              {step === 4 && (
                <>
                  <div
                    className="input-box animation"
                    style={{ "--i": 18, "--j": 1 }}
                  >
                    <input
                      type="text"
                      required
                      value={businessContact}
                      onChange={(e) => setBusinessContact(e.target.value)}
                    />
                    <label>Business Contact</label>
                    <i className="bx bxs-phone"></i>
                  </div>

                  <div
                    className="input-box animation"
                    style={{ "--i": 19, "--j": 2 }}
                  >
                    <input
                      type="text"
                      required
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                    />
                    <label>Business Address</label>
                    <i className="bx bxs-map"></i>
                  </div>

                  <div className="btn btn-div">
                    <button
                      type="button"
                      className="animation manual-btn"
                      onClick={handlePrevious}
                      style={{
                        "--i": 20,
                        "--j": 3,
                        width: 137.5,
                      }}
                    >
                      Back
                    </button>

                    <button
                      type="submit"
                      className="animation manual-btn"
                      style={{
                        "--i": 21,
                        "--j": 4,
                        width: 137.5,
                      }}
                    >
                      Submit
                    </button>
                  </div>
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
            <p className="animation" style={{ "--i": 18, "--j": 1 }}></p>
          </div>
        </div>
      </div>
    </>
  );
};

export default BusinessAuth;

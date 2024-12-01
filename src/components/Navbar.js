import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import {
  FaHome,
  FaBox,
  FaList,
  FaSignInAlt,
  FaWarehouse,
} from "react-icons/fa";
import { MdInventory } from "react-icons/md";
import { ImMakeGroup } from "react-icons/im";
import logo from "../assets/Dhandho_white_crop.png";
// import BusinessSearch from "./BusinessSearch";

function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const [hoveredIndex, setHoveredIndex] = useState(null);

  const handleLogout = () => {
    signOut();
  };

  const navItemStyle = (path) => {
    const isActive = location.pathname === path;
    const isHovered = hoveredIndex === path;

    return {
      position: "relative",
      color: "white",
      textDecoration: "none",
      display: "inline-block",
      overflow: "hidden",
      borderRadius: "0.25rem",
      transition: "color 0.3s ease",
      backgroundColor:
        isActive || isHovered ? "rgba(0, 0, 0, 0)" : "transparent", // Make background transparent to show gradient border
      boxShadow:
        isActive || isHovered
          ? "0 0 1px 2px rgba(223, 91, 211, 0.6), 0 0 2px 4px rgba(126, 91, 246, 0.6)"
          : "none",
      zIndex: 1, // Ensure the gradient appears above other elements
    };
  };

  return (
    <nav className="navbar navbar-expand navbar-dark border-bottom border-secondary border-5 bg-black">
      <a className="navbar-brand align-items-center" href="#">
        <img src={logo} height={"25px"} alt="Logo" />
      </a>
      <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarNavAltMarkup"
        aria-controls="navbarNavAltMarkup"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
        <ul className="navbar-nav ml-auto">
          <li
            className="nav-item align-items-center me-3 rounded"
            style={navItemStyle("/")}
            onMouseEnter={() => setHoveredIndex("/")}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <Link className="nav-link" to="/">
              <FaHome className="me-2" /> Home
            </Link>
          </li>
          <li
            className="nav-item align-items-center me-3 rounded"
            style={navItemStyle("/Products")}
            onMouseEnter={() => setHoveredIndex("/Products")}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <Link className="nav-link" to="/Products">
              <FaBox className="me-2" /> Products
            </Link>
          </li>
          <li
            className="nav-item align-items-center me-3 rounded"
            style={navItemStyle("/Orders")}
            onMouseEnter={() => setHoveredIndex("/Orders")}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <Link className="nav-link" to="/Orders">
              <FaList className="me-2" /> Orders
            </Link>
          </li>
          <li
            className="nav-item align-items-center me-3 rounded "
            style={navItemStyle("/Connections")}
            onMouseEnter={() => setHoveredIndex("/Connections")}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <Link className="nav-link" to="/Connections">
              <ImMakeGroup className="me-2" /> Connections
            </Link>
          </li>
        </ul>
      </div>
      <div className="d-flex align-items-center ml-auto">
        {user && (
          <>
            <span className="text-white">{user.user_metadata.first_name} { user.user_metadata.last_name}</span>
            <button className="btn text-white" onClick={handleLogout}>
              <FaSignInAlt className="me-2" />
            </button>
          </>
        )}
      </div>
      <div>{/* <BusinessSearch /> */}</div>
    </nav>
  );
}

export default Navbar;

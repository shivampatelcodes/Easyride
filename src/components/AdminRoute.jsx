/* eslint-disable no-unused-vars */
import React from "react";
import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // assume you have an auth context that holds user data

const AdminRoute = ({ children }) => {
  const { user } = useAuth(); // user should include role info

  if (!user || user.role !== "admin") {
    // Redirect non-admin users
    return <Navigate to="/" replace />;
  }
  return children;
};

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminRoute;

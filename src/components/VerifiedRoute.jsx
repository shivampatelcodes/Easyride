import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import PropTypes from "prop-types";

const VerifiedRoute = ({ children, skipVerificationCheck = false }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsEmailVerified(user?.emailVerified || false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (!isEmailVerified && !skipVerificationCheck) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
};

VerifiedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  skipVerificationCheck: PropTypes.bool,
};

export default VerifiedRoute;

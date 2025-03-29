import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import PropTypes from "prop-types";

const VerifiedRoute = ({ children }) => {
  const auth = getAuth();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setChecking(false);
    });
    return unsubscribe;
  }, [auth]);

  if (checking) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
};

VerifiedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default VerifiedRoute;

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { app } from "../firebaseConfig";
import PropTypes from "prop-types";

const VerifiedRoute = ({ children }) => {
  // Use the app instance from your firebaseConfig
  const auth = getAuth(app);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  console.log("VerifiedRoute: Component rendered");

  useEffect(() => {
    console.log("VerifiedRoute: Starting auth listener");
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      console.log("VerifiedRoute: onAuthStateChanged callback", currentUser);
      setUser(currentUser);
      setChecking(false);
    });
    return () => {
      console.log("VerifiedRoute: Unsubscribing auth listener");
      unsubscribe();
    };
  }, [auth]);

  if (checking) {
    console.log("VerifiedRoute: Still checking auth state");
    return <div>Loading... (VerifiedRoute)</div>;
  }

  if (!user) {
    console.log("VerifiedRoute: No user detected, redirecting");
    return <Navigate to="/signin" replace />;
  }

  console.log("VerifiedRoute: User detected", user);
  return children;
};

VerifiedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default VerifiedRoute;

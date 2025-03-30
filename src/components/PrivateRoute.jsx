/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { app } from "../firebaseConfig";
import PropTypes from "prop-types";

const PrivateRoute = ({ children }) => {
  const auth = getAuth(app);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  console.log("PrivateRoute: Component rendered");

  useEffect(() => {
    console.log("PrivateRoute: Starting auth listener");
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      console.log("PrivateRoute: onAuthStateChanged callback", currentUser);
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  if (loading) {
    console.log("PrivateRoute: Loading state");
    return (
      <div
        style={{
          padding: "2rem",
          backgroundColor: "#f0f0f0",
          textAlign: "center",
        }}
      >
        Loading... (PrivateRoute)
      </div>
    );
  }

  if (!user) {
    console.log("PrivateRoute: No user detected, redirecting to /signin");
    return (
      <div
        style={{
          padding: "2rem",
          backgroundColor: "#ffdddd",
          textAlign: "center",
        }}
      >
        Redirecting to signin...
      </div>
    );
    // return <Navigate to="/signin" replace />;
  }

  console.log("PrivateRoute: User detected", user);
  return <>{children}</>;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PrivateRoute;

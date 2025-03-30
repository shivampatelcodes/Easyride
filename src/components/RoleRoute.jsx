/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Navigate, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../firebaseConfig";

const auth = getAuth(app);
const db = getFirestore(app);

const RoleRoute = ({ children, allowedRoles }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);
          }
        } catch (error) {
          console.error("Error getting user role:", error);
        }
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // If not logged in, redirect to sign in
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // If no role specified or role is allowed, show the children
  if (!userRole || allowedRoles.includes(userRole)) {
    return children;
  }

  // If they have a role but it's not allowed, redirect to their appropriate dashboard
  if (userRole === "driver") {
    return <Navigate to="/driver-dashboard" replace />;
  } else if (userRole === "admin") {
    return <Navigate to="/admin-dashboard" replace />;
  } else {
    // Default fallback
    return <Navigate to="/dashboard" replace />;
  }
};

RoleRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
  children: PropTypes.node.isRequired,
};

export default RoleRoute;

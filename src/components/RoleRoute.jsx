import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../firebaseConfig";

const auth = getAuth(app);
const db = getFirestore(app);

const RoleRoute = ({ allowedRoles, children }) => {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        }
      }
      setLoading(false);
    };
    fetchRole();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!allowedRoles.includes(role)) {
    // Redirect to dashboard appropriate to their role
    return role === "driver" ? (
      <Navigate to="/driver-dashboard" replace />
    ) : (
      <Navigate to="/dashboard" replace />
    );
  }
  return children;
};

RoleRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
  children: PropTypes.node.isRequired,
};

export default RoleRoute;

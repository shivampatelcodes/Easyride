import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { Navigate, useLocation } from "react-router-dom";
import { app } from "../firebaseConfig";

const auth = getAuth(app);
const db = getFirestore(app);

const ProfileCompleteRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const location = useLocation();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("User Data:", data);
          // For drivers, assume profile is complete; for passengers, optionally check required fields.
          if (data.role && data.role.toLowerCase() === "driver") {
            setProfileComplete(true);
          } else if (data.role && data.role.toLowerCase() === "passenger") {
            setProfileComplete(true);
          } else {
            setProfileComplete(!!(data.fullName && data.phone && data.address));
          }
        } else {
          setProfileComplete(false);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/signin" replace />;
  if (!profileComplete && location.pathname !== "/settings") {
    return <Navigate to="/settings" replace />;
  }
  return children;
};

ProfileCompleteRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProfileCompleteRoute;

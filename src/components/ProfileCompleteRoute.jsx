/* eslint-disable no-unused-vars */
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
  const [userRole, setUserRole] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.fullName && data.phone && data.address) {
            setProfileComplete(true);
          } else {
            setProfileComplete(false);
          }
          // Set userRole from Firestore          }
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

  // Force incomplete profiles to "/settings"
  if (!profileComplete && location.pathname !== "/settings") {
    // Optionally, allow passengers to proceed despite incomplete profiles:
    if (userRole === "passenger") {
      // You might log a warning here or prompt them later in the dashboard
      return children;
    }
    return (
      <Navigate
        to="/settings"
        replace
        state={{ message: "Please complete your profile before continuing." }}
      />
    );
  }

  return children;
};

ProfileCompleteRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProfileCompleteRoute;

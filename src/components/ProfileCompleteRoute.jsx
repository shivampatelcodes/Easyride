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
          // Require fullName, phone, and address for all roles
          if (data.fullName && data.phone && data.address) {
            setProfileComplete(true);
          } else {
            setProfileComplete(false);
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

  // Force incomplete profiles to "/settings"
  if (!profileComplete && location.pathname !== "/settings") {
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

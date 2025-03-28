import { Navigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import PropTypes from "prop-types";

const VerifiedRoute = ({ children }) => {
  const auth = getAuth();
  const user = auth.currentUser;
  // If no user or if email is not verified, redirect to /verify-email
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
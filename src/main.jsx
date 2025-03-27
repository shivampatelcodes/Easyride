/* eslint-disable no-unused-vars */
import React, { createContext, StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { auth } from "./firebaseConfig";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext";

export const AuthContext = createContext(null);
const db = getFirestore();

const RootComponent = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Check if the corresponding user document exists in Firestore.
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) {
          // If no record is found, sign out the user.
          await signOut(auth);
          setUser(null);
        } else {
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <StrictMode>
      <ThemeProvider>
        <AuthContext.Provider value={user}>
          <App />
        </AuthContext.Provider>
      </ThemeProvider>
    </StrictMode>
  );
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase"; // Adjust the path based on your setup
import { getFirestore, doc, getDoc } from "firebase/firestore";
import './login.css'; // Importing CSS file

const db = getFirestore();

const Login = ({ setUserRole, setUserName }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null); // Added state for error handling

  const handleLogin = async () => {
    try {
      // First, sign in the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch the user document from Firestore based on user UID
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;
        const userName = userData.displayName;

        if (userRole) {
          setUserRole(userRole); // Set the role if it exists
        } else {
          setError("No role assigned to this user."); // Set error message
          return;
        }

        if (userName) {
          setUserName(userName); // Set the username (displayName) if it exists
        } else {
          setError("No username assigned to this user."); // Set error message
          return;
        }
      } else {
        setError("User document not found."); // Set error message
        return;
      }
    } catch (error) {
      console.error("Login failed:", error);
      setError("Login failed. Check your credentials."); // Set error message
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Нэвтрэх</h2>
        {error && <div className="error">{error}</div>} {/* Display error if there is any */}
        <input
          type="email"
          placeholder="Имэйл хаяг"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
        <input
          type="password"
          placeholder="Нууц үг"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
        <button onClick={handleLogin} className="login-btn">Нэвтрэх</button>
      </div>
    </div>
  );
};

export default Login;

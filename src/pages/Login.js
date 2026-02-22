// src/pages/Login.js
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { ref, get } from "firebase/database";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (auth.currentUser && role) {
      role === "donor" ? navigate("/dashboard") : navigate("/request");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      const uid = userCredential.user.uid;

      const snap = await get(ref(db, `users/${uid}`));
      if (!snap.exists()) throw new Error("User profile not found!");

      const userData = snap.val();
      localStorage.setItem("role", userData.role);
      alert("✅ Login successful!");
      userData.role === "donor" ? navigate("/dashboard") : navigate("/request");

    } catch (err) {
      console.error(err);
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email) return alert("Please enter your email first!");
    try {
      await sendPasswordResetEmail(auth, form.email);
      alert("📧 Password reset email sent!");
    } catch (err) {
      console.error(err);
      alert("❌ " + err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-400 to-red-600">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-red-700">🩸 SmartBlood Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-red-400"/>
          <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-red-400"/>
          <button type="submit" disabled={loading} className="w-full bg-red-600 text-white py-3 rounded-md font-semibold hover:bg-red-700 transition disabled:opacity-60">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-right text-sm mt-2">
          <button onClick={handleForgotPassword} className="text-blue-600 hover:underline">Forgot Password?</button>
        </p>
        <p className="text-center text-sm mt-4 text-gray-800">
          Don’t have an account? <Link to="/register" className="text-red-700 font-semibold hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}

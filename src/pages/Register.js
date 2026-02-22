// src/pages/Register.js
import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "donor", blood: "", phone: "", location: "", dob: "", lastDonation: "", notes: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = userCredential.user.uid;

      await set(ref(db, `users/${uid}`), {
        name: form.name, email: form.email, role: form.role, blood: form.blood, phone: form.phone, location: form.location,
        dob: form.dob, lastDonation: form.role === "donor" ? form.lastDonation : "", notes: form.role === "donor" ? form.notes : "", donations: 0
      });

      localStorage.setItem("role", form.role);
      alert("✅ Registration successful!");
      form.role === "donor" ? navigate("/dashboard") : navigate("/request");

    } catch (err) {
      console.error(err);
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-400 to-red-600">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-red-700">🩸 SmartBlood Register</h1>
        <form onSubmit={handleRegister} className="space-y-3">
          <input type="text" placeholder="Full Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-red-400"/>
          <input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-red-400"/>
          <input type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-red-400"/>
          <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-red-400">
            <option value="">Select Role</option><option value="donor">Donor</option><option value="patient">Patient</option>
          </select>
          <select value={form.blood} onChange={e=>setForm({...form,blood:e.target.value})} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-red-400">
            <option value="">Select Blood Group</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="O+">O+</option><option value="O-">O-</option><option value="AB+">AB+</option><option value="AB-">AB-</option>
          </select>
          <input type="text" placeholder="Phone Number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-red-400"/>
          <input type="text" placeholder="City / Location" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-red-400"/>
          <input type="text" placeholder="Date of Birth" value={form.dob} onFocus={e=>e.target.type="date"} onBlur={e=>!e.target.value&&(e.target.type="text")} onChange={e=>setForm({...form,dob:e.target.value})} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-red-400"/>
          {form.role==="donor"&&<>
            <input type="text" placeholder="Last Donation Date" value={form.lastDonation} onFocus={e=>e.target.type="date"} onBlur={e=>!e.target.value&&(e.target.type="text")} onChange={e=>setForm({...form,lastDonation:e.target.value})} className="w-full p-3 border rounded-md focus:ring-2 focus:ring-red-400"/>
            <textarea placeholder="Health Notes / Conditions" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full p-3 border rounded-md focus:ring-2 focus:ring-red-400"/>
          </>}
          <button type="submit" disabled={loading} className="w-full bg-red-600 text-white py-3 rounded-md font-semibold hover:bg-red-700 transition disabled:opacity-60">{loading?"Registering...":"Register"}</button>
        </form>
        <p className="text-center text-sm mt-4 text-gray-800">Already have an account? <Link to="/login" className="text-red-700 font-semibold hover:underline">Login here</Link></p>
      </div>
    </div>
  );
}

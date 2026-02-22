import { useState, useEffect } from "react";
import { ref, push, serverTimestamp, query, orderByChild, equalTo, get } from "firebase/database";
import { collection, addDoc,  getDocs,  where } from "firebase/firestore";
import { auth, db } from "../firebase";  // ✅ use dbRealtime

export default function RequestBlood() {
  const [formData, setFormData] = useState({
    name: "",
    blood: "",
    units: "",
    location: "",
    urgency: "Medium",
    contact: "",
    notes: "",
    date: "",
  });
  const [loading, setLoading] = useState(false);

  // Auto-fill from user profile
  useEffect(() => {
    if (auth.currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: auth.currentUser.displayName || "",
        contact: auth.currentUser.phoneNumber || auth.currentUser.email || "",
      }));
    }
  }, []);

  // Detect fake/suspicious requests
  const detectFakeRequest = async (blood, contact, units) => {
    try {
      const requestsRef = ref(db, "requests");
      const q = query(requestsRef, orderByChild("contact"), equalTo(contact));
      const snapshot = await get(q);

      let suspicious = false;

      if (snapshot.exists()) {
        const requests = snapshot.val();
        const recent = Object.values(requests).filter((r) => {
          const createdAt = r.createdAt || 0;
          return Date.now() - createdAt < 1000 * 60 * 60; // last 1 hr
        });

        if (recent.length >= 3) suspicious = true; // too many requests
        if (recent.some((r) => r.blood === blood && r.units === units)) suspicious = true; // duplicate
      }

      if (parseInt(units) > 5) suspicious = true; // unrealistic

      return suspicious;
    } catch (err) {
      console.error("Error detecting fake request:", err);
      return false;
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.blood || !formData.units || !formData.location || !formData.contact) {
      alert("Please fill all required fields!");
      return;
    }
    if (isNaN(formData.units)) {
      alert("Units must be numeric!");
      return;
    }

    setLoading(true);
    try {
      const suspicious = await detectFakeRequest(formData.blood, formData.contact, formData.units);

      const requestsRef = ref(db, "requests");
      await push(requestsRef, {
        ...formData,
        units: parseInt(formData.units),
        createdAt: Date.now(),
        suspicious,
      });
      // 🔔 Send notification to matching donors (Firestore collection)
try {
  const donorsSnap = await getDocs(
    query(collection(db, "donors"), where("blood", "==", formData.blood))
  );

  donorsSnap.forEach(async (donorDoc) => {
    await addDoc(collection(db, "donors", donorDoc.id, "notifications"), {
      message: `New blood request from ${formData.name} (${formData.blood})`,
      location: formData.location,
      urgency: formData.urgency,
      requestUnits: formData.units,
      read: false,
      timestamp: serverTimestamp(),
    });
  });
} catch (err) {
  console.error("Error sending notifications:", err);
}


      alert(suspicious ? "⚠️ Request submitted but flagged as suspicious." : "✅ Request submitted successfully!");
      setFormData({
        name: formData.name,
        blood: "",
        units: "",
        location: "",
        urgency: "Medium",
        contact: formData.contact,
        notes: "",
        date: "",
      });
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("❌ Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6">🩸 Request Blood</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
  type="text"
  placeholder="Name"
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  className="w-full p-2 border rounded"
/>


        <select
          value={formData.blood}
          onChange={(e) => setFormData({ ...formData, blood: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select Blood Group</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>

        <input
          type="number"
          placeholder="Units required"
          value={formData.units}
          onChange={(e) => setFormData({ ...formData, units: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="text"
          placeholder="Hospital / Location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />

        <select
          value={formData.urgency}
          onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
          className="w-full p-2 border rounded"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <input
          type="text"
          value={formData.contact}
          readOnly
          className="w-full p-2 border rounded bg-gray-100"
        />

        <textarea
          placeholder="Additional notes / message"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full p-2 border rounded"
        ></textarea>

        <input
  type="date"
  value={formData.date}
  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
  className="w-full p-2 border rounded"
/>


        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}

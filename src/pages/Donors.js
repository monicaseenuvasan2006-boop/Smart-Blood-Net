// src/pages/Donors.js
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import LogoutButton from "../components/LogoutButton";
import { ref, onValue, push } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";

// Haversine formula to calculate distance in km
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function Donors({ requiredBloodGroup = null, userLocation = null }) {
  const [user] = useAuthState(auth);
  const [donors, setDonors] = useState([]);
  const [requested, setRequested] = useState([]);

  useEffect(() => {
    const donorsRef = ref(db, "users/");
    onValue(donorsRef, (snap) => {
      if (snap.exists()) {
        const allDonors = Object.entries(snap.val()).map(([uid, d]) => ({ uid, ...d }));
        setDonors(allDonors);
      }
    });

    const requestsRef = ref(db, "donorRequests/");
    onValue(requestsRef, (snap) => {
      if (snap.exists()) {
        const sent = Object.values(snap.val())
          .filter(r => r.from === user?.uid)
          .map(r => r.to);
        setRequested(sent);
      }
    });
  }, [user]);

const sendRequest = async (donor) => {
  if (!user || !donor?.uid) return;

  try {
    // 1️⃣ Push the donor request
    await push(ref(db, "donorRequests/"), {
      from: user.uid,
      to: donor.uid,
      status: "pending",
      createdAt: Date.now(),
    });

    // 2️⃣ Push a notification to the donor
    await push(ref(db, `donors/${donor.uid}/notifications`), {
      title: "New Blood Request",
      message: `${user.displayName || "Someone"} requested blood from you.`,
      read: false,
      timestamp: Date.now(),
    });

    alert(`Request sent to ${donor.name}`);
    setRequested((prev) => [...prev, donor.uid]);
  } catch (err) {
    console.error("Failed to send request:", err);
    alert("❌ Failed to send request.");
  }
};

  

  const filteredDonors = donors.filter(donor => {
    if (!donor.blood || !donor.name) return false;
    if (donor.uid === user?.uid) return false; // exclude current user
    if (requiredBloodGroup && donor.blood !== requiredBloodGroup) return false; // blood group filter
    if (userLocation && donor.lat && donor.lon) {
      const dist = getDistanceKm(userLocation.lat, userLocation.lon, donor.lat, donor.lon);
      if (dist > 1.5) return false; // distance filter 1.5 km
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-end mb-4">
        <LogoutButton />
      </div>

      <h2 className="text-2xl font-bold mb-6 text-center text-red-600">Available Donors</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDonors.length === 0 && (
          <p className="text-gray-500 col-span-full text-center">No donors found nearby or matching blood group.</p>
        )}
        {filteredDonors.map(donor => (
          <div key={donor.uid} className="bg-white p-4 rounded-xl shadow-md flex flex-col justify-between hover:shadow-lg transition">
            <div className="mb-2">
              <p className="font-semibold text-lg">{donor.name}</p>
              <p>🩸 Blood Group: <span className="font-medium">{donor.blood}</span></p>
              <p>📍 Location: <span className="font-medium">{donor.location || "Unknown"}</span></p>
              {donor.lat && donor.lon && userLocation && (
                <p>📏 Distance: {getDistanceKm(userLocation.lat, userLocation.lon, donor.lat, donor.lon).toFixed(2)} km</p>
              )}
            </div>
            <button
              onClick={() => sendRequest(donor)}
              disabled={requested.includes(donor.uid)}
              className={`py-2 rounded text-white font-semibold transition ${
                requested.includes(donor.uid) ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {requested.includes(donor.uid) ? "Requested" : "Request"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

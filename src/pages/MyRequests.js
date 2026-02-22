// src/pages/MyRequests.js
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { ref, onValue,get,push, update } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import LogoutButton from "../components/LogoutButton";

function MyRequests() {
  const [user] = useAuthState(auth);
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    if (!user) return;

    const reqRef = ref(db, "donorRequests/");
    onValue(reqRef, (snap) => {
      if (snap.exists()) {
        const all = Object.entries(snap.val()).map(([id, r]) => ({
          id,
          ...r,
        }));
        const mine = all.filter((r) => r.to === user.uid);
        setMyRequests(mine);
      } else {
        setMyRequests([]);
      }
    });
  }, [user]);

const handleStatus = async (id, status) => {
  try {
    await update(ref(db, `donorRequests/${id}`), { status });

    // Find the donorRequest object
    const reqSnap = await get(ref(db, `donorRequests/${id}`));
    const reqData = reqSnap.val();
    if (!reqData) return;

    // Notify the requester about the status change
    await push(ref(db, `donors/${reqData.from}/notifications`), {
      title: "Request Status Updated",
      message: `Your blood request was ${status} by the donor.`,
      read: false,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Failed to update status:", err);
  }
};


  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-red-600">My Requests</h2>
        <LogoutButton />
      </div>

      {myRequests.length === 0 ? (
        <p className="text-gray-500">No requests yet.</p>
      ) : (
        <ul className="space-y-3">
          {myRequests.map((r) => (
            <li
              key={r.id}
              className="p-4 border rounded-md bg-white shadow flex justify-between items-center"
            >
              <div>
                <p><strong>From:</strong> {r.from}</p>
                <p><strong>Status:</strong> {r.status}</p>
              </div>
              <div className="space-x-2">
                {r.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleStatus(r.id, "accepted")}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatus(r.id, "declined")}
                      className="bg-gray-500 text-white px-3 py-1 rounded"
                    >
                      Decline
                    </button>
                  </>
                )}
                {r.status === "accepted" && (
                  <button
                    onClick={() => handleStatus(r.id, "completed")}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Complete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MyRequests;

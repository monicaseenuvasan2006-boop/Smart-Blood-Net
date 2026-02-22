// src/pages/Dashboard.js
import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import logo from "../assets/logo.png";

import { ref, onValue, push, update } from "firebase/database";
import { Link } from "react-router-dom";
import {
  PieChart, Pie, Cell,
  ResponsiveContainer, BarChart,
  Bar, XAxis, YAxis, Tooltip,
  Legend, CartesianGrid
} from "recharts";
import LogoutButton from "../components/LogoutButton";
import NotificationBell from "../components/NotificationBell";

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "flagged" | "top"

  useEffect(() => {
    setCurrentUser(auth.currentUser);

    const usersRef = ref(db, "users/");
    const requestsRef = ref(db, "requests/");

    // Utility to detect flagged/suspicious requests
    const isFlagged = (r) => r.flagged || !r.hospital || !r.patientId || !r.blood || r.blood === "Unknown";
    const detectFakeRequest = (r) => !r.hospitalName || !r.patientId || !r.blood || r.blood === "Unknown";

    // Fetch users
    onValue(usersRef, (snap) => {
      if (snap.exists()) {
        setUsers(Object.entries(snap.val()).map(([uid, u]) => ({ uid, ...u })));
      } else setUsers([]);
    });

    // Fetch requests
    onValue(requestsRef, async (snap) => {
      const all = snap.exists() ? Object.entries(snap.val()).map(([id, r]) => ({ id, ...r })) : [];
      const flaggedRequests = all.filter(detectFakeRequest);
      const normalRequests = all.filter((r) => !detectFakeRequest(r));

      setRequests(normalRequests.filter((r) => !r.flagged));
      setFlagged([...flaggedRequests, ...all.filter((r) => r.flagged)]);

      for (const r of normalRequests) {
        if (!r.notified) {
          await push(ref(db, `donors/${auth.currentUser.uid}/notifications`), {
            title: "New Blood Request",
            message: `A new blood request has been created by ${r.name}.`,
            read: false,
            timestamp: Date.now(),
          });
          await update(ref(db, `requests/${r.id}`), { notified: true });
        }
      }
    });

  }, []);

  const handleStatus = async (id, status) => {
    if (!currentUser) return;

    const donorName = users.find(u => u.uid === currentUser.uid)?.name || "Unknown Donor";

    await update(ref(db, `requests/${id}`), {
      status,
      donor: status === "accepted" ? donorName : null,
    });

    if (status === "completed") {
      const donor = users.find(u => u.uid === currentUser.uid);
      if (donor) {
        await update(ref(db, `users/${donor.uid}`), { donations: (donor.donations || 0) + 1 });
      }
    }
  };
const openProfile = (user) => {
  setSelectedUser(user);
};

const closeProfile = () => {
  setSelectedUser(null);
};

  // Charts data
  const statusCounts = [
    { name: "Pending", value: requests.filter(r => (r.status || "pending") === "pending").length },
    { name: "Accepted", value: requests.filter(r => r.status === "accepted").length },
    { name: "Completed", value: requests.filter(r => r.status === "completed").length },
  ];

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const bloodCounts = bloodGroups.map(b => ({
    name: b,
    value: requests.filter(r => r.blood === b).length,
  }));

  const COLORS = ["#ef4444", "#facc15", "#22c55e"];
  const leaderboard = [...users].filter(u => (u.donations || 0) > 0)
    .sort((a, b) => b.donations - a.donations)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
 <div className="flex items-center space-x-2">
    <img src={logo} alt="App Logo" className="w-10 h-10 object-contain" />
    <h1 className="text-4xl font-bold text-red-600">🩸 SmartBlood Dashboard</h1>
  </div>          <div className="flex space-x-2">
            <NotificationBell />
            <Link to="/request" className="bg-red-600 text-white px-4 py-2 rounded-md font-bold hover:bg-red-700">+ New Request</Link>
            <Link
              to="/donors"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold hover:bg-blue-700"
            >
              View Donors
            </Link>
            <Link
              to="/my-requests"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold hover:bg-blue-700"
            >
              My Requests
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg mb-3 font-semibold text-red-600">Request Status</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusCounts} dataKey="value" nameKey="name" outerRadius={100}>
                  {statusCounts.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg mb-3 font-semibold text-red-600">Requests by Blood Group</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bloodCounts}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" />
                <Bar dataKey="value" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex border-b border-gray-200 mb-4">
            <button className={`px-4 py-2 font-semibold ${activeTab==="all"?"border-b-2 border-red-600 text-red-600":"text-gray-600"}`} onClick={()=>setActiveTab("all")}>All Requests</button>
            <button className={`px-4 py-2 font-semibold ${activeTab==="flagged"?"border-b-2 border-red-600 text-red-600":"text-gray-600"}`} onClick={()=>setActiveTab("flagged")}>Flagged Requests</button>
            <button className={`px-4 py-2 font-semibold ${activeTab==="top"?"border-b-2 border-red-600 text-red-600":"text-gray-600"}`} onClick={()=>setActiveTab("top")}>Top Donors</button>
          </div>

          {/* All Requests */}
          {activeTab==="all" && (
            <ul className="space-y-3">
              {requests.length === 0 && <div>No requests yet.</div>}
           {requests.map(r => (
  <li 
    key={r.id} 
    className="bg-gray-50 p-4 rounded-md shadow flex justify-between items-center cursor-pointer"
    onClick={() => openProfile(r)}
  >
    <div>
      <div className="font-semibold">{r.name}</div>
      <div>{r.blood} needed in {r.location}</div>
      <div className="text-sm">
        Status: <span className="capitalize">{r.status || "pending"}</span>
        {r.donor && <span> (Accepted by {r.donor})</span>}
      </div>
    </div>
    <div className="space-x-2">
      {r.status !== "accepted" && (
        <button onClick={(e)=>{e.stopPropagation();handleStatus(r.id,"accepted")}} 
          className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-sm text-white">
          Accept
        </button>
      )}
      {r.status !== "completed" && (
        <button onClick={(e)=>{e.stopPropagation();handleStatus(r.id,"completed")}} 
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm text-white">
          Complete
        </button>
      )}
    </div>
  </li>
))}

            </ul>
          )}

          {/* Flagged Requests */}
          {activeTab==="flagged" && (
            <ul className="space-y-3">
              {flagged.length===0 && <div>No flagged requests</div>}
              {flagged.map(r => (
  <li 
    key={r.id} 
    className="bg-red-50 p-4 rounded-md shadow border border-red-400 cursor-pointer"
    onClick={() => openProfile(r)}
  >
    <div className="font-semibold">{r.name}</div>
    <div>Blood: {r.blood}</div>
    <div>Location: {r.location}</div>
    <div className="text-sm mt-2">Reason: {r.flagReason || "Suspicious / Missing Info"}</div>
  </li>
))}

            </ul>
          )}

          {/* Top Donors */}
          {activeTab==="top" && (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaderboard.length === 0 && <div>No donors yet</div>}
              {leaderboard.map((u, i) => (
  <li 
    key={i} 
    className="bg-white p-4 rounded-md shadow border-l-4 border-red-600 cursor-pointer"
    onClick={() => openProfile(u)}
  >
    <div className="font-bold">{i+1}. {u.name}</div>
    <div>Blood: {u.blood}</div>
    <div>Donations: {u.donations || 0}</div>
  </li>
))}

            </ul>
          )}
       

        </div>
  {selectedUser && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl w-96 relative">
      <button 
        onClick={closeProfile} 
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 font-bold"
      >
        X
      </button>

      {/* Show Donor Profile */}
      {selectedUser.donations !== undefined ? (
        <>
          <h2 className="text-2xl font-bold mb-4">{selectedUser.name}</h2>
          <p><strong>Blood Group:</strong> {selectedUser.blood}</p>
          <p><strong>Email:</strong> {selectedUser.email || "N/A"}</p>
          <p><strong>Phone:</strong> {selectedUser.phone || "N/A"}</p>
          <p><strong>Donations:</strong> {selectedUser.donations || 0}</p>
          <p><strong>Location:</strong> {selectedUser.location || "N/A"}</p>
        </>
      ) : (
      /* Show Request Profile */
        <>
          <h2 className="text-2xl font-bold mb-4">{selectedUser.name}</h2>
          <p><strong>Blood Group:</strong> {selectedUser.blood}</p>
          <p><strong>Location:</strong> {selectedUser.location}</p>
          <p><strong>Status:</strong> {selectedUser.status || "Pending"}</p>
          <p><strong>Requested For:</strong> {selectedUser.hospital || "Unknown Hospital"}</p>
          {selectedUser.flagReason && (
            <p className="text-red-600"><strong>Flagged Reason:</strong> {selectedUser.flagReason}</p>
          )}
        </>
      )}
    </div>
  </div>
)}

      </div>
    </div>
  );
}

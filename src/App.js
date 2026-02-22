import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RequestBlood from "./pages/RequestBlood";
import Donors from "./pages/Donors";
import MyRequests from "./pages/MyRequests"; 

// 👇 import the provider
import { NotificationProvider } from "./contexts/NotificationContext";

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} /> {/* default page */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/request" element={<RequestBlood />} />
          <Route path="/my-requests" element={<MyRequests />} />
          <Route path="/donors" element={<Donors />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;

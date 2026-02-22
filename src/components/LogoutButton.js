// src/components/LogoutButton.js
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function LogoutButton() {
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/"; // redirect to login
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
    >
      Logout
    </button>
  );
}

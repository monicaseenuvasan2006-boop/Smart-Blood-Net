import { useState } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Bell } from "lucide-react";

export default function NotificationBell() {
  const { notifications, unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  const markAsRead = async (notifId) => {
    try {
      await updateDoc(
        doc(db, "donors", auth.currentUser.uid, "notifications", notifId),
        { read: true }
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative">
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md p-4 max-h-96 overflow-y-auto z-50">
          <h4 className="font-semibold mb-2">Notifications</h4>
          {notifications.length === 0 ? (
            <div className="text-sm text-gray-500">No notifications</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-2 rounded-md cursor-pointer ${n.read ? "" : "bg-red-100"}`}
                onClick={() => markAsRead(n.id)}
              >
                <div className="text-sm">{n.message}</div>
                <div className="text-xs text-gray-400">
                  {n.timestamp
                    ? (n.timestamp.toDate
                        ? n.timestamp.toDate().toLocaleString()
                        : new Date(n.timestamp).toLocaleString())
                    : ""}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

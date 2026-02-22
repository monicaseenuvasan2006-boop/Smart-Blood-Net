import { createContext, useContext, useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { ref, onValue, query, orderByChild } from "firebase/database";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Path in Realtime DB
    const notifRef = ref(db, `notifications/${auth.currentUser.uid}`);

    // If you want ordering by timestamp:
    const q = query(notifRef, orderByChild("timestamp"));

    const unsubscribe = onValue(q, (snapshot) => {
      if (snapshot.exists()) {
        const notifs = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data,
        }));

        // sort newest first
        notifs.sort((a, b) => b.timestamp - a.timestamp);

        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

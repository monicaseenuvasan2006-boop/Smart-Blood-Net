// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDCr_OXUBabiTB45RP_lJpqHHqZXREBLPI",
  authDomain: "smart-blood-net.firebaseapp.com",
  databaseURL: "https://smart-blood-net-default-rtdb.firebaseio.com",
  projectId: "smart-blood-net",
  storageBucket: "smart-blood-net.firebasestorage.app",
  messagingSenderId: "245401796167",
  appId: "1:245401796167:web:135b673f837015af203b62",
  measurementId: "G-XHV31Z4PZL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);
export { auth, db };

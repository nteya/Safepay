// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA5mVjGF7cM3p_KT7vQreB7S73Qk6erVkU",
  authDomain: "strings-e0f81.firebaseapp.com",
  databaseURL: "https://strings-e0f81-default-rtdb.firebaseio.com",
  projectId: "strings-e0f81",
  storageBucket: "strings-e0f81.appspot.com", // corrected bucket format
  messagingSenderId: "607348128270",
  appId: "1:607348128270:web:d83014fd4eb85d2d10da5f",
  measurementId: "G-CHPQT19SE0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export them for use in other files
export { app, auth, db, storage };

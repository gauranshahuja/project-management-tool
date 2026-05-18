// src/utils/firebase.js (or src/firebase.js, depending on your structure)
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"; // ✅ include signInWithPopup

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDNR0nJw0uo-Cm4kdUwhttchqcdu0sg8dQ",
  authDomain: "project-management-tool-82a1c.firebaseapp.com",
  projectId: "project-management-tool-82a1c",
  storageBucket: "project-management-tool-82a1c.appspot.com", 
  messagingSenderId: "261075120730",
  appId: "1:261075120730:web:47f49d8383255953a75e63",
  measurementId: "G-ZTX9M41WM2"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Auth Setup
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ✅ Export for use in app
export { auth, provider, app, signInWithPopup }; // ✅ add signInWithPopup here

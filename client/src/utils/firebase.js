// src/utils/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  linkWithCredential
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNR0nJw0uo-Cm4kdUwhttchqcdu0sg8dQ",
  authDomain: "project-management-tool-82a1c.firebaseapp.com",
  projectId: "project-management-tool-82a1c",
  storageBucket: "project-management-tool-82a1c.appspot.com",
  messagingSenderId: "261075120730",
  appId: "1:261075120730:web:47f49d8383255953a75e63",
  measurementId: "G-ZTX9M41WM2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth setup
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export {
  auth,
  googleProvider,
  githubProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  GithubAuthProvider,
  GoogleAuthProvider
};

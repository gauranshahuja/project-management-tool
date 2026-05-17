import React from "react";
import { signInWithPopup, auth, provider } from "../utils/firebase";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const AuthModal = ({ onClose }) => {
  const { login } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      login(result.user);
      toast.success("Logged in successfully");
      onClose(); // close modal
    } catch (error) {
      toast.error("Login failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-sm w-full">
        <h2 className="text-2xl font-semibold mb-4">Welcome</h2>
        <button
          onClick={handleGoogleLogin}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Sign in with Google
        </button>
        <p
          className="mt-4 text-sm text-gray-500 cursor-pointer"
          onClick={onClose}
        >
          Cancel
        </p>
      </div>
    </div>
  );
};

export default AuthModal;

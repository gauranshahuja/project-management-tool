// src/components/AuthModal.jsx
import { useState } from "react";
import { signInWithPopup, auth, provider } from "../utils/firebase";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

const AuthModal = ({ onClose }) => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const toggleMode = () => setIsLogin(!isLogin);
  const toggleDark = () => setDarkMode(!darkMode);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      login(result.user);
      toast.success("Logged in successfully");
      onClose();
    } catch (error) {
      toast.error("Login failed");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.target));
    console.log(isLogin ? "Logging in..." : "Registering...", form);
    // TODO: Handle email/password auth
    toast.success(`${isLogin ? "Logged in" : "Registered"} successfully`);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex justify-center items-center ${darkMode ? "dark" : ""}`}>
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-sm w-full z-50 text-center">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDark}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700"
        >
          {darkMode ? (
            <SunIcon className="h-5 w-5 text-yellow-400" />
          ) : (
            <MoonIcon className="h-5 w-5 text-gray-700" />
          )}
        </button>

        {/* Title */}
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          {isLogin ? "Sign in to your account" : "Create your account"}
        </h2>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {!isLogin && (
            <input
              name="name"
              placeholder="Full Name"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 dark:text-white"
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 dark:text-white"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white py-2 rounded transition"
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        {/* Google Auth */}
        <button
          onClick={handleGoogleLogin}
          className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded transition"
        >
          Continue with Google
        </button>

        {/* Toggle Login/Register */}
        <motion.div
          className="text-center mt-4 text-sm text-gray-600 dark:text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={toggleMode}
            className="text-blue-600 hover:underline font-medium ml-1"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </motion.div>

        {/* Cancel Button */}
        <p
          className="mt-4 text-sm text-gray-500 cursor-pointer hover:underline"
          onClick={onClose}
        >
          Cancel
        </p>
      </div>
    </div>
  );
};

export default AuthModal;

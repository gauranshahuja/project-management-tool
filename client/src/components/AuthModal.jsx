// src/components/AuthModal.jsx
import { useState, useEffect } from "react";
import { signInWithPopup, auth, provider } from "../utils/firebase";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const AuthModal = ({ onClose, mode = "login" }) => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(mode === "login");

  useEffect(() => {
    setIsLogin(mode === "login");
  }, [mode]);

  const toggleMode = () => setIsLogin((prev) => !prev);

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
    toast.success(`${isLogin ? "Logged in" : "Registered"} successfully`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-sm w-full z-50 text-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          {isLogin ? "Sign in to your account" : "Create your account"}
        </h2>
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

        <button
          onClick={handleGoogleLogin}
          className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded transition"
        >
          Continue with Google
        </button>

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

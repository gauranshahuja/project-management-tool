// src/pages/AuthPage.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const toggleMode = () => setIsLogin(!isLogin);
  const toggleDark = () => setDarkMode(!darkMode);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.target));
    console.log(isLogin ? "Logging in..." : "Registering...", form);
    // ✅ API call here
  };

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 relative">
          {/* 🌙 Dark Mode Toggle */}
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

          {/* 🔑 Title */}
          <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800 dark:text-white">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </h2>

          {/* 📝 Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* 🔁 Toggle Login/Register */}
          <motion.div
            className="text-center mt-6 text-sm text-gray-600 dark:text-gray-300"
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
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

import { useState } from "react";
import axios from "../services/axiosInstance";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../utils/firebase";

const AuthModal = ({ mode = "login", onClose }) => {
  const [authMode, setAuthMode] = useState(mode);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLogin = authMode === "login";

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "/users/login" : "/users/register";

    try {
      const response = await axios.post(endpoint, formData);
      console.log("Success:", response.data);
      onClose(); 
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
  setLoading(true);
  setError("");

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const idToken = await user.getIdToken();

    // Send Firebase token to backend for verification
    const response = await axios.post("/users/google-login", { token: idToken });

    // Get your backend JWT token from response
    const token = response.data.user.token;

    // Store JWT token locally (e.g., localStorage)
    localStorage.setItem("token", token);

    // Close modal and redirect to dashboard
    onClose();
    window.location.href = "/dashboard";
  } catch (err) {
    console.error("❌ Google Auth error:", err);
    setError("Google authentication failed.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">
          {isLogin ? "Login to Your Account" : "Create an Account"}
        </h2>

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-white"
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-white"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={formData.password}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-white"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            {loading ? (isLogin ? "Logging in..." : "Registering...") : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <div className="text-center my-4 text-gray-500 dark:text-gray-400">or</div>

        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full py-2 border rounded text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          {loading ? "Authenticating..." : "Continue with Google"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setAuthMode(isLogin ? "register" : "login")}
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;

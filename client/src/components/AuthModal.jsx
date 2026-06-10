import { useState } from "react";
import axios from "../services/axiosInstance";
import { useEffect } from "react";
import { setStoredUser } from "../utils/authStorage";
import {
  auth,
  googleProvider,
  githubProvider,
  signInWithPopup,
} from "../utils/firebase";
import {
  fetchSignInMethodsForEmail,
  GithubAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
} from "firebase/auth";
import { FiX } from "react-icons/fi";

const AuthModal = ({ mode = "login", onClose }) => {
  const [authMode, setAuthMode] = useState(mode);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLogin = authMode === "login";

  useEffect(() => {
    setAuthMode(mode);
    setError("");
  }, [mode]);

  const getErrorMessage = (err, fallback) =>
    err.response?.data?.error || err.response?.data?.message || err.message || fallback;

  const saveAuthResponse = (response) => {
    const authUser = setStoredUser(response.data);

    if (!authUser) {
      throw new Error("Authentication response missing token.");
    }
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleAuthMode = () => {
    setAuthMode((currentMode) => (currentMode === "login" ? "register" : "login"));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "/users/login" : "/users/register";

    try {
      const response = await axios.post(endpoint, formData);
      saveAuthResponse(response);
      onClose();
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Auth error:", err);
      setError(getErrorMessage(err, "Something went wrong."));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider, label) => {
  setLoading(true);
  setError("");

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const idToken = await user.getIdToken();

    const response = await axios.post("/users/social-login", { token: idToken });

    saveAuthResponse(response);
    onClose();
    window.location.href = "/dashboard";
  } catch (err) {
    console.error(`${label} sign-in error:`, err);

    // Handle account-exists error
    if (err.code === "auth/account-exists-with-different-credential" && err.customData?.email) {
      const email = err.customData.email;
      const pendingCred =
        label === "Google"
          ? GoogleAuthProvider.credentialFromError(err)
          : GithubAuthProvider.credentialFromError(err);

      if (!pendingCred) {
        setError("Account linking failed. Please try again.");
        return;
      }

      try {
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);

        if (signInMethods.includes("google.com")) {
          // Prompt user to sign in with Google first
          const googleResult = await signInWithPopup(auth, googleProvider);
          // Link GitHub credential to Google account
          await linkWithCredential(auth.currentUser, pendingCred);

          const idToken = await googleResult.user.getIdToken();
          const response = await axios.post("/users/social-login", { token: idToken });

          saveAuthResponse(response);
          onClose();
          window.location.href = "/dashboard";
        } else if (signInMethods.includes("github.com")) {
          // Prompt user to sign in with GitHub first
          const githubResult = await signInWithPopup(auth, githubProvider);
          // Link Google credential to GitHub account
          await linkWithCredential(auth.currentUser, pendingCred);

          const idToken = await githubResult.user.getIdToken();
          const response = await axios.post("/users/social-login", { token: idToken });

          saveAuthResponse(response);
          onClose();
          window.location.href = "/dashboard";
        } else {
          setError("This email is registered with another provider. Please use your original method to sign in.");
        }
      } catch (linkErr) {
        console.error("Account linking failed:", linkErr);
        setError("Account linking failed. Please try again.");
      }
    } else {
      setError(`${label} authentication failed.`);
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6 relative shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
          aria-label="Close auth form"
        >
          <FiX aria-hidden="true" />
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">
          {isLogin ? "Login to Your Account" : "Create an Account"}
        </h2>

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
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

        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleSocialAuth(googleProvider, "Google")}
            disabled={loading}
            className="w-full py-2 border rounded text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {loading ? "Authenticating..." : "Continue with Google"}
          </button>

          <button
            onClick={() => handleSocialAuth(githubProvider, "GitHub")}
            disabled={loading}
            className="w-full py-2 border rounded text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {loading ? "Authenticating..." : "Continue with GitHub"}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={toggleAuthMode}
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

// Login / signup modal: email-password plus Google and GitHub social auth.
import { useState } from "react";
import axios from "../services/axiosInstance";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(mode);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLogin = authMode === "login";

  useEffect(() => {
    setAuthMode(mode);
    setError("");
  }, [mode]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, onClose]);

  const getErrorMessage = (err, fallback) =>
    err.response?.data?.error || err.response?.data?.message || err.message || fallback;

  const saveAuthResponse = (response) => {
    const authUser = setStoredUser(response.data);

    if (!authUser) {
      throw new Error("Authentication response missing token.");
    }
  };

  const finishAuth = () => {
    onClose();
    navigate("/dashboard", { replace: true });
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
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            ...(formData.organizationName.trim()
              ? { organizationName: formData.organizationName.trim() }
              : {}),
          };
      const response = await axios.post(endpoint, payload);
      saveAuthResponse(response);
      finishAuth();
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
    finishAuth();
  } catch (err) {
    console.error(`${label} sign-in error:`, err);

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

          const googleResult = await signInWithPopup(auth, googleProvider);

          await linkWithCredential(auth.currentUser, pendingCred);

          const idToken = await googleResult.user.getIdToken();
          const response = await axios.post("/users/social-login", { token: idToken });

          saveAuthResponse(response);
          finishAuth();
        } else if (signInMethods.includes("github.com")) {

          const githubResult = await signInWithPopup(auth, githubProvider);

          await linkWithCredential(auth.currentUser, pendingCred);

          const idToken = await githubResult.user.getIdToken();
          const response = await axios.post("/users/social-login", { token: idToken });

          saveAuthResponse(response);
          finishAuth();
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-3 top-3 rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          aria-label="Close auth form"
        >
          <FiX aria-hidden="true" />
        </button>

        <h2
          id="auth-modal-title"
          className="mb-4 text-center text-2xl font-bold text-gray-800 dark:text-white"
        >
          {isLogin ? "Login to Your Account" : "Create an Account"}
        </h2>

        {error && (
          <p
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Name"
                required
                value={formData.name}
                onChange={handleInputChange}
                autoComplete="name"
                disabled={loading}
                className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-white"
              />
              <div>
                <input
                  type="text"
                  name="organizationName"
                  placeholder="Company name (optional)"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  autoComplete="organization"
                  disabled={loading}
                  className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Creates your company workspace - you become the Owner. Leave
                  blank for a personal workspace.
                </p>
              </div>
            </>
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={handleInputChange}
            autoComplete="email"
            disabled={loading}
            className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-white"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={formData.password}
            onChange={handleInputChange}
            autoComplete={isLogin ? "current-password" : "new-password"}
            disabled={loading}
            className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-white"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-indigo-600 py-2 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? (isLogin ? "Logging in..." : "Registering...") : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <div className="text-center my-4 text-gray-500 dark:text-gray-400">or</div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleSocialAuth(googleProvider, "Google")}
            disabled={loading}
            className="w-full rounded border py-2 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:hover:bg-gray-800"
          >
            {loading ? "Authenticating..." : "Continue with Google"}
          </button>

          <button
            type="button"
            onClick={() => handleSocialAuth(githubProvider, "GitHub")}
            disabled={loading}
            className="w-full rounded border py-2 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:hover:bg-gray-800"
          >
            {loading ? "Authenticating..." : "Continue with GitHub"}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={toggleAuthMode}
            disabled={loading}
            className="text-indigo-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-indigo-400"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;

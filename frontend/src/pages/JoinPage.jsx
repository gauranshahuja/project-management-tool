import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { FiBriefcase } from "react-icons/fi";
import axios from "../services/axiosInstance";
import { setStoredUser } from "../utils/authStorage";

const getErrorMessage = (err, fallback) =>
  err.response?.data?.error || err.response?.data?.message || fallback;

const JoinPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [invite, setInvite] = useState(null);
  const [form, setForm] = useState({ name: "", password: "" });
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("This invite link is missing its token.");
      setLoadingInvite(false);
      return;
    }

    axios
      .get(`/org/invites/info`, { params: { token } })
      .then((res) => setInvite(res.data))
      .catch((err) => {
        setError(getErrorMessage(err, "This invite is invalid or has expired."));
      })
      .finally(() => setLoadingInvite(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.password) {
      setError("Name and password are required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await axios.post("/users/register", {
        name: form.name.trim(),
        email: invite.email,
        password: form.password,
        inviteToken: token,
      });

      setStoredUser(res.data);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Could not join the organization."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 px-4 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-center gap-2 text-indigo-600">
          <FiBriefcase size={28} aria-hidden="true" />
          <span className="text-xl font-bold">ProjectHub</span>
        </div>

        {loadingInvite ? (
          <p className="text-center text-gray-600 dark:text-gray-300">
            Checking your invite...
          </p>
        ) : invite ? (
          <>
            <h1 className="text-center text-2xl font-bold text-gray-800 dark:text-white">
              Join {invite.organization.name}
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
              You have been invited as <strong>{invite.role}</strong> with the
              email <strong>{invite.email}</strong>.
            </p>

            {error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                className="w-full rounded border px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <input
                type="password"
                placeholder="Choose a password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                required
                minLength={6}
                className="w-full rounded border px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded bg-indigo-600 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {submitting
                  ? "Joining..."
                  : `Join ${invite.organization.name}`}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-center text-2xl font-bold text-gray-800 dark:text-white">
              Invite not valid
            </h1>
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              {error || "This invite is invalid or has expired."}
            </p>
            <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
              Ask your admin for a fresh link, or{" "}
              <Link to="/" className="text-indigo-600 hover:underline dark:text-indigo-400">
                go to the homepage
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinPage;

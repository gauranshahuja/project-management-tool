import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiCheckCircle,
  FiFolderPlus,
  FiMessageSquare,
  FiTrash2,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import axios from "../services/axiosInstance";
import Navbar_Dashboard from "../components/Navbar_dashboard";
import { getStoredUser } from "../utils/authStorage";

const getErrorMessage = (err, fallback) =>
  err.response?.data?.error || err.response?.data?.message || fallback;

const timeAgo = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  for (const [name, secs] of units) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${name}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
};

// Action -> icon + accent color
const actionMeta = (action) => {
  if (action.startsWith("project")) return { icon: FiFolderPlus, color: "text-indigo-500" };
  if (action === "task.completed") return { icon: FiCheckCircle, color: "text-emerald-500" };
  if (action.startsWith("task")) return { icon: FiActivity, color: "text-blue-500" };
  if (action === "comment.added") return { icon: FiMessageSquare, color: "text-sky-500" };
  if (action === "invite.created" || action === "member.joined")
    return { icon: FiUserPlus, color: "text-emerald-500" };
  if (action === "member.removed") return { icon: FiTrash2, color: "text-red-500" };
  return { icon: FiUsers, color: "text-gray-500" };
};

const Activity = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getStoredUser()?.token) {
      navigate("/");
      return;
    }

    axios
      .get("/org/activity", { params: { limit: 50 } })
      .then((res) => setItems(res.data))
      .catch((err) => setError(getErrorMessage(err, "Failed to load activity")))
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <Navbar_Dashboard />

      <div className="mx-auto w-full max-w-3xl p-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-800 dark:text-white">
          <FiActivity aria-hidden="true" /> Activity
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Recent actions across your organization.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="mt-6 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          {loading ? (
            <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
              Loading activity...
            </p>
          ) : items.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
              No activity yet. Create a project or invite a teammate to get started.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item) => {
                const { icon: Icon, color } = actionMeta(item.action);
                return (
                  <li key={item.id} className="flex items-start gap-3 p-4">
                    <Icon className={`mt-0.5 shrink-0 ${color}`} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-100">
                        <span className="font-medium">{item.actorName}</span>{" "}
                        {item.summary}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        {timeAgo(item.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Activity;

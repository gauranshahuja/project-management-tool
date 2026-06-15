import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiCheckCircle,
  FiFolderPlus,
  FiInbox,
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

const ActivitySkeleton = () => (
  <div className="divide-y divide-gray-200 dark:divide-gray-700">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="flex items-start gap-3 p-4">
        <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-4/5 max-w-md animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyActivity = () => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
      <FiInbox aria-hidden="true" />
    </div>
    <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
      No activity yet
    </h2>
    <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
      Create a project, update a task, or invite a teammate and the timeline
      will start filling in.
    </p>
  </div>
);

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

      <div className="mx-auto w-full max-w-4xl p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
              <FiActivity aria-hidden="true" /> Activity
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Recent actions across your organization.
            </p>
          </div>
          {!loading && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {items.length} event{items.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          {loading ? (
            <ActivitySkeleton />
          ) : items.length === 0 ? (
            <EmptyActivity />
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item) => {
                const { icon: Icon, color } = actionMeta(item.action);
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 p-4 transition hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800">
                      <Icon className={color} aria-hidden="true" />
                    </span>
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

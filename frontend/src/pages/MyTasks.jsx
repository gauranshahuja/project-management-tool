import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiCheckSquare, FiInbox } from "react-icons/fi";
import axios from "../services/axiosInstance";
import Navbar_Dashboard from "../components/Navbar_dashboard";
import { getStoredUser } from "../utils/authStorage";
import { getEntityId } from "../utils/ids";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Completed"];
const STATUS_FILTERS = ["All", ...STATUS_OPTIONS];

const getErrorMessage = (err, fallback) =>
  err.response?.data?.error || err.response?.data?.message || fallback;

const formatDate = (value) => {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const statusClasses = {
  "Not Started":
    "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
  "In Progress":
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  Completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

const priorityClasses = {
  High: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  Medium:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  Low: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
};

const TaskListSkeleton = () => (
  <div className="divide-y divide-gray-200 dark:divide-gray-700">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-5 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-7 w-24 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
            <div className="h-7 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
          </div>
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-3 w-40 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-9 w-36 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    ))}
  </div>
);

const EmptyTasks = ({ filtered }) => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
      <FiInbox aria-hidden="true" />
    </div>
    <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
      {filtered ? "No tasks match this filter" : "No tasks assigned"}
    </h2>
    <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
      {filtered
        ? "Switch filters to see the rest of your assigned work."
        : "Assigned tasks from all projects will appear here when teammates add them."}
    </p>
  </div>
);

const MyTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingTaskId, setUpdatingTaskId] = useState("");

  useEffect(() => {
    if (!getStoredUser()?.token) {
      navigate("/");
      return;
    }

    axios
      .get("/tasks/me")
      .then((res) => setTasks(res.data))
      .catch((err) => {
        console.error("Failed to load my tasks:", err.response?.data || err.message);
        setError(getErrorMessage(err, "Failed to load your tasks"));
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const updateStatus = async (task, status) => {
    if (task.status === status) return;

    setError("");
    setNotice("");
    setUpdatingTaskId(task._id);

    try {
      const res = await axios.put(`/tasks/${task._id}`, { status });
      setTasks((prev) =>
        prev.map((item) =>
          item._id === task._id ? { ...item, status: res.data.status } : item
        )
      );
      setNotice(`"${task.title}" moved to ${status}.`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update task"));
    } finally {
      setUpdatingTaskId("");
    }
  };

  const counts = STATUS_OPTIONS.reduce(
    (acc, status) => ({
      ...acc,
      [status]: tasks.filter((task) => task.status === status).length,
    }),
    { All: tasks.length }
  );

  const visibleTasks =
    statusFilter === "All"
      ? tasks
      : tasks.filter((task) => task.status === statusFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <Navbar_Dashboard />

      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
              <FiCheckSquare aria-hidden="true" /> My Tasks
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Everything assigned to you, across all projects.
            </p>
          </div>
          {!loading && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {counts.Completed}/{counts.All} completed
            </span>
          )}
        </div>

        {(error || notice) && (
          <div
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
            }`}
          >
            {error || notice}
          </div>
        )}

        {!loading && tasks.length > 0 && (
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((status) => {
              const active = statusFilter === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  {status} {counts[status] ?? 0}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          {loading ? (
            <TaskListSkeleton />
          ) : tasks.length === 0 ? (
            <EmptyTasks filtered={false} />
          ) : visibleTasks.length === 0 ? (
            <EmptyTasks filtered />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {visibleTasks.map((task) => (
                <div
                  key={task._id}
                  className="flex flex-col gap-3 p-4 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-gray-800/60"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words font-semibold text-gray-800 dark:text-white">
                        {task.title}
                      </h3>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          statusClasses[task.status] || statusClasses["Not Started"]
                        }`}
                      >
                        {task.status}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          priorityClasses[task.priority] || priorityClasses.Medium
                        }`}
                      >
                        {task.priority || "Medium"}
                      </span>
                    </div>
                    {task.description && (
                      <p className="mt-1 break-words text-sm text-gray-600 dark:text-gray-300">
                        {task.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {task.project?.title ? (
                        <Link
                          to={`/projects/${getEntityId(task.project)}`}
                          className="text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {task.project.title}
                        </Link>
                      ) : (
                        "Unknown project"
                      )}{" "}
                      - {formatDate(task.dueDate)}
                    </p>
                  </div>

                  <select
                    value={task.status}
                    onChange={(e) => updateStatus(task, e.target.value)}
                    disabled={updatingTaskId === task._id}
                    className="shrink-0 rounded border px-3 py-1.5 text-sm disabled:cursor-wait disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTasks;

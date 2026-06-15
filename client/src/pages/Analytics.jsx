import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckSquare,
  FiFolder,
  FiUsers,
} from "react-icons/fi";
import axios from "../services/axiosInstance";
import Navbar_Dashboard from "../components/Navbar_dashboard";
import { getStoredUser } from "../utils/authStorage";

const getErrorMessage = (err, fallback) =>
  err.response?.data?.error || err.response?.data?.message || fallback;

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <Icon className={accent} aria-hidden="true" />
    </div>
    <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
      {value}
    </p>
  </div>
);

const Bar = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">{value}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <div className="flex items-center justify-between">
      <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-5 w-5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="mt-3 h-9 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
  </div>
);

const ChartSkeleton = () => (
  <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <div className="mb-5 h-5 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index}>
          <div className="mb-2 flex justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-2.5 w-full animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
      ))}
    </div>
  </section>
);

const AnalyticsSkeleton = () => (
  <>
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
    <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 h-5 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </section>
  </>
);

const Analytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getStoredUser()?.token) {
      navigate("/");
      return;
    }

    axios
      .get("/org/analytics")
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err, "Failed to load analytics")))
      .finally(() => setLoading(false));
  }, [navigate]);

  const statusTotal = data
    ? Object.values(data.tasksByStatus).reduce((a, b) => a + b, 0)
    : 0;
  const priorityTotal = data
    ? Object.values(data.tasksByPriority).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <Navbar_Dashboard />

      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
              <FiActivity aria-hidden="true" /> Overview
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              A snapshot of your organization's projects and tasks.
            </p>
          </div>
          {data && !loading && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {data.totalTasks} total task{data.totalTasks === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <AnalyticsSkeleton />
        ) : data ? (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={FiFolder} label="Projects" value={data.projects} accent="text-indigo-500" />
              <StatCard icon={FiUsers} label="Members" value={data.members} accent="text-emerald-500" />
              <StatCard icon={FiCheckSquare} label="Total tasks" value={data.totalTasks} accent="text-blue-500" />
              <StatCard icon={FiAlertTriangle} label="Overdue" value={data.overdueTasks} accent="text-red-500" />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                  Tasks by status
                </h2>
                <div className="space-y-4">
                  <Bar label="Not Started" value={data.tasksByStatus["Not Started"]} total={statusTotal} color="bg-gray-400" />
                  <Bar label="In Progress" value={data.tasksByStatus["In Progress"]} total={statusTotal} color="bg-amber-500" />
                  <Bar label="Completed" value={data.tasksByStatus.Completed} total={statusTotal} color="bg-emerald-500" />
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                  Tasks by priority
                </h2>
                <div className="space-y-4">
                  <Bar label="High" value={data.tasksByPriority.High} total={priorityTotal} color="bg-red-500" />
                  <Bar label="Medium" value={data.tasksByPriority.Medium} total={priorityTotal} color="bg-amber-500" />
                  <Bar label="Low" value={data.tasksByPriority.Low} total={priorityTotal} color="bg-sky-500" />
                </div>
              </section>
            </div>

            <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                Top assignees
              </h2>
              {data.topAssignees.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No tasks assigned yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.topAssignees.map((person) => (
                    <div key={person.name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {person.name}
                      </span>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                        {person.count} task{person.count === 1 ? "" : "s"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Analytics;

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiClock,
  FiLogIn,
  FiLogOut,
  FiRefreshCw,
  FiUsers,
} from "react-icons/fi";
import Navbar_Dashboard from "../components/Navbar_dashboard";
import axios from "../services/axiosInstance";
import { getStoredUser } from "../utils/authStorage";
import { errorMessage, notifyError, notifySuccess } from "../utils/toast";

const isHrManager = (user) => ["Owner", "Admin"].includes(user?.role);

const todayKey = () => new Date().toISOString().slice(0, 10);

const formatTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const durationLabel = (record) => {
  if (!record?.checkIn || !record?.checkOut) return "In progress";
  const start = new Date(record.checkIn).getTime();
  const end = new Date(record.checkOut).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return "-";
  const minutes = Math.round((end - start) / 60000);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h ${remainder}m`;
};

const AttendanceSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="space-y-2">
          <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-36 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-7 w-24 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>
    ))}
  </div>
);

const AttendanceRow = ({ record, user }) => (
  <div className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] sm:items-center">
    <div className="min-w-0">
      <p className="font-semibold text-gray-900 dark:text-white">
        {user?.name || formatDate(record.date)}
      </p>
      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
        {user?.email || record.date}
      </p>
    </div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">Check in</p>
      <p className="font-medium text-gray-900 dark:text-white">
        {formatTime(record.checkIn)}
      </p>
    </div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">Check out</p>
      <p className="font-medium text-gray-900 dark:text-white">
        {formatTime(record.checkOut)}
      </p>
    </div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
      <p className="font-medium text-gray-900 dark:text-white">
        {durationLabel(record)}
      </p>
    </div>
    <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
      {record.status || "Present"}
    </span>
  </div>
);

const HrAttendance = () => {
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const canViewOrg = isHrManager(currentUser);
  const [me, setMe] = useState({ today: null, records: [] });
  const [orgDate, setOrgDate] = useState(todayKey());
  const [orgRecords, setOrgRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgLoading, setOrgLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  const loadMine = async () => {
    const res = await axios.get("/hr/attendance/me");
    setMe(res.data);
  };

  const loadOrg = async (date = orgDate) => {
    if (!canViewOrg) return;
    setOrgLoading(true);
    try {
      const res = await axios.get("/hr/attendance", { params: { date } });
      setOrgRecords(res.data.records || []);
    } catch (err) {
      notifyError(errorMessage(err, "Failed to load team attendance"));
    } finally {
      setOrgLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser?.token) {
      navigate("/");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        await loadMine();
        await loadOrg(orgDate);
      } catch (err) {
        setError(errorMessage(err, "Failed to load attendance"));
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.token, navigate]);

  useEffect(() => {
    loadOrg(orgDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgDate]);

  const handlePunch = async (type) => {
    setActionLoading(type);
    setError("");
    try {
      await axios.post(`/hr/attendance/${type}`);
      await loadMine();
      await loadOrg(orgDate);
      notifySuccess(type === "check-in" ? "Checked in." : "Checked out.");
    } catch (err) {
      const message = errorMessage(err, "Attendance update failed");
      setError(message);
      notifyError(message);
    } finally {
      setActionLoading("");
    }
  };

  const today = me.today;
  const hasCheckedIn = Boolean(today?.checkIn);
  const hasCheckedOut = Boolean(today?.checkOut);

  const summary = useMemo(() => {
    const complete = me.records.filter((record) => record.checkOut).length;
    const active = me.records.filter(
      (record) => record.checkIn && !record.checkOut
    ).length;
    return { complete, active };
  }, [me.records]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <Navbar_Dashboard />

      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-indigo-600 dark:text-indigo-300">
              Workforce rhythm
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              <FiClock aria-hidden="true" /> Attendance
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
              Track today's check-in, recent work history, and team attendance
              from one operational view.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              loadMine();
              loadOrg(orgDate);
            }}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <FiRefreshCw aria-hidden="true" /> Refresh
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Today
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(todayKey())}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  hasCheckedOut
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
                    : hasCheckedIn
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                }`}
              >
                {hasCheckedOut ? "Complete" : hasCheckedIn ? "Working" : "Not started"}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Check in</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {formatTime(today?.checkIn)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Check out</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {formatTime(today?.checkOut)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => handlePunch("check-in")}
                disabled={hasCheckedIn || Boolean(actionLoading)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                <FiLogIn aria-hidden="true" />
                {actionLoading === "check-in" ? "Checking in..." : "Check in"}
              </button>
              <button
                type="button"
                onClick={() => handlePunch("check-out")}
                disabled={!hasCheckedIn || hasCheckedOut || Boolean(actionLoading)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                <FiLogOut aria-hidden="true" />
                {actionLoading === "check-out" ? "Checking out..." : "Check out"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">Recent records</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {me.records.length}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed days</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {summary.complete}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:col-span-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Open shift</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {summary.active}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <FiCalendar aria-hidden="true" /> My history
          </h2>
          {loading ? (
            <AttendanceSkeleton />
          ) : me.records.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              Your attendance history will appear after the first check-in.
            </div>
          ) : (
            <div className="space-y-3">
              {me.records.map((record) => (
                <AttendanceRow key={record._id || record.date} record={record} />
              ))}
            </div>
          )}
        </section>

        {canViewOrg && (
          <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <FiUsers aria-hidden="true" /> Team attendance
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Date-wise attendance across the organization.
                </p>
              </div>
              <input
                type="date"
                value={orgDate}
                onChange={(e) => setOrgDate(e.target.value)}
                className="rounded border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="mt-4 space-y-3">
              {orgLoading ? (
                <AttendanceSkeleton />
              ) : orgRecords.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  No attendance records for this date.
                </div>
              ) : (
                orgRecords.map((record) => (
                  <AttendanceRow
                    key={record._id || `${record.user?._id}-${record.date}`}
                    record={record}
                    user={record.user}
                  />
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default HrAttendance;

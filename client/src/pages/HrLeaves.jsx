import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheck,
  FiClipboard,
  FiClock,
  FiSend,
  FiX,
} from "react-icons/fi";
import Navbar_Dashboard from "../components/Navbar_dashboard";
import { useConfirm } from "../components/ConfirmDialog";
import axios from "../services/axiosInstance";
import { getStoredUser } from "../utils/authStorage";
import { getEntityId } from "../utils/ids";
import { errorMessage, notifyError, notifySuccess } from "../utils/toast";

const LEAVE_TYPES = ["Casual", "Sick", "Paid", "Unpaid"];

const canReviewLeaves = (user) =>
  ["Owner", "Admin", "Manager"].includes(user?.role);

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const statusClasses = {
  Pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  Approved:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  Rejected:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
};

const daysBetween = (startDate, endDate) => {
  const start = new Date(startDate).setHours(0, 0, 0, 0);
  const end = new Date(endDate).setHours(0, 0, 0, 0);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
};

const LeaveCard = ({ leave, actions }) => (
  <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {leave.type || "Casual"} leave
          </h3>
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              statusClasses[leave.status] || statusClasses.Pending
            }`}
          >
            {leave.status || "Pending"}
          </span>
        </div>
        {leave.user && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {leave.user.name} - {leave.user.email}
          </p>
        )}
      </div>
      <p className="shrink-0 text-sm font-medium text-gray-700 dark:text-gray-200">
        {daysBetween(leave.startDate, leave.endDate)} day
        {daysBetween(leave.startDate, leave.endDate) === 1 ? "" : "s"}
      </p>
    </div>

    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">From</p>
        <p className="font-medium text-gray-900 dark:text-white">
          {formatDate(leave.startDate)}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">To</p>
        <p className="font-medium text-gray-900 dark:text-white">
          {formatDate(leave.endDate)}
        </p>
      </div>
    </div>

    {leave.reason && (
      <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
        {leave.reason}
      </p>
    )}

    {leave.reviewNote && (
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Review note: {leave.reviewNote}
      </p>
    )}

    {actions && <div className="mt-4">{actions}</div>}
  </article>
);

const LeaveSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, index) => (
      <div
        key={index}
        className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        <div className="mt-2 h-4 w-3/5 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    ))}
  </div>
);

const HrLeaves = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const currentUser = getStoredUser();
  const currentUserId = getEntityId(currentUser);
  const reviewer = canReviewLeaves(currentUser);
  const [form, setForm] = useState({
    type: "Casual",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [myLeaves, setMyLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [reviewNotes, setReviewNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState("");
  const [error, setError] = useState("");

  const loadLeaves = async () => {
    const requests = [axios.get("/hr/leaves/me")];
    if (reviewer) {
      requests.push(axios.get("/hr/leaves", { params: { status: "Pending" } }));
    }

    const [mineRes, pendingRes] = await Promise.all(requests);
    setMyLeaves(mineRes.data || []);
    if (pendingRes) {
      setPendingLeaves(pendingRes.data || []);
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
        await loadLeaves();
      } catch (err) {
        setError(errorMessage(err, "Failed to load leave requests"));
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.token, navigate]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitLeave = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.startDate || !form.endDate) {
      setError("Start date and end date are required.");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post("/hr/leaves", {
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
      });
      setForm({ type: "Casual", startDate: "", endDate: "", reason: "" });
      await loadLeaves();
      notifySuccess("Leave request submitted.");
    } catch (err) {
      const message = errorMessage(err, "Failed to request leave");
      setError(message);
      notifyError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const reviewLeave = async (leave, status) => {
    const confirmed = await confirm({
      title: `${status} leave?`,
      message: `${leave.user?.name || "This teammate"} will see this decision in their leave history.`,
      confirmText: status,
      danger: status === "Rejected",
    });

    if (!confirmed) return;

    setReviewingId(leave._id);
    setError("");
    try {
      await axios.patch(`/hr/leaves/${leave._id}`, {
        status,
        reviewNote: (reviewNotes[leave._id] || "").trim(),
      });
      await loadLeaves();
      notifySuccess(`Leave ${status.toLowerCase()}.`);
    } catch (err) {
      const message = errorMessage(err, "Failed to review leave");
      setError(message);
      notifyError(message);
    } finally {
      setReviewingId("");
    }
  };

  const stats = useMemo(
    () => ({
      pending: myLeaves.filter((leave) => leave.status === "Pending").length,
      approved: myLeaves.filter((leave) => leave.status === "Approved").length,
      rejected: myLeaves.filter((leave) => leave.status === "Rejected").length,
    }),
    [myLeaves]
  );

  const actionablePendingLeaves = pendingLeaves.filter(
    (leave) => getEntityId(leave.user) !== currentUserId
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <Navbar_Dashboard />

      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div>
          <p className="text-sm font-medium uppercase text-indigo-600 dark:text-indigo-300">
            Leave operations
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            <FiClipboard aria-hidden="true" /> Leave
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
            Employees can request time off, while managers can clear pending
            requests without leaving the workspace.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {stats.pending}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {stats.approved}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {stats.rejected}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <FiSend aria-hidden="true" /> Request leave
            </h2>
            <form onSubmit={submitLeave} className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Type
                <select
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
                  disabled={submitting}
                  className="mt-1 w-full rounded border px-3 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {LEAVE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Start date
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => updateField("startDate", e.target.value)}
                    disabled={submitting}
                    required
                    className="mt-1 w-full rounded border px-3 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  End date
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => updateField("endDate", e.target.value)}
                    disabled={submitting}
                    required
                    className="mt-1 w-full rounded border px-3 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </label>
              </div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Reason
                <textarea
                  value={form.reason}
                  onChange={(e) => updateField("reason", e.target.value)}
                  disabled={submitting}
                  rows={4}
                  className="mt-1 w-full rounded border px-3 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:bg-gray-400"
              >
                <FiSend aria-hidden="true" />
                {submitting ? "Submitting..." : "Submit request"}
              </button>
            </form>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <FiClock aria-hidden="true" /> My requests
            </h2>
            {loading ? (
              <LeaveSkeleton />
            ) : myLeaves.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                Your leave requests will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {myLeaves.map((leave) => (
                  <LeaveCard key={leave._id} leave={leave} />
                ))}
              </div>
            )}
          </section>
        </div>

        {reviewer && (
          <section className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <FiCheck aria-hidden="true" /> Pending approvals
            </h2>
            {loading ? (
              <LeaveSkeleton />
            ) : actionablePendingLeaves.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                No pending requests need your approval.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {actionablePendingLeaves.map((leave) => (
                  <LeaveCard
                    key={leave._id}
                    leave={leave}
                    actions={
                      <div className="space-y-3">
                        <input
                          value={reviewNotes[leave._id] || ""}
                          onChange={(e) =>
                            setReviewNotes((prev) => ({
                              ...prev,
                              [leave._id]: e.target.value,
                            }))
                          }
                          placeholder="Review note"
                          className="w-full rounded border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => reviewLeave(leave, "Approved")}
                            disabled={reviewingId === leave._id}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:bg-gray-400"
                          >
                            <FiCheck aria-hidden="true" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => reviewLeave(leave, "Rejected")}
                            disabled={reviewingId === leave._id}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950"
                          >
                            <FiX aria-hidden="true" /> Reject
                          </button>
                        </div>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default HrLeaves;

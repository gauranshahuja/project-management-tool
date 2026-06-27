import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBriefcase,
  FiDollarSign,
  FiEdit2,
  FiLock,
  FiSearch,
  FiUsers,
  FiX,
} from "react-icons/fi";
import Navbar_Dashboard from "../components/Navbar_dashboard";
import axios from "../services/axiosInstance";
import { getStoredUser } from "../utils/authStorage";
import { getEntityId } from "../utils/ids";
import { errorMessage, notifyError, notifySuccess } from "../utils/toast";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"];
const PROFILE_STATUSES = ["Active", "On Leave", "Resigned", "Terminated"];

const isHrManager = (user) => ["Owner", "Admin"].includes(user?.role);

const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatShortDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatMoney = (value) => {
  if (value === undefined || value === null || value === "") return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
};

const profileDefaults = {
  employeeId: "",
  department: "",
  designation: "",
  employmentType: "Full-time",
  joiningDate: "",
  phone: "",
  status: "Active",
  monthlySalary: "",
};

const StatCard = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <Icon className={tone} aria-hidden="true" />
    </div>
    <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
      {value}
    </p>
  </div>
);

const EmployeesSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-44 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    ))}
  </div>
);

const ProfileModal = ({ employee, onClose, onSaved }) => {
  const [form, setForm] = useState(() => ({
    ...profileDefaults,
    ...(employee.profile || {}),
    joiningDate: formatDateInput(employee.profile?.joiningDate),
    monthlySalary:
      employee.profile?.monthlySalary === undefined ||
      employee.profile?.monthlySalary === null
        ? ""
        : String(employee.profile.monthlySalary),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        employeeId: form.employeeId.trim(),
        department: form.department.trim(),
        designation: form.designation.trim(),
        employmentType: form.employmentType,
        joiningDate: form.joiningDate || undefined,
        phone: form.phone.trim(),
        status: form.status,
        monthlySalary:
          form.monthlySalary === "" ? 0 : Number(form.monthlySalary),
      };

      const res = await axios.put(`/hr/employees/${employee.userId}`, payload);
      onSaved(employee.userId, res.data);
      notifySuccess("Employee profile saved.");
    } catch (err) {
      const message = errorMessage(err, "Failed to save employee profile");
      setError(message);
      notifyError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={() => !saving && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit HR profile
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {employee.name} - {employee.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Employee ID
            <input
              value={form.employeeId}
              onChange={(e) => updateField("employeeId", e.target.value)}
              disabled={saving}
              className="mt-1 w-full rounded border px-3 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Department
            <input
              value={form.department}
              onChange={(e) => updateField("department", e.target.value)}
              disabled={saving}
              className="mt-1 w-full rounded border px-3 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Designation
            <input
              value={form.designation}
              onChange={(e) => updateField("designation", e.target.value)}
              disabled={saving}
              className="mt-1 w-full rounded border px-3 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Phone
            <input
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              disabled={saving}
              className="mt-1 w-full rounded border px-3 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Employment type
            <select
              value={form.employmentType}
              onChange={(e) => updateField("employmentType", e.target.value)}
              disabled={saving}
              className="mt-1 w-full rounded border px-3 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Status
            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              disabled={saving}
              className="mt-1 w-full rounded border px-3 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {PROFILE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Joining date
            <input
              type="date"
              value={form.joiningDate}
              onChange={(e) => updateField("joiningDate", e.target.value)}
              disabled={saving}
              className="mt-1 w-full rounded border px-3 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Monthly salary
            <input
              type="number"
              min="0"
              value={form.monthlySalary}
              onChange={(e) => updateField("monthlySalary", e.target.value)}
              disabled={saving}
              className="mt-1 w-full rounded border px-3 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:bg-gray-400"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
};

const HrEmployees = () => {
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const canManage = isHrManager(currentUser);
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    if (!currentUser?.token) {
      navigate("/");
      return;
    }

    if (!canManage) {
      setLoading(false);
      return;
    }

    axios
      .get("/hr/employees")
      .then((res) => setEmployees(res.data))
      .catch((err) => setError(errorMessage(err, "Failed to load employees")))
      .finally(() => setLoading(false));
  }, [canManage, currentUser?.token, navigate]);

  const filteredEmployees = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return employees;

    return employees.filter((employee) => {
      const profile = employee.profile || {};
      return [
        employee.name,
        employee.email,
        employee.role,
        profile.employeeId,
        profile.department,
        profile.designation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [employees, query]);

  const metrics = useMemo(() => {
    const active = employees.filter(
      (employee) => employee.profile?.status !== "Terminated"
    ).length;
    const departments = new Set(
      employees.map((employee) => employee.profile?.department).filter(Boolean)
    ).size;
    const payroll = employees.reduce(
      (sum, employee) => sum + Number(employee.profile?.monthlySalary || 0),
      0
    );

    return { active, departments, payroll };
  }, [employees]);

  const handleSaved = (userId, profile) => {
    setEmployees((prev) =>
      prev.map((employee) =>
        getEntityId(employee.userId) === getEntityId(userId)
          ? { ...employee, profile }
          : employee
      )
    );
    setEditingEmployee(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <Navbar_Dashboard />

      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-indigo-600 dark:text-indigo-300">
              HR command center
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              <FiUsers aria-hidden="true" /> Employees
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
              Keep employee profiles, departments, designations, and salary data
              aligned with your organization.
            </p>
          </div>
          {canManage && (
            <label className="relative w-full lg:w-80">
              <FiSearch
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search employees"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-indigo-950"
              />
            </label>
          )}
        </div>

        {!canManage ? (
          <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
            <div className="flex items-start gap-3">
              <FiLock className="mt-1 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">HR manager access required</h2>
                <p className="mt-1 text-sm">
                  Employee directory and salary operations are available to
                  Owner and Admin roles.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={FiUsers}
                label="Active workforce"
                value={metrics.active}
                tone="text-indigo-500"
              />
              <StatCard
                icon={FiBriefcase}
                label="Departments"
                value={metrics.departments}
                tone="text-emerald-500"
              />
              <StatCard
                icon={FiDollarSign}
                label="Monthly payroll"
                value={formatMoney(metrics.payroll)}
                tone="text-amber-500"
              />
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            <section className="mt-6">
              {loading ? (
                <EmployeesSkeleton />
              ) : filteredEmployees.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <FiUsers className="mx-auto text-3xl text-gray-400" />
                  <h2 className="mt-3 font-semibold text-gray-900 dark:text-white">
                    No employees found
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Try a different search term.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredEmployees.map((employee) => {
                    const profile = employee.profile || {};
                    const initials = (employee.name || employee.email || "?")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <article
                        key={getEntityId(employee.userId)}
                        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                              {employee.avatar ? (
                                <img
                                  src={employee.avatar}
                                  alt=""
                                  className="h-full w-full rounded-full object-cover"
                                />
                              ) : (
                                initials
                              )}
                            </div>
                            <div className="min-w-0">
                              <h2 className="truncate font-semibold text-gray-900 dark:text-white">
                                {employee.name}
                              </h2>
                              <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                                {employee.email}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingEmployee(employee)}
                            className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800"
                            aria-label={`Edit ${employee.name}`}
                          >
                            <FiEdit2 aria-hidden="true" />
                          </button>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Role</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {employee.role}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Status</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {profile.status || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Department</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {profile.department || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Designation</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {profile.designation || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Joined</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatShortDate(profile.joiningDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Salary</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatMoney(profile.monthlySalary)}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {editingEmployee && (
        <ProfileModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default HrEmployees;

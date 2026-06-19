import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiDollarSign,
  FiFileText,
  FiLock,
  FiRefreshCw,
} from "react-icons/fi";
import Navbar_Dashboard from "../components/Navbar_dashboard";
import { useConfirm } from "../components/ConfirmDialog";
import axios from "../services/axiosInstance";
import { getStoredUser } from "../utils/authStorage";
import { getEntityId } from "../utils/ids";
import { errorMessage, notifyError, notifySuccess } from "../utils/toast";

const isHrManager = (user) => ["Owner", "Admin"].includes(user?.role);

const monthKey = () => new Date().toISOString().slice(0, 7);

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const statusClasses = {
  Draft:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  Paid:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

const PayslipCard = ({ payslip, showUser, action }) => (
  <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {payslip.month}
          </h3>
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              statusClasses[payslip.status] || statusClasses.Draft
            }`}
          >
            {payslip.status || "Draft"}
          </span>
        </div>
        {showUser && payslip.user && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {payslip.user.name} - {payslip.user.email}
          </p>
        )}
      </div>
      <p className="text-xl font-semibold text-gray-900 dark:text-white">
        {formatMoney(payslip.netPay)}
      </p>
    </div>

    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">Basic</p>
        <p className="font-semibold text-gray-900 dark:text-white">
          {formatMoney(payslip.basic)}
        </p>
      </div>
      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">Allowances</p>
        <p className="font-semibold text-gray-900 dark:text-white">
          {formatMoney(payslip.allowances)}
        </p>
      </div>
      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">Deductions</p>
        <p className="font-semibold text-gray-900 dark:text-white">
          {formatMoney(payslip.deductions)}
        </p>
      </div>
    </div>

    {action && <div className="mt-4">{action}</div>}
  </article>
);

const PayrollSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, index) => (
      <div
        key={index}
        className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          <div className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          <div className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    ))}
  </div>
);

const HrPayroll = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const currentUser = getStoredUser();
  const canManage = isHrManager(currentUser);
  const [myPayslips, setMyPayslips] = useState([]);
  const [orgPayslips, setOrgPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(monthKey());
  const [form, setForm] = useState({
    userId: "",
    month: monthKey(),
    allowances: "0",
    deductions: "0",
  });
  const [loading, setLoading] = useState(true);
  const [orgLoading, setOrgLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payingId, setPayingId] = useState("");
  const [error, setError] = useState("");

  const loadMine = async () => {
    const res = await axios.get("/hr/payslips/me");
    setMyPayslips(res.data || []);
  };

  const loadOrg = async (month = selectedMonth) => {
    if (!canManage) return;
    setOrgLoading(true);
    try {
      const res = await axios.get("/hr/payslips", { params: { month } });
      setOrgPayslips(res.data || []);
    } catch (err) {
      notifyError(errorMessage(err, "Failed to load payroll month"));
    } finally {
      setOrgLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!canManage) return;
    const res = await axios.get("/hr/employees");
    const data = res.data || [];
    setEmployees(data);
    setForm((prev) => ({
      ...prev,
      userId: prev.userId || getEntityId(data[0]?.userId),
    }));
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
        await Promise.all([loadMine(), loadEmployees()]);
        await loadOrg(selectedMonth);
      } catch (err) {
        setError(errorMessage(err, "Failed to load payroll"));
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.token, navigate]);

  useEffect(() => {
    loadOrg(selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const generatePayslip = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await axios.post("/hr/payslips", {
        userId: form.userId,
        month: form.month,
        allowances: Number(form.allowances || 0),
        deductions: Number(form.deductions || 0),
      });
      setSelectedMonth(form.month);
      await Promise.all([loadMine(), loadOrg(form.month)]);
      notifySuccess("Payslip generated.");
    } catch (err) {
      const message = errorMessage(err, "Failed to generate payslip");
      setError(message);
      notifyError(message);
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (payslip) => {
    const confirmed = await confirm({
      title: "Mark payslip paid?",
      message: `${payslip.user?.name || "This employee"} will move from Draft to Paid.`,
      confirmText: "Mark paid",
    });

    if (!confirmed) return;

    setPayingId(payslip._id);
    setError("");
    try {
      await axios.patch(`/hr/payslips/${payslip._id}/pay`);
      await Promise.all([loadMine(), loadOrg(selectedMonth)]);
      notifySuccess("Payslip marked paid.");
    } catch (err) {
      const message = errorMessage(err, "Failed to mark payslip paid");
      setError(message);
      notifyError(message);
    } finally {
      setPayingId("");
    }
  };

  const totals = useMemo(
    () =>
      orgPayslips.reduce(
        (acc, payslip) => ({
          net: acc.net + Number(payslip.netPay || 0),
          paid:
            acc.paid +
            (payslip.status === "Paid" ? Number(payslip.netPay || 0) : 0),
          drafts: acc.drafts + (payslip.status === "Draft" ? 1 : 0),
        }),
        { net: 0, paid: 0, drafts: 0 }
      ),
    [orgPayslips]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <Navbar_Dashboard />

      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-indigo-600 dark:text-indigo-300">
              Payroll control
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              <FiDollarSign aria-hidden="true" /> Payroll
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
              Generate monthly payslips, track salary status, and give employees
              a clean self-service payroll record.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              loadMine();
              loadOrg(selectedMonth);
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

        {canManage ? (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">Month total</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatMoney(totals.net)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">Paid</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatMoney(totals.paid)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">Drafts</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {totals.drafts}
                </p>
              </div>
            </div>

            <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <form
                onSubmit={generatePayslip}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <FiFileText aria-hidden="true" /> Generate payslip
                </h2>
                <div className="mt-4 space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Employee
                    <select
                      value={form.userId}
                      onChange={(e) => updateField("userId", e.target.value)}
                      disabled={saving || employees.length === 0}
                      required
                      className="mt-1 w-full rounded border px-3 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      {employees.map((employee) => (
                        <option
                          key={getEntityId(employee.userId)}
                          value={getEntityId(employee.userId)}
                        >
                          {employee.name} - {employee.profile?.designation || employee.role}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Month
                    <input
                      type="month"
                      value={form.month}
                      onChange={(e) => updateField("month", e.target.value)}
                      disabled={saving}
                      required
                      className="mt-1 w-full rounded border px-3 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Allowances
                      <input
                        type="number"
                        min="0"
                        value={form.allowances}
                        onChange={(e) => updateField("allowances", e.target.value)}
                        disabled={saving}
                        className="mt-1 w-full rounded border px-3 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </label>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Deductions
                      <input
                        type="number"
                        min="0"
                        value={form.deductions}
                        onChange={(e) => updateField("deductions", e.target.value)}
                        disabled={saving}
                        className="mt-1 w-full rounded border px-3 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={saving || employees.length === 0}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:bg-gray-400"
                  >
                    <FiFileText aria-hidden="true" />
                    {saving ? "Generating..." : "Generate or update"}
                  </button>
                </div>
              </form>

              <section>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <FiDollarSign aria-hidden="true" /> Month payroll
                  </h2>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="rounded border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                {loading || orgLoading ? (
                  <PayrollSkeleton />
                ) : orgPayslips.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                    No payslips generated for this month.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orgPayslips.map((payslip) => (
                      <PayslipCard
                        key={payslip._id}
                        payslip={payslip}
                        showUser
                        action={
                          payslip.status === "Draft" && (
                            <button
                              type="button"
                              onClick={() => markPaid(payslip)}
                              disabled={payingId === payslip._id}
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:bg-gray-400"
                            >
                              <FiCheckCircle aria-hidden="true" />
                              {payingId === payslip._id ? "Marking..." : "Mark paid"}
                            </button>
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            </section>
          </>
        ) : (
          <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start gap-3">
              <FiLock className="mt-1 shrink-0 text-gray-400" aria-hidden="true" />
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Self-service payroll
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Payroll generation is restricted to Owner and Admin roles.
                  Your own payslips are still available below.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <FiFileText aria-hidden="true" /> My payslips
          </h2>
          {loading ? (
            <PayrollSkeleton />
          ) : myPayslips.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              Your payslips will appear here after payroll is generated.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {myPayslips.map((payslip) => (
                <PayslipCard key={payslip._id} payslip={payslip} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default HrPayroll;

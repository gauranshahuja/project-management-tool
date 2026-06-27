import { lazy, Suspense, useEffect, useState } from "react";
import {
  FiActivity,
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiLayers,
  FiLock,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import Navbar from "../components/Navbar";

const AuthModal = lazy(() => import("../components/AuthModal"));

const metrics = [
  { label: "Live workstreams", value: "12" },
  { label: "On-time delivery", value: "94%" },
  { label: "Open blockers", value: "3" },
];

const operatingCards = [
  {
    icon: FiBriefcase,
    title: "Company workspace",
    text: "Separate companies, roles, members, invites, and project ownership in one clear operating layer.",
    accent: "text-indigo-600 dark:text-indigo-300",
  },
  {
    icon: FiCheckCircle,
    title: "Execution control",
    text: "Projects, tasks, priorities, assignees, comments, and Kanban give every manager the same source of truth.",
    accent: "text-emerald-600 dark:text-emerald-300",
  },
  {
    icon: FiBarChart2,
    title: "Owner visibility",
    text: "Analytics, activity logs, overdue work, and top assignees make progress visible without status meetings.",
    accent: "text-amber-600 dark:text-amber-300",
  },
  {
    icon: FiLock,
    title: "Role-aware governance",
    text: "Owners, admins, managers, and members each see the controls they should use and nothing more.",
    accent: "text-rose-600 dark:text-rose-300",
  },
];

const activityRows = [
  ["High priority", "Vendor onboarding", "In Progress", "Mon"],
  ["Owner review", "Quarterly roadmap", "Not Started", "Thu"],
  ["Completed", "Payroll policy draft", "Completed", "Today"],
];

const trustSignals = [
  "Org-scoped data",
  "Role-based controls",
  "Task comments",
  "Activity audit log",
  "Analytics overview",
  "Invite workflow",
];

const LandingPage = ({ showAuth = false }) => {
  const [showAuthModal, setShowAuthModal] = useState(showAuth);
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    if (showAuth) {
      setAuthMode("login");
      setShowAuthModal(true);
    }
  }, [showAuth]);

  const openAuth = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-white text-gray-950 dark:bg-gray-950 dark:text-white">
      <Navbar onLogin={() => openAuth("login")} onRegister={() => openAuth("register")} />

      <main>
        <section className="relative overflow-hidden border-b border-gray-200 bg-gray-50 px-4 pb-16 pt-28 dark:border-gray-800 dark:bg-gray-950 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-sm font-medium text-indigo-700 shadow-sm dark:border-indigo-800 dark:bg-gray-900 dark:text-indigo-200">
              <FiTrendingUp aria-hidden="true" />
              Built for owners who need operational control
            </div>

            <h1 className="mt-6 max-w-5xl text-4xl font-semibold tracking-tight text-gray-950 dark:text-white sm:text-6xl lg:text-7xl">
              ProjectHub
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300 sm:text-xl">
              A premium company operating system for projects, people, priorities,
              and performance. Built to help business owners see what is moving,
              what is blocked, and who owns the next step.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => openAuth("register")}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Start workspace
              </button>
              <a
                href="#operating-system"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                See operating model
              </a>
            </div>

            <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <p className="text-3xl font-semibold text-gray-950 dark:text-white">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 w-full max-w-6xl overflow-hidden border border-gray-200 bg-white text-left shadow-2xl dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <div>
                  <p className="text-sm font-semibold text-gray-950 dark:text-white">
                    Executive command center
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Projects, people, and activity in one operating view
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                  Live
                </span>
              </div>

              <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
                <aside className="border-b border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950 lg:border-b-0 lg:border-r">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Workspace
                  </p>
                  <div className="mt-4 space-y-2">
                    {["Overview", "Projects", "My Tasks", "Activity", "Team"].map(
                      (item, index) => (
                        <div
                          key={item}
                          className={`flex items-center justify-between px-3 py-2 text-sm ${
                            index === 0
                              ? "bg-indigo-600 text-white"
                              : "text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          <span>{item}</span>
                          {index === 0 && <FiActivity aria-hidden="true" />}
                        </div>
                      )
                    )}
                  </div>
                </aside>

                <div className="p-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="border border-gray-200 p-4 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Projects
                        </p>
                        <FiLayers className="text-indigo-500" aria-hidden="true" />
                      </div>
                      <p className="mt-2 text-3xl font-semibold">18</p>
                    </div>
                    <div className="border border-gray-200 p-4 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Team members
                        </p>
                        <FiUsers className="text-emerald-500" aria-hidden="true" />
                      </div>
                      <p className="mt-2 text-3xl font-semibold">42</p>
                    </div>
                    <div className="border border-gray-200 p-4 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Overdue
                        </p>
                        <FiClock className="text-rose-500" aria-hidden="true" />
                      </div>
                      <p className="mt-2 text-3xl font-semibold">2</p>
                    </div>
                  </div>

                  <div className="mt-5 overflow-hidden border border-gray-200 dark:border-gray-800">
                    <div className="grid grid-cols-[1.2fr_1.6fr_1fr_0.8fr] bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                      <span>Priority</span>
                      <span>Workstream</span>
                      <span>Status</span>
                      <span>Due</span>
                    </div>
                    {activityRows.map(([priority, workstream, status, due]) => (
                      <div
                        key={workstream}
                        className="grid grid-cols-[1.2fr_1.6fr_1fr_0.8fr] border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-800"
                      >
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          {priority}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {workstream}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {status}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">{due}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="operating-system"
          className="border-b border-gray-200 bg-white px-4 py-20 dark:border-gray-800 dark:bg-gray-950 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
                Operating model
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 dark:text-white sm:text-5xl">
                Built for businesses that need fewer status meetings and more
                accountable execution.
              </h2>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {operatingCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <Icon className={item.accent} size={24} aria-hidden="true" />
                    <h3 className="mt-5 text-lg font-semibold text-gray-950 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="features" className="bg-gray-50 px-4 py-20 dark:bg-gray-900 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
                  Business value
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-gray-950 dark:text-white sm:text-4xl">
                  The tools owners ask for after the first missed deadline.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                ProjectHub combines work management, team control, analytics,
                and governance so leaders can make decisions with current data.
              </p>
            </div>
            <FeatureSection />
          </div>
        </section>

        <section
          id="testimonials"
          className="border-y border-gray-200 bg-white px-4 py-20 dark:border-gray-800 dark:bg-gray-950 sm:px-6"
        >
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">
                Executive proof
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-gray-950 dark:text-white sm:text-4xl">
                A cleaner operating rhythm for owners, managers, and teams.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <blockquote className="border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-lg font-medium leading-7 text-gray-900 dark:text-white">
                  "I can see delayed work, responsible owners, and team activity
                  before asking for an update."
                </p>
                <footer className="mt-5 text-sm text-gray-500 dark:text-gray-400">
                  Operations Director, services business
                </footer>
              </blockquote>
              <blockquote className="border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-lg font-medium leading-7 text-gray-900 dark:text-white">
                  "The role controls make it feel ready for a real company, not
                  just a personal task app."
                </p>
                <footer className="mt-5 text-sm text-gray-500 dark:text-gray-400">
                  Founder, multi-team startup
                </footer>
              </blockquote>
            </div>
          </div>
        </section>

        <section id="newsletter" className="bg-gray-950 px-4 py-20 text-white sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
                Ready for a sharper command center
              </p>
              <h2 className="mt-3 max-w-3xl text-3xl font-semibold sm:text-5xl">
                Bring projects, accountability, and company visibility into one
                workspace.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openAuth("register")}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-gray-950 transition hover:bg-gray-100"
            >
              Create your workspace
            </button>
          </div>
        </section>

        <section id="contact" className="bg-white px-4 py-16 dark:bg-gray-950 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-3">
            {trustSignals.map((signal) => (
              <span
                key={signal}
                className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-200"
              >
                {signal}
              </span>
            ))}
          </div>
        </section>
      </main>

      {showAuthModal && (
        <Suspense fallback={null}>
          <AuthModal mode={authMode} onClose={() => setShowAuthModal(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default LandingPage;

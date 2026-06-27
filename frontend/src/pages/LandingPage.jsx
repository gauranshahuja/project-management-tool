import { lazy, Suspense, useEffect, useState } from "react";
import {
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiLock,
  FiTrendingUp,
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import FeatureSection from "../components/FeatureSection";

const AuthModal = lazy(() => import("../components/AuthModal"));

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

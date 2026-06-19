import { useNavigate, NavLink } from "react-router-dom";
import { FiLogOut, FiSun, FiMoon, FiUser } from "react-icons/fi";
import { useEffect, useRef, useState } from "react";
import {
  clearStoredUser,
  getStoredUser,
  getStoredOrganization,
} from "../utils/authStorage";
import { disconnectSocket } from "../utils/socket";
import NotificationBell from "./NotificationBell";

const navLinkClasses = ({ isActive }) =>
  `rounded px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
      : "text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-300"
  }`;

const Navbar_Dashboard = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const isHrManager = ["Owner", "Admin"].includes(user?.role);

  const navItems = [
    { to: "/dashboard", label: "Projects" },
    { to: "/my-tasks", label: "My Tasks" },
    { to: "/analytics", label: "Overview" },
    { to: "/activity", label: "Activity" },
    { to: "/members", label: "Team" },
    { to: "/inventory", label: "Inventory" },
    { to: "/hr/attendance", label: "Attendance" },
    { to: "/hr/leaves", label: "Leave" },
    { to: "/hr/payroll", label: "Payroll" },
    ...(isHrManager
      ? [{ to: "/hr/employees", label: "Employees" }]
      : []),
  ];

  useEffect(() => {
    setUser(getStoredUser());
    setOrg(getStoredOrganization());
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    disconnectSocket();
    clearStoredUser();
    navigate("/");
  };

  const toggleDarkMode = () => {
    const html = document.documentElement;
    const nextIsDark = !isDark;

    html.classList.toggle("dark", nextIsDark);
    localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    setIsDark(nextIsDark);
  };

  return (
    <nav className="flex items-center justify-between bg-white px-4 py-4 shadow dark:bg-gray-900 sm:px-6">
      <div className="flex items-center gap-6 min-w-0">
        <button
          type="button"
          className="min-w-0 truncate text-left text-xl font-bold text-indigo-600"
          onClick={() => navigate("/dashboard")}
          title={org?.name || "ProjectHub"}
        >
          {org?.name || "ProjectHub"}
        </button>

        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClasses}>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="relative flex items-center gap-2 sm:gap-4">
        {user?.token && <NotificationBell />}

        <button
          type="button"
          onClick={toggleDarkMode}
          className="rounded-md p-2 text-gray-600 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800"
          title="Toggle dark mode"
          aria-label="Toggle dark mode"
        >
          {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex min-w-0 items-center gap-2 rounded-md px-2 py-2 text-gray-700 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
          >
            <FiUser aria-hidden="true" />
            <span className="hidden max-w-[140px] truncate sm:inline">
              {user?.name || "User"}
            </span>
            {user?.role && (
              <span className="hidden rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 md:inline">
                {user.role}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 z-50 mt-2 w-56 rounded border bg-white shadow dark:border-gray-700 dark:bg-gray-800"
              role="menu"
            >
              <div className="border-b px-4 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <p className="truncate font-medium text-gray-700 dark:text-gray-200">
                  {user?.name || "User"}
                </p>
                <p className="truncate">{user?.email}</p>
              </div>
              <div className="flex flex-col lg:hidden">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setDropdownOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiLogOut aria-hidden="true" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar_Dashboard;

import { useNavigate, NavLink } from "react-router-dom";
import { FiLogOut, FiSun, FiMoon, FiUser } from "react-icons/fi";
import { useEffect, useState } from "react";
import {
  clearStoredUser,
  getStoredUser,
  getStoredOrganization,
} from "../utils/authStorage";

const navLinkClasses = ({ isActive }) =>
  `rounded px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
      : "text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-300"
  }`;

const Navbar_Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setOrg(getStoredOrganization());
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const handleLogout = () => {
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
    <nav className="bg-white dark:bg-gray-900 shadow px-6 py-4 flex items-center justify-between">
      {/* Brand: org ka naam, fallback ProjectHub */}
      <div className="flex items-center gap-6 min-w-0">
        <div
          className="truncate text-xl font-bold text-indigo-600 cursor-pointer"
          onClick={() => navigate("/dashboard")}
          title={org?.name || "ProjectHub"}
        >
          {org?.name || "ProjectHub"}
        </div>

        <div className="hidden items-center gap-1 sm:flex">
          <NavLink to="/dashboard" className={navLinkClasses}>
            Projects
          </NavLink>
          <NavLink to="/my-tasks" className={navLinkClasses}>
            My Tasks
          </NavLink>
          <NavLink to="/members" className={navLinkClasses}>
            Team
          </NavLink>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4 relative">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="text-gray-600 dark:text-gray-300 hover:text-indigo-600"
          title="Toggle dark mode"
        >
          {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600"
          >
            <FiUser />
            <span className="max-w-[140px] truncate">{user?.name || "User"}</span>
            {user?.role && (
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
                {user.role}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow z-50">
              <div className="border-b px-4 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {user?.email}
              </div>
              <div className="flex flex-col sm:hidden">
                <NavLink
                  to="/dashboard"
                  className="px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  Projects
                </NavLink>
                <NavLink
                  to="/my-tasks"
                  className="px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  My Tasks
                </NavLink>
                <NavLink
                  to="/members"
                  className="px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  Team
                </NavLink>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar_Dashboard;

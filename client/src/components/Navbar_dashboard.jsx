import { useNavigate } from "react-router-dom";
import { FiLogOut, FiSun, FiMoon, FiUser } from "react-icons/fi";
import { useEffect, useState } from "react";
import { clearStoredUser, getStoredUser } from "../utils/authStorage";

const Navbar_Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
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
      {/* Logo or title */}
      <div
        className="text-xl font-bold text-indigo-600 cursor-pointer"
        onClick={() => navigate("/dashboard")}
      >
         MyDashboard
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
            {user?.name || "User"}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow z-50">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiLogOut /> Logout
              </button>
              {/* Optional future options:
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                <FiSettings /> Settings
              </button> */}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar_Dashboard;

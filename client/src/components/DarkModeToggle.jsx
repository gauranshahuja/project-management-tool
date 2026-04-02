import { useEffect, useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa";

function DarkModeToggle() {
  const [dark, setDark] = useState(
    localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  useEffect(() => {
    const root = window.document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="fixed top-6 right-6 z-50 bg-white dark:bg-gray-900 text-yellow-500 dark:text-gray-300 border border-gray-300 dark:border-gray-600 shadow p-3 rounded-full transition duration-300"
    >
      {dark ? <FaSun /> : <FaMoon />}
    </button>
  );
}

export default DarkModeToggle;

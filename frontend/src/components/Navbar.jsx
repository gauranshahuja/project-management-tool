import { useState, useEffect } from "react";
import { Link } from "react-scroll";
import { FaBars, FaTimes } from "react-icons/fa";
import DarkModeToggle from "./DarkModeToggle";

const Navbar = ({ onLogin, onRegister }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navLinks = [
    { name: "Operating Model", to: "operating-system" },
    { name: "Features", to: "features" },
    { name: "Trust", to: "contact" },
  ];

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const handleAuthClick = (action) => {
    action();
    setMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 dark:bg-gray-900/80 shadow"
          : "bg-transparent"
      } backdrop-blur-md`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-white">
          ProjectHub
        </h1>

        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              smooth
              duration={500}
              offset={-80}
              className="cursor-pointer text-gray-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {link.name}
            </Link>
          ))}

          <DarkModeToggle />

          <button
            type="button"
            onClick={onLogin}
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-white dark:hover:bg-gray-800 dark:hover:text-indigo-400"
          >
            Login
          </button>
          <button
            type="button"
            onClick={onRegister}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Register
          </button>
        </nav>

        <button
          onClick={toggleMenu}
          className="md:hidden text-2xl text-gray-800 dark:text-white"
          aria-label={menuOpen ? "Close Menu" : "Open Menu"}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 px-6 py-4 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              smooth
              duration={500}
              offset={-80}
              onClick={toggleMenu}
              className="block text-gray-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {link.name}
            </Link>
          ))}

          <DarkModeToggle />

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleAuthClick(onLogin)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => handleAuthClick(onRegister)}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Register
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

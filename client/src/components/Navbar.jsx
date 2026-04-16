// src/components/Navbar.jsx

import { useState, useEffect } from "react";
import { Link } from "react-scroll";
import { Link as RouterLink } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import DarkModeToggle from "./DarkModeToggle";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navLinks = [
    { name: "Features", to: "features" },
    { name: "Testimonials", to: "testimonials" },
    { name: "Newsletter", to: "newsletter" },
    { name: "Contact", to: "contact" },
  ];

  const toggleMenu = () => setMenuOpen(!menuOpen);

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
      } backdrop-blur`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-white">
          ProjectHub
        </h1>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              smooth={true}
              duration={500}
              offset={-80}
              className="cursor-pointer text-gray-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {link.name}
            </Link>
          ))}
          <DarkModeToggle />
          <RouterLink
            to="/login"
            className="text-gray-800 dark:text-white hover:text-indigo-600 transition"
          >
            Login
          </RouterLink>
          <RouterLink
            to="/register"
            className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Register
          </RouterLink>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-2xl text-gray-800 dark:text-white"
          aria-label="Toggle Menu"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 px-6 py-4 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              smooth={true}
              duration={500}
              offset={-80}
              onClick={toggleMenu}
              className="block text-gray-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {link.name}
            </Link>
          ))}
          <DarkModeToggle />
          <RouterLink
            to="/login"
            onClick={toggleMenu}
            className="block text-gray-800 dark:text-white hover:text-indigo-600"
          >
            Login
          </RouterLink>
          <RouterLink
            to="/register"
            onClick={toggleMenu}
            className="block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Register
          </RouterLink>
        </div>
      )}
    </header>
  );
};

export default Navbar;

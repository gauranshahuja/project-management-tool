// src/components/Navbar.jsx

import { useState } from "react";
import { Link } from "react-scroll";
import { FaBars, FaTimes } from "react-icons/fa";
import DarkModeToggle from "./DarkModeToggle";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const navLinks = [
    { name: "Features", to: "features" },
    { name: "Testimonials", to: "testimonials" },
    { name: "Newsletter", to: "newsletter" },
    { name: "Contact", to: "contact" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur z-50 shadow">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-white">
          ProjectHub
        </h1>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              smooth={true}
              duration={500}
              className="cursor-pointer text-gray-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {link.name}
            </Link>
          ))}
          <DarkModeToggle />
        </nav>

        {/* Mobile Nav Toggle */}
        <button onClick={toggleMenu} className="md:hidden text-2xl text-gray-800 dark:text-white">
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden px-6 py-4 space-y-4 bg-white dark:bg-gray-900">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              smooth={true}
              duration={500}
              onClick={toggleMenu}
              className="block text-gray-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {link.name}
            </Link>
          ))}
          <DarkModeToggle />
        </div>
      )}
    </header>
  );
};

export default Navbar;

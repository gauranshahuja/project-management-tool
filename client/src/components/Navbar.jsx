function Navbar({ toggleDarkMode }) {
  return (
    <nav className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md">
      <h2 className="text-xl font-bold text-indigo-600 dark:text-white">PMTool</h2>
      <button
        onClick={toggleDarkMode}
        className="bg-indigo-500 text-white px-4 py-1 rounded hover:bg-indigo-600 transition"
      >
        Toggle Dark Mode
      </button>
    </nav>
  );
}

export default Navbar;

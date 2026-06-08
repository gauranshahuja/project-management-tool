// client/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/axiosInstance";
import { FiPlus } from "react-icons/fi";
import DashboardCard from "../components/DashboardCard";
import Navbar_Dashboard from "../components/Navbar_dashboard";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ Load projects on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = user?.token;

    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("/projects", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProjects(res.data))
      .catch((err) => {
        console.error("Failed to fetch projects:", err.response?.data || err.message);
      });
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Create new project
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      if (!token) {
        navigate("/login");
        return;
      }

      const res = await axios.post(
        "/projects",
        { ...form },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProjects((prev) => [...prev, res.data]);
      setShowModal(false);
      setForm({ title: "", description: "" });
    } catch (err) {
      console.error("Project creation error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Project creation failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      {/* ✅ Dashboard Navbar */}
      <Navbar_Dashboard />

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Your Projects
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition"
          >
            <FiPlus size={20} /> New Project
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">
            No projects found. Create one!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <DashboardCard
                key={project._id}
                project={project}
                onClick={() => navigate(`/project/${project._id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ✅ Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white text-xl"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">
              Create Project
            </h2>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Project Title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-white"
              />
              <textarea
                name="description"
                placeholder="Project Description"
                value={form.description}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-white"
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
              >
                Create
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

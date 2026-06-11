// client/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/axiosInstance";
import { getStoredUser } from "../utils/authStorage";
import { FiPlus, FiX } from "react-icons/fi";
import DashboardCard from "../components/DashboardCard";
import Navbar_Dashboard from "../components/Navbar_dashboard";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Completed"];

const emptyProjectForm = {
  title: "",
  description: "",
  status: "Not Started",
  dueDate: "",
};

const toDateInputValue = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const createProjectPayload = (form, options = {}) => {
  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    status: form.status,
  };

  if (form.dueDate) {
    payload.dueDate = form.dueDate;
  } else if (options.includeEmptyDueDate) {
    payload.dueDate = null;
  }

  return payload;
};

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [form, setForm] = useState(emptyProjectForm);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const getErrorMessage = (err, fallback) =>
    err.response?.data?.error || err.response?.data?.message || fallback;

  // Load projects on mount
  useEffect(() => {
    const user = getStoredUser();

    if (!user?.token) {
      navigate("/");
      return;
    }

    axios
      .get("/projects")
      .then((res) => setProjects(res.data))
      .catch((err) => {
        console.error("Failed to fetch projects:", err.response?.data || err.message);
        setError(getErrorMessage(err, "Failed to fetch projects"));
      });
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingProjectId(null);
    setForm(emptyProjectForm);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setModalMode("edit");
    setEditingProjectId(project._id);
    setForm({
      title: project.title || "",
      description: project.description || "",
      status: project.status || "Not Started",
      dueDate: toDateInputValue(project.dueDate),
    });
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMode("create");
    setEditingProjectId(null);
    setForm(emptyProjectForm);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const user = getStoredUser();

      if (!user?.token) {
        navigate("/");
        return;
      }

      const payload = createProjectPayload(form, {
        includeEmptyDueDate: modalMode === "edit",
      });

      if (!payload.title) {
        setError("Project title is required.");
        return;
      }

      if (modalMode === "edit" && editingProjectId) {
        const res = await axios.put(`/projects/${editingProjectId}`, payload);

        setProjects((prev) =>
          prev.map((project) =>
            project._id === editingProjectId ? res.data : project
          )
        );
      } else {
        const res = await axios.post("/projects", payload);
        setProjects((prev) => [...prev, res.data]);
      }

      closeModal();
    } catch (err) {
      console.error("Project save error:", err.response?.data || err.message);
      setError(
        getErrorMessage(
          err,
          modalMode === "edit" ? "Project update failed" : "Project creation failed"
        )
      );
    }
  };

  const handleDeleteProject = async (project) => {
    if (!window.confirm(`Delete "${project.title}"?`)) return;

    setError("");

    try {
      await axios.delete(`/projects/${project._id}`);
      setProjects((prev) => prev.filter((item) => item._id !== project._id));
    } catch (err) {
      console.error("Project delete error:", err.response?.data || err.message);
      setError(getErrorMessage(err, "Project delete failed"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      {/*  Dashboard Navbar */}
      <Navbar_Dashboard />

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Your Projects
          </h1>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition"
          >
            <FiPlus size={20} /> New Project
          </button>
        </div>

        {error && !showModal && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        )}

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
                onClick={() =>
                  navigate(`/projects/${project._id}`, { state: { project } })
                }
                onEdit={openEditModal}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </div>

      {/*  Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white text-xl"
              aria-label="Close project form"
            >
              <FiX aria-hidden="true" />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">
              {modalMode === "edit" ? "Edit Project" : "Create Project"}
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
                className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-white"
              />
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-white"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-white"
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
              >
                {modalMode === "edit" ? "Save Changes" : "Create"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

import { useState } from "react";
import axios from "../services/axiosInstance";
import { getStoredUser } from "../utils/authStorage";
import { FiX } from "react-icons/fi";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Completed"];

const emptyProjectForm = {
  title: "",
  description: "",
  status: "Not Started",
  dueDate: "",
};

const createProjectPayload = (form) => {
  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    status: form.status,
  };

  if (form.dueDate) {
    payload.dueDate = form.dueDate;
  }

  return payload;
};

const CreateProjectModal = ({ onClose, onProjectCreated }) => {
  const [form, setForm] = useState(emptyProjectForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (err, fallback) =>
    err.response?.data?.error || err.response?.data?.message || fallback;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = getStoredUser();

      if (!user?.token) {
        setError("Please login again.");
        return;
      }

      const payload = createProjectPayload(form);
      if (!payload.title) {
        setError("Project title is required.");
        return;
      }

      const res = await axios.post("/projects", payload);

      onProjectCreated(res.data);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Project creation failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-md shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black dark:text-gray-300 dark:hover:text-white text-xl"
          aria-label="Close project form"
        >
          <FiX aria-hidden="true" />
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center dark:text-white">
          Create New Project
        </h2>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            placeholder="Project Title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
          />

          <textarea
            name="description"
            placeholder="Project Description"
            value={form.description}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
          />

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
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
            className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded transition"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;

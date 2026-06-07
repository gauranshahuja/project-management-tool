import { useState } from "react";
import axios from "../services/axiosInstance";

const CreateProjectModal = ({ onClose, onProjectCreated }) => {
  const [form, setForm] = useState({ title: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await axios.post(
        "/user/projects",
        { ...form, owner: user.id },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      onProjectCreated(res.data); // Notify parent to refresh project list
      onClose(); // Close modal
    } catch (err) {
      setError(err.response?.data?.message || "Project creation failed");
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
        >
          ✕
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
            required
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

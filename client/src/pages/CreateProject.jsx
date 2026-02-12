import { useState } from "react";
import axios from "../services/axiosInstance";
import { useNavigate } from "react-router-dom";

function CreateProject() {
  const [form, setForm] = useState({ title: "", description: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await axios.post(
        "/projects",
        { ...form, owner: user.id },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      // Redirect to dashboard after successful creation
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Project creation failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Create Project</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <input
          type="text"
          name="title"
          placeholder="Project Title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full mb-3 p-2 border rounded"
        />

        <textarea
          name="description"
          placeholder="Project Description"
          value={form.description}
          onChange={handleChange}
          required
          className="w-full mb-3 p-2 border rounded"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded"
        >
          Create
        </button>
      </form>
    </div>
  );
}

export default CreateProject;

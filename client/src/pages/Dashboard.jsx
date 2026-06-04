import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/axiosInstance";
import { FiPlus } from "react-icons/fi";
import DashboardCard from "../components/DashboardCard";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return navigate("/login");

    axios
      .get("/projects", {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      .then((res) => setProjects(res.data))
      .catch((err) => console.error(err));
  }, [navigate]);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Your Projects
        </h1>
        <button
          onClick={() => navigate("/create-project")}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition"
        >
          <FiPlus size={20} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">No projects found. Create one!</p>
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
  );
};

export default Dashboard;

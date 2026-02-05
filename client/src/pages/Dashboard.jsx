import { useEffect, useState } from "react";
import axios from "../services/axiosInstance";
import { useNavigate } from "react-router-dom";

function Dashboard() {
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
      .catch((err) => console.log(err));
  }, [navigate]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Projects</h1>
      <button
        onClick={() => navigate("/create-project")}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        + New Project
      </button>

      {projects.length === 0 ? (
        <p>No projects found. Create one!</p>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li
              key={project._id}
              className="bg-gray-100 p-4 rounded shadow hover:bg-gray-200 cursor-pointer"
              onClick={() => navigate(`/project/${project._id}`)}
            >
              <h2 className="font-semibold">{project.title}</h2>
              <p className="text-sm">{project.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;

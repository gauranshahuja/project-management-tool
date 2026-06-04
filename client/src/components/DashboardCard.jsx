import { FiArrowRight } from "react-icons/fi";

const DashboardCard = ({ project, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transform hover:scale-105 transition cursor-pointer border border-gray-200 dark:border-gray-700 hover:shadow-2xl"
      style={{
        backgroundImage: "linear-gradient(145deg, #ffffff, #e6e6e6)",
        boxShadow: "8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff"
      }}
    >
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
        {project.title}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
        {project.description}
      </p>
      <div className="flex items-center justify-end text-indigo-600 dark:text-indigo-400">
        <span className="mr-2 text-sm font-medium">View</span>
        <FiArrowRight size={18} />
      </div>
    </div>
  );
};

export default DashboardCard;

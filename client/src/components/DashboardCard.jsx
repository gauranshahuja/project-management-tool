import { FiArrowRight, FiEdit2, FiTrash2 } from "react-icons/fi";

const statusClasses = {
  "Not Started":
    "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
  "In Progress":
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  Completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

const formatDate = (value) => {
  if (!value) return "No due date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const DashboardCard = ({ project, onClick, onEdit, onDelete }) => {
  const handleActionClick = (e, action) => {
    e.stopPropagation();
    if (!action) return;

    action(project);
  };

  return (
    <div
      onClick={onClick}
      className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="break-words text-xl font-semibold text-gray-800 dark:text-white">
          {project.title}
        </h2>
        {(onEdit || onDelete) && (
          <div className="flex shrink-0 gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => handleActionClick(e, onEdit)}
                className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                aria-label={`Edit ${project.title}`}
              >
                <FiEdit2 aria-hidden="true" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => handleActionClick(e, onDelete)}
                className="rounded-md p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-950 dark:hover:text-red-100"
                aria-label={`Delete ${project.title}`}
              >
                <FiTrash2 aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>

      <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-gray-600 dark:text-gray-300">
        {project.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
            statusClasses[project.status] || statusClasses["Not Started"]
          }`}
        >
          {project.status || "Not Started"}
        </span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {formatDate(project.dueDate)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-end text-indigo-600 dark:text-indigo-400">
        <span className="mr-2 text-sm font-medium">View</span>
        <FiArrowRight size={18} />
      </div>
    </div>
  );
};

export default DashboardCard;

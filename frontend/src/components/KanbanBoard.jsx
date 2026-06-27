// Kanban board: tasks grouped into status columns, drag to move between them.
import { useState } from "react";
import { FiClock, FiUser } from "react-icons/fi";

const COLUMNS = ["Not Started", "In Progress", "Completed"];

const columnAccent = {
  "Not Started": "border-t-gray-400",
  "In Progress": "border-t-amber-500",
  Completed: "border-t-emerald-500",
};

const priorityDot = {
  High: "bg-red-500",
  Medium: "bg-amber-500",
  Low: "bg-sky-500",
};

const formatDue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
};

const isOverdue = (task) =>
  task.status !== "Completed" &&
  task.dueDate &&
  new Date(task.dueDate) < new Date(new Date().toDateString());

const KanbanBoard = ({ tasks = [], onStatusChange, onSelectTask }) => {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col] = tasks.filter((t) => (t.status || "Not Started") === col);
    return acc;
  }, {});

  const handleDrop = (col) => {
    if (draggingId) {
      const task = tasks.find((t) => t._id === draggingId);
      if (task && task.status !== col) onStatusChange?.(draggingId, col);
    }
    setDraggingId(null);
    setDragOverCol(null);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => (
        <div
          key={col}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverCol(col);
          }}
          onDragLeave={() => setDragOverCol((c) => (c === col ? null : c))}
          onDrop={() => handleDrop(col)}
          className={`rounded-lg border border-t-4 bg-gray-50 p-3 transition dark:bg-gray-900/50 ${
            columnAccent[col]
          } ${
            dragOverCol === col
              ? "border-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-900"
              : "border-gray-200 dark:border-gray-800"
          }`}
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {col}
            </h3>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {grouped[col].length}
            </span>
          </div>

          <div className="flex min-h-[80px] flex-col gap-2">
            {grouped[col].length === 0 ? (
              <p className="px-1 py-4 text-center text-xs text-gray-400 dark:text-gray-600">
                Drop tasks here
              </p>
            ) : (
              grouped[col].map((task) => {
                const due = formatDue(task.dueDate);
                const overdue = isOverdue(task);
                return (
                  <button
                    key={task._id}
                    type="button"
                    draggable
                    onDragStart={() => setDraggingId(task._id)}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={() => onSelectTask?.(task)}
                    className={`group cursor-grab rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:shadow-md active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800 ${
                      draggingId === task._id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          priorityDot[task.priority] || priorityDot.Medium
                        }`}
                        title={`${task.priority || "Medium"} priority`}
                      />
                      <p className="min-w-0 break-words text-sm font-medium text-gray-800 dark:text-gray-100">
                        {task.title}
                      </p>
                    </div>

                    {(due || task.assignedTo?.name) && (
                      <div className="mt-2 flex flex-wrap items-center gap-3 pl-4 text-xs text-gray-500 dark:text-gray-400">
                        {due && (
                          <span
                            className={`inline-flex items-center gap-1 ${
                              overdue ? "font-medium text-red-500 dark:text-red-400" : ""
                            }`}
                          >
                            <FiClock aria-hidden="true" /> {due}
                          </span>
                        )}
                        {task.assignedTo?.name && (
                          <span className="inline-flex items-center gap-1">
                            <FiUser aria-hidden="true" /> {task.assignedTo.name}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;

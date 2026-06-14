import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiEdit2,
  FiMessageSquare,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiSend,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import axios from "../services/axiosInstance";
import Navbar_Dashboard from "../components/Navbar_dashboard";
import { getStoredUser } from "../utils/authStorage";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Completed"];
const PAGE_SIZE = 8;

const STATUS_PRIORITIES = ["Low", "Medium", "High"];

const emptyTaskForm = {
  title: "",
  description: "",
  status: "Not Started",
  priority: "Medium",
  dueDate: "",
  assignedTo: "",
};

const priorityClasses = {
  High: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  Medium:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  Low: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
};

const getErrorMessage = (err, fallback) =>
  err.response?.data?.error || err.response?.data?.message || fallback;

const toDateInputValue = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
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

const formatDateTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getAuthorId = (comment) =>
  comment.author?._id || comment.author?.id || comment.author;

const createTaskPayload = (form, options = {}) => {
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

  if (form.assignedTo) {
    payload.assignedTo = form.assignedTo;
  } else if (options.includeEmptyAssignee) {
    payload.assignedTo = null;
  }

  if (form.priority) {
    payload.priority = form.priority;
  }

  return payload;
};

const statusClasses = {
  "Not Started":
    "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
  "In Progress":
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  Completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

const ProjectDetail = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getStoredUser();

  const [project, setProject] = useState(location.state?.project || null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [commentsByTask, setCommentsByTask] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [openCommentsTaskId, setOpenCommentsTaskId] = useState(null);
  const [savingCommentTaskId, setSavingCommentTaskId] = useState(null);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTasks: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editForm, setEditForm] = useState(emptyTaskForm);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [projectLoadFailed, setProjectLoadFailed] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const taskCounts = useMemo(
    () =>
      STATUS_OPTIONS.reduce((acc, status) => {
        acc[status] = stats[status] || 0;
        return acc;
      }, {}),
    [stats]
  );
  const isProjectReady = !loadingProject && !projectLoadFailed && Boolean(project);
  const canDeleteComment = useCallback(
    (comment) =>
      ["Owner", "Admin"].includes(currentUser?.role) ||
      getAuthorId(comment) === currentUser?.id ||
      getAuthorId(comment) === currentUser?._id,
    [currentUser?.id, currentUser?._id, currentUser?.role]
  );

  const requireAuth = useCallback(() => {
    if (!getStoredUser()?.token) {
      navigate("/");
      return false;
    }

    return true;
  }, [navigate]);

  const resetTaskState = useCallback(() => {
    setTasks([]);
    setStats({});
    setCommentsByTask({});
    setCommentsLoading({});
    setCommentDrafts({});
    setOpenCommentsTaskId(null);
    setSavingCommentTaskId(null);
    setCurrentPage(1);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      totalTasks: 0,
    });
    setLoadingTasks(false);
  }, []);

  const loadProject = useCallback(async () => {
    setLoadingProject(true);

    if (!requireAuth()) {
      setProjectLoadFailed(true);
      resetTaskState();
      setLoadingProject(false);
      return;
    }

    setProjectLoadFailed(false);
    setError("");

    try {
      const res = await axios.get("/projects");
      const matchedProject = res.data.find((item) => item._id === projectId);

      if (!matchedProject) {
        setError("Project not found.");
        setProject(null);
        setProjectLoadFailed(true);
        resetTaskState();
        return;
      }

      setProject(matchedProject);
    } catch (err) {
      console.error("Failed to load project:", err.response?.data || err.message);
      setProjectLoadFailed(true);
      setError(getErrorMessage(err, "Failed to load project"));
      resetTaskState();
    } finally {
      setLoadingProject(false);
    }
  }, [projectId, requireAuth, resetTaskState]);

  const loadStats = useCallback(async () => {
    if (!isProjectReady) return;
    if (!requireAuth()) return;

    try {
      const res = await axios.get(`/tasks/project/${projectId}/stats`);
      const nextStats = res.data.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      setStats(nextStats);
    } catch (err) {
      console.error("Failed to load task stats:", err.response?.data || err.message);
      setStats({});
    }
  }, [isProjectReady, projectId, requireAuth]);

  const loadTasks = useCallback(
    async (page = 1) => {
      if (!isProjectReady) {
        if (!loadingProject) {
          resetTaskState();
        }

        return;
      }

      if (!requireAuth()) return;

      setLoadingTasks(true);
      setError("");

      try {
        const res = await axios.get(`/tasks/project/${projectId}`, {
          params: {
            page,
            limit: PAGE_SIZE,
            ...(statusFilter ? { status: statusFilter } : {}),
            ...(priorityFilter ? { priority: priorityFilter } : {}),
            ...(assigneeFilter ? { assignedTo: assigneeFilter } : {}),
            ...(searchTerm ? { search: searchTerm } : {}),
          },
        });

        setTasks(res.data.tasks || []);
        setPagination({
          currentPage: res.data.currentPage || page,
          totalPages: Math.max(res.data.totalPages || 1, 1),
          totalTasks: res.data.totalTasks || 0,
        });
      } catch (err) {
        console.error("Failed to load tasks:", err.response?.data || err.message);
        setError(getErrorMessage(err, "Failed to load tasks"));
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    },
    [
      isProjectReady,
      loadingProject,
      projectId,
      assigneeFilter,
      priorityFilter,
      requireAuth,
      resetTaskState,
      searchTerm,
      statusFilter,
    ]
  );

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Org members ek baar load karo — assignee dropdown ke liye
  useEffect(() => {
    if (!getStoredUser()?.token) return;

    axios
      .get("/org/members")
      .then((res) => setMembers(res.data))
      .catch(() => setMembers([]));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadTasks(currentPage);
  }, [currentPage, loadTasks]);

  const refreshTasks = async (page = currentPage) => {
    if (!isProjectReady) return;

    await Promise.all([loadTasks(page), loadStats()]);
  };

  const loadComments = useCallback(async (taskId) => {
    setCommentsLoading((prev) => ({ ...prev, [taskId]: true }));
    setError("");

    try {
      const res = await axios.get(`/tasks/${taskId}/comments`);
      setCommentsByTask((prev) => ({ ...prev, [taskId]: res.data || [] }));
    } catch (err) {
      console.error("Failed to load comments:", err.response?.data || err.message);
      setError(getErrorMessage(err, "Failed to load comments"));
    } finally {
      setCommentsLoading((prev) => ({ ...prev, [taskId]: false }));
    }
  }, []);

  const toggleComments = async (taskId) => {
    const nextTaskId = openCommentsTaskId === taskId ? null : taskId;
    setOpenCommentsTaskId(nextTaskId);

    if (nextTaskId && !commentsByTask[nextTaskId]) {
      await loadComments(nextTaskId);
    }
  };

  const handleCommentDraftChange = (taskId, value) => {
    setCommentDrafts((prev) => ({ ...prev, [taskId]: value }));
  };

  const addComment = async (taskId) => {
    const body = (commentDrafts[taskId] || "").trim();
    if (!body) return;

    setSavingCommentTaskId(taskId);
    setError("");
    setNotice("");

    try {
      const res = await axios.post(`/tasks/${taskId}/comments`, { body });
      setCommentsByTask((prev) => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), res.data],
      }));
      setCommentDrafts((prev) => ({ ...prev, [taskId]: "" }));
    } catch (err) {
      console.error("Comment creation error:", err.response?.data || err.message);
      setError(getErrorMessage(err, "Failed to add comment"));
    } finally {
      setSavingCommentTaskId(null);
    }
  };

  const deleteComment = async (taskId, comment) => {
    if (!window.confirm("Delete this comment?")) return;

    setError("");
    setNotice("");

    try {
      await axios.delete(`/tasks/comments/${comment._id}`);
      setCommentsByTask((prev) => ({
        ...prev,
        [taskId]: (prev[taskId] || []).filter((item) => item._id !== comment._id),
      }));
    } catch (err) {
      console.error("Comment delete error:", err.response?.data || err.message);
      setError(getErrorMessage(err, "Failed to delete comment"));
    }
  };

  const handleTaskFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");

    const payload = createTaskPayload(taskForm);
    if (!isProjectReady) {
      setError("Open an existing project before adding tasks.");
      return;
    }

    if (!payload.title) {
      setError("Task title is required.");
      return;
    }

    setSavingTask(true);

    try {
      await axios.post(`/tasks/project/${projectId}`, payload);
      setTaskForm(emptyTaskForm);
      setNotice("Task created.");

      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        await refreshTasks(1);
      }
    } catch (err) {
      console.error("Task creation error:", err.response?.data || err.message);
      setError(getErrorMessage(err, "Task creation failed"));
    } finally {
      setSavingTask(false);
    }
  };

  const startEditing = (task) => {
    setEditingTaskId(task._id);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "Not Started",
      priority: task.priority || "Medium",
      dueDate: toDateInputValue(task.dueDate),
      assignedTo: task.assignedTo?._id || task.assignedTo || "",
    });
    setNotice("");
    setError("");
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditForm(emptyTaskForm);
  };

  const saveTask = async (taskId) => {
    setError("");
    setNotice("");

    const payload = createTaskPayload(editForm, {
      includeEmptyDueDate: true,
      includeEmptyAssignee: true,
    });
    if (!payload.title) {
      setError("Task title is required.");
      return;
    }

    try {
      await axios.put(`/tasks/${taskId}`, payload);
      setEditingTaskId(null);
      setEditForm(emptyTaskForm);
      setNotice("Task updated.");
      await refreshTasks();
    } catch (err) {
      console.error("Task update error:", err.response?.data || err.message);
      setError(getErrorMessage(err, "Task update failed"));
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;

    setError("");
    setNotice("");

    try {
      await axios.delete(`/tasks/${taskId}`);
      setNotice("Task deleted.");
      setCommentsByTask((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      setCommentDrafts((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      setOpenCommentsTaskId((current) => (current === taskId ? null : current));

      if (tasks.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1);
      } else {
        await refreshTasks();
      }
    } catch (err) {
      console.error("Task delete error:", err.response?.data || err.message);
      setError(getErrorMessage(err, "Task delete failed"));
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchDraft.trim());
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePriorityFilterChange = (e) => {
    setPriorityFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleAssigneeFilterChange = (e) => {
    setAssigneeFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Navbar_Dashboard />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-gray-800 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"
            >
              <FiArrowLeft aria-hidden="true" />
              Dashboard
            </button>
            <h1 className="text-2xl font-semibold text-gray-950 dark:text-white sm:text-3xl">
              {loadingProject ? "Loading project..." : project?.title || "Project"}
            </h1>
            {project?.description && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                {project.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => refreshTasks()}
            disabled={!isProjectReady}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <FiRefreshCw aria-hidden="true" />
            Refresh
          </button>
        </div>

        {(error || notice) && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
            }`}
          >
            {error || notice}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {STATUS_OPTIONS.map((status) => (
            <div
              key={status}
              className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">{status}</p>
              <p className="mt-2 text-3xl font-semibold text-gray-950 dark:text-white">
                {taskCounts[status]}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
            New task
          </h2>
          <form
            onSubmit={handleCreateTask}
            className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_120px_150px_140px_auto]"
          >
            <input
              type="text"
              name="title"
              value={taskForm.title}
              onChange={handleTaskFormChange}
              disabled={!isProjectReady || savingTask}
              placeholder="Task title"
              className="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-800 dark:disabled:text-gray-500 dark:focus:ring-emerald-950"
            />
            <input
              type="text"
              name="description"
              value={taskForm.description}
              onChange={handleTaskFormChange}
              disabled={!isProjectReady || savingTask}
              placeholder="Description"
              className="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-800 dark:disabled:text-gray-500 dark:focus:ring-emerald-950"
            />
            <select
              name="status"
              value={taskForm.status}
              onChange={handleTaskFormChange}
              disabled={!isProjectReady || savingTask}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-800 dark:disabled:text-gray-500 dark:focus:ring-emerald-950"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              name="priority"
              value={taskForm.priority}
              onChange={handleTaskFormChange}
              disabled={!isProjectReady || savingTask}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-800 dark:disabled:text-gray-500 dark:focus:ring-emerald-950"
            >
              {STATUS_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="dueDate"
              value={taskForm.dueDate}
              onChange={handleTaskFormChange}
              disabled={!isProjectReady || savingTask}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-800 dark:disabled:text-gray-500 dark:focus:ring-emerald-950"
            />
            <select
              name="assignedTo"
              value={taskForm.assignedTo}
              onChange={handleTaskFormChange}
              disabled={!isProjectReady || savingTask}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-800 dark:disabled:text-gray-500 dark:focus:ring-emerald-950"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!isProjectReady || savingTask}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              <FiCheck aria-hidden="true" />
              {savingTask ? "Saving" : "Add"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
                Tasks
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {pagination.totalTasks} total
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <form onSubmit={handleSearchSubmit} className="flex min-w-0">
                <input
                  type="search"
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  disabled={!isProjectReady}
                  placeholder="Search tasks"
                  className="min-w-0 rounded-l-lg border border-gray-300 px-3 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-800 dark:disabled:text-gray-500 dark:focus:ring-emerald-950"
                />
                <button
                  type="submit"
                  disabled={!isProjectReady}
                  className="inline-flex items-center justify-center rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  aria-label="Search tasks"
                >
                  <FiSearch aria-hidden="true" />
                </button>
              </form>

              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                disabled={!isProjectReady}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-800 dark:disabled:text-gray-500 dark:focus:ring-emerald-950"
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={handlePriorityFilterChange}
                disabled={!isProjectReady}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-800 dark:disabled:text-gray-500 dark:focus:ring-emerald-950"
              >
                <option value="">All priorities</option>
                {STATUS_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>

              <select
                value={assigneeFilter}
                onChange={handleAssigneeFilterChange}
                disabled={!isProjectReady}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-800 dark:disabled:text-gray-500 dark:focus:ring-emerald-950"
              >
                <option value="">All assignees</option>
                <option value="me">Assigned to me</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {loadingTasks ? (
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                Loading tasks...
              </p>
            ) : tasks.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                No tasks found.
              </p>
            ) : (
              tasks.map((task) => {
                const isEditing = editingTaskId === task._id;

                return (
                  <div key={task._id} className="p-4">
                    {isEditing ? (
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_120px_150px_140px_auto_auto]">
                        <input
                          type="text"
                          name="title"
                          value={editForm.title}
                          onChange={handleEditFormChange}
                          className="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-emerald-950"
                        />
                        <input
                          type="text"
                          name="description"
                          value={editForm.description}
                          onChange={handleEditFormChange}
                          className="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-emerald-950"
                        />
                        <select
                          name="status"
                          value={editForm.status}
                          onChange={handleEditFormChange}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-emerald-950"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <select
                          name="priority"
                          value={editForm.priority}
                          onChange={handleEditFormChange}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-emerald-950"
                        >
                          {STATUS_PRIORITIES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <input
                          type="date"
                          name="dueDate"
                          value={editForm.dueDate}
                          onChange={handleEditFormChange}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-emerald-950"
                        />
                        <select
                          name="assignedTo"
                          value={editForm.assignedTo}
                          onChange={handleEditFormChange}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-emerald-950"
                        >
                          <option value="">Unassigned</option>
                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => saveTask(task._id)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                        >
                          <FiSave aria-hidden="true" />
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          <FiX aria-hidden="true" />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words text-base font-semibold text-gray-950 dark:text-white">
                              {task.title}
                            </h3>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                statusClasses[task.status] || statusClasses["Not Started"]
                              }`}
                            >
                              {task.status || "Not Started"}
                            </span>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                priorityClasses[task.priority] || priorityClasses.Medium
                              }`}
                            >
                              {task.priority || "Medium"}
                            </span>
                          </div>
                          {task.description && (
                            <p className="mt-1 break-words text-sm text-gray-600 dark:text-gray-300">
                              {task.description}
                            </p>
                          )}
                          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                            {formatDate(task.dueDate)}
                            {task.assignedTo?.name && (
                              <span className="ml-2 normal-case tracking-normal text-indigo-500 dark:text-indigo-300">
                                @ {task.assignedTo.name}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => toggleComments(task._id)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <FiMessageSquare aria-hidden="true" />
                            Comments
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditing(task)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <FiEdit2 aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTask(task._id)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950"
                          >
                            <FiTrash2 aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </div>
                      {openCommentsTaskId === task._id && (
                        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950">
                          {commentsLoading[task._id] ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Loading comments...
                            </p>
                          ) : (commentsByTask[task._id] || []).length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No comments yet.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {(commentsByTask[task._id] || []).map((comment) => (
                                <div
                                  key={comment._id}
                                  className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                                >
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                        {comment.author?.name || "Team member"}
                                        {comment.createdAt && (
                                          <span className="ml-2 text-xs font-normal text-gray-400">
                                            {formatDateTime(comment.createdAt)}
                                          </span>
                                        )}
                                      </p>
                                      <p className="mt-1 break-words text-sm text-gray-600 dark:text-gray-300">
                                        {comment.body}
                                      </p>
                                    </div>
                                    {canDeleteComment(comment) && (
                                      <button
                                        type="button"
                                        onClick={() => deleteComment(task._id, comment)}
                                        className="inline-flex shrink-0 items-center gap-1 rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950"
                                      >
                                        <FiTrash2 aria-hidden="true" />
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <textarea
                              value={commentDrafts[task._id] || ""}
                              onChange={(e) =>
                                handleCommentDraftChange(task._id, e.target.value)
                              }
                              placeholder="Add a comment"
                              maxLength={2000}
                              rows={2}
                              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-emerald-950"
                            />
                            <button
                              type="button"
                              onClick={() => addComment(task._id)}
                              disabled={
                                savingCommentTaskId === task._id ||
                                !(commentDrafts[task._id] || "").trim()
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                            >
                              <FiSend aria-hidden="true" />
                              {savingCommentTaskId === task._id ? "Saving" : "Send"}
                            </button>
                          </div>
                        </div>
                      )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {pagination.currentPage} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= pagination.totalPages}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(page + 1, pagination.totalPages)
                  )
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProjectDetail;

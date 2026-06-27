// Role-aware home dashboard: personal widgets plus org stats for managers.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/axiosInstance";
import { getStoredUser } from "../utils/authStorage";
import { getEntityId } from "../utils/ids";
import { FiFolderPlus, FiPlus, FiUsers, FiX } from "react-icons/fi";
import DashboardCard from "../components/DashboardCard";
import Navbar_Dashboard from "../components/Navbar_dashboard";
import { useConfirm } from "../components/ConfirmDialog";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Completed"];

const emptyProjectForm = {
  title: "",
  description: "",
  status: "Not Started",
  dueDate: "",
  members: [],
};

const getMemberId = (member) => getEntityId(member);
const getProjectOwnerId = (project) => getEntityId(project?.user);

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

  if (Array.isArray(form.members)) {
    payload.members = form.members;
  }

  if (form.dueDate) {
    payload.dueDate = form.dueDate;
  } else if (options.includeEmptyDueDate) {
    payload.dueDate = null;
  }

  return payload;
};

const ProjectGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="h-6 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
        </div>
        <div className="mt-5 flex items-center gap-2">
          <div className="h-7 w-24 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700" />
          <div className="h-4 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyProjects = ({ canCreateProject, onCreate }) => (
  <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
      <FiFolderPlus size={24} aria-hidden="true" />
    </div>
    <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
      {canCreateProject ? "Start your first project" : "No projects assigned"}
    </h2>
    <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
      {canCreateProject
        ? "Create a project, assign teammates, and track tasks from one workspace."
        : "Projects will appear here after an Owner or Admin adds you to one."}
    </p>
    {canCreateProject && (
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
      >
        <FiPlus aria-hidden="true" />
        New Project
      </button>
    )}
  </div>
);

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [form, setForm] = useState(emptyProjectForm);
  const [orgMembers, setOrgMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const confirm = useConfirm();
  const currentUser = getStoredUser();
  const currentUserId = getEntityId(currentUser);
  const canCreateProject = currentUser?.role !== "Member";
  const canModifyProject = (project) =>
    ["Owner", "Admin"].includes(currentUser?.role) ||
    getProjectOwnerId(project) === currentUserId;

  const getErrorMessage = (err, fallback) =>
    err.response?.data?.error || err.response?.data?.message || fallback;

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
      })
      .finally(() => setLoadingProjects(false));

    setLoadingMembers(true);
    axios
      .get("/org/members")
      .then((res) => setOrgMembers(res.data || []))
      .catch(() => setOrgMembers([]))
      .finally(() => setLoadingMembers(false));
  }, [navigate]);

  useEffect(() => {
    if (!showModal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !savingProject) {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal, savingProject]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleMemberToggle = (memberId) => {
    setForm((prev) => {
      const members = prev.members || [];
      const nextMembers = members.includes(memberId)
        ? members.filter((id) => id !== memberId)
        : [...members, memberId];

      return { ...prev, members: nextMembers };
    });
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
      members: (project.members || []).map(getMemberId).filter(Boolean),
    });
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (savingProject) return;

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

      setSavingProject(true);

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
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async (project) => {
    const confirmed = await confirm({
      title: "Delete project?",
      message: `This will delete "${project.title}" and its project workspace.`,
      confirmText: "Delete",
      danger: true,
    });

    if (!confirmed) return;

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
      <Navbar_Dashboard />

      <div className="p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
              Your Projects
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {loadingProjects
                ? "Loading your workspace..."
                : `${projects.length} project${projects.length === 1 ? "" : "s"} available`}
            </p>
          </div>
          {canCreateProject && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow transition hover:bg-indigo-700"
            >
              <FiPlus size={20} /> New Project
            </button>
          )}
        </div>

        {error && !showModal && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        )}

        {loadingProjects ? (
          <ProjectGridSkeleton />
        ) : projects.length === 0 ? (
          <EmptyProjects canCreateProject={canCreateProject} onCreate={openCreateModal} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const canManageProject = canModifyProject(project);

              return (
                <DashboardCard
                  key={project._id}
                  project={project}
                  onClick={() =>
                    navigate(`/projects/${project._id}`, { state: { project } })
                  }
                  onEdit={canManageProject ? openEditModal : undefined}
                  onDelete={canManageProject ? handleDeleteProject : undefined}
                />
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              disabled={savingProject}
              className="absolute right-3 top-3 rounded-md p-1 text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label="Close project form"
            >
              <FiX aria-hidden="true" />
            </button>
            <h2
              id="project-modal-title"
              className="mb-4 text-center text-2xl font-bold text-gray-800 dark:text-white"
            >
              {modalMode === "edit" ? "Edit Project" : "Create Project"}
            </h2>
            {error && (
              <p
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
                role="alert"
              >
                {error}
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Project Title"
                value={form.title}
                onChange={handleChange}
                required
                disabled={savingProject}
                className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-white"
              />
              <textarea
                name="description"
                placeholder="Project Description"
                value={form.description}
                onChange={handleChange}
                disabled={savingProject}
                className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-white"
              />
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={savingProject}
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
                disabled={savingProject}
                className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-white"
              />
              {canCreateProject && (
                <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <FiUsers aria-hidden="true" />
                    Project members
                  </div>
                  {loadingMembers ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Loading teammates...
                    </p>
                  ) : orgMembers.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No teammates available.
                    </p>
                  ) : (
                    <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                      {orgMembers.map((member) => {
                        const memberId = getMemberId(member);
                        const checked = form.members.includes(memberId);

                        return (
                          <label
                            key={memberId}
                            className="flex cursor-pointer items-start gap-2 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleMemberToggle(memberId)}
                              disabled={savingProject}
                              className="mt-1"
                            />
                            <span className="min-w-0">
                              <span className="block break-words font-medium">
                                {member.name || member.email}
                                {memberId === currentUserId && (
                                  <span className="ml-1 text-xs text-gray-400">
                                    (you)
                                  </span>
                                )}
                              </span>
                              <span className="block break-words text-xs text-gray-500 dark:text-gray-400">
                                {member.email} {member.role ? `- ${member.role}` : ""}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={savingProject}
                className="w-full rounded bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {savingProject
                  ? "Saving..."
                  : modalMode === "edit"
                    ? "Save Changes"
                    : "Create"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

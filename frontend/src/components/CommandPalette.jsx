// Ctrl/Cmd+K quick launcher to jump between pages and actions.
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiFolder, FiSearch, FiCheckSquare } from "react-icons/fi";
import axios from "../services/axiosInstance";
import { getStoredUser } from "../utils/authStorage";

const CommandPalette = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ projects: [], tasks: [] });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Flatten results into one navigable list
  const flat = [
    ...results.projects.map((p) => ({ type: "project", ...p })),
    ...results.tasks.map((t) => ({ type: "task", ...t })),
  ];

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults({ projects: [], tasks: [] });
    setActiveIndex(0);
  }, []);

  // Global hotkey: Cmd/Ctrl+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (getStoredUser()?.token) setOpen((v) => !v);
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults({ projects: [], tasks: [] });
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get("/org/search", { params: { q: query.trim() } });
        setResults(res.data);
        setActiveIndex(0);
      } catch {
        setResults({ projects: [], tasks: [] });
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [query, open]);

  const go = (item) => {
    if (!item) return;
    if (item.type === "project") navigate(`/projects/${item.id}`);
    else navigate(`/projects/${item.projectId}`);
    close();
  };

  const onInputKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(flat[activeIndex]);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
          <FiSearch className="text-gray-400" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search projects and tasks..."
            className="w-full bg-transparent py-4 text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-white"
          />
          <kbd className="hidden rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-400 dark:border-gray-600 sm:block">
            Esc
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {loading ? (
            <p className="p-4 text-center text-sm text-gray-400">Searching...</p>
          ) : !query.trim() ? (
            <p className="p-4 text-center text-sm text-gray-400">
              Type to search across your workspace.
            </p>
          ) : flat.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-400">No results.</p>
          ) : (
            flat.map((item, i) => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => go(item)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  i === activeIndex
                    ? "bg-indigo-50 dark:bg-indigo-950"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {item.type === "project" ? (
                  <FiFolder className="shrink-0 text-indigo-500" aria-hidden="true" />
                ) : (
                  <FiCheckSquare className="shrink-0 text-blue-500" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-gray-100">
                  {item.title}
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  {item.type === "project" ? "Project" : item.projectTitle || "Task"}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

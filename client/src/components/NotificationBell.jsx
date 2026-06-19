import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiCheck, FiInbox } from "react-icons/fi";
import axios from "../services/axiosInstance";
import { getSocket } from "../utils/socket";
import { errorMessage, notifyError, notifyInfo } from "../utils/toast";

const timeAgo = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const units = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  for (const [name, amount] of units) {
    const count = Math.floor(seconds / amount);
    if (count >= 1) return `${count} ${name}${count > 1 ? "s" : ""} ago`;
  }

  return "just now";
};

const normalizeNotification = (item) => ({
  id: item.id || item._id || `${item.type}-${item.createdAt}-${item.message}`,
  type: item.type || "notification",
  message: item.message || "New notification",
  link: item.link || "",
  read: Boolean(item.read),
  createdAt: item.createdAt || new Date().toISOString(),
});

const NotificationBell = () => {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadCount = async () => {
    try {
      const res = await axios.get("/notifications/unread-count");
      setCount(Number(res.data?.count || 0));
    } catch {
      setCount(0);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/notifications", { params: { limit: 20 } });
      setItems((res.data || []).map(normalizeNotification));
    } catch (err) {
      notifyError(errorMessage(err, "Failed to load notifications"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCount();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const handleNotification = (payload) => {
      const notification = normalizeNotification(payload || {});
      setCount((prev) => prev + 1);
      setItems((prev) => [notification, ...prev].slice(0, 20));
      notifyInfo(notification.message);
    };

    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("notification:new", handleNotification);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    loadItems();

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const openNotification = async (item) => {
    setBusy(true);
    try {
      if (!item.read && item.id) {
        await axios.patch(`/notifications/${item.id}/read`);
        setCount((prev) => Math.max(0, prev - 1));
      }

      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id ? { ...entry, read: true } : entry
        )
      );
      setOpen(false);

      if (item.link) {
        navigate(item.link);
      }
    } catch (err) {
      notifyError(errorMessage(err, "Failed to open notification"));
    } finally {
      setBusy(false);
    }
  };

  const markAllRead = async () => {
    setBusy(true);
    try {
      await axios.patch("/notifications/read-all");
      setCount(0);
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (err) {
      notifyError(errorMessage(err, "Failed to mark notifications read"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-md p-2 text-gray-600 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <FiBell size={20} aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {count} unread
              </p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={busy || count === 0}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-indigo-300 dark:hover:bg-indigo-950"
            >
              <FiCheck aria-hidden="true" /> Mark all
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                  <FiInbox aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">
                  No notifications
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Task assignments and leave decisions will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openNotification(item)}
                    disabled={busy}
                    className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-gray-50 disabled:cursor-wait dark:hover:bg-gray-800/70"
                  >
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        item.read ? "bg-gray-300 dark:bg-gray-600" : "bg-indigo-600"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block break-words text-sm text-gray-800 dark:text-gray-100">
                        {item.message}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                        {timeAgo(item.createdAt)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

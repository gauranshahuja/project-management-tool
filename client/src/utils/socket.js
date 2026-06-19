import { io } from "socket.io-client";
import { getStoredUser } from "./authStorage";

let socket;
let activeToken = "";

const resolveSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";
  if (apiBase.startsWith("http")) {
    return apiBase.replace(/\/api\/?$/, "");
  }

  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return "http://localhost:5000";
  }

  return window.location.origin;
};

export const getSocket = () => {
  const token = getStoredUser()?.token;

  if (!token) {
    disconnectSocket();
    return null;
  }

  if (socket && activeToken === token) {
    return socket;
  }

  disconnectSocket();
  activeToken = token;
  socket = io(resolveSocketUrl(), {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
  activeToken = "";
};

import axios from "axios";
import { clearStoredUser, getStoredUser } from "../utils/authStorage";
import { disconnectSocket } from "../utils/socket";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const user = getStoredUser();

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      disconnectSocket();
      clearStoredUser();

      if (window.location.pathname !== "/") {
        window.location.replace("/");
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

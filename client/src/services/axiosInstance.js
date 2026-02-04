import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://project-management-tool-9yl1.onrender.com/api", // ✅ Updated to live backend
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;

import { toast } from "react-toastify";

const baseOptions = {
  position: "bottom-right",
  autoClose: 3000,
  pauseOnHover: true,
  theme:
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
};

export const notifySuccess = (message) =>
  toast.success(message, baseOptions);

export const notifyError = (message) =>
  toast.error(message || "Something went wrong", baseOptions);

export const notifyInfo = (message) => toast.info(message, baseOptions);

export const errorMessage = (err, fallback = "Something went wrong") =>
  err?.response?.data?.error ||
  err?.response?.data?.message ||
  err?.message ||
  fallback;

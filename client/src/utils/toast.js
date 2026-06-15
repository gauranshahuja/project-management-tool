import { toast } from "react-toastify";

// Single place for toast styling/behavior. Pages import these instead of
// calling react-toastify directly, so we can tweak look in one spot.
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

// Pull the best human-readable message out of an axios error.
export const errorMessage = (err, fallback = "Something went wrong") =>
  err?.response?.data?.error ||
  err?.response?.data?.message ||
  err?.message ||
  fallback;

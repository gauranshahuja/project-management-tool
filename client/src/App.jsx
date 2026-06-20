import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import JoinPage from "./pages/JoinPage";
import CommandPalette from "./components/CommandPalette";
import axios from "./services/axiosInstance";
import { getStoredUser, updateStoredUserProfile } from "./utils/authStorage";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Members = lazy(() => import("./pages/Members"));
const MyTasks = lazy(() => import("./pages/MyTasks"));
const Activity = lazy(() => import("./pages/Activity"));
const Analytics = lazy(() => import("./pages/Analytics"));
const HrAttendance = lazy(() => import("./pages/HrAttendance"));
const HrEmployees = lazy(() => import("./pages/HrEmployees"));
const HrLeaves = lazy(() => import("./pages/HrLeaves"));
const HrPayroll = lazy(() => import("./pages/HrPayroll"));
const Inventory = lazy(() => import("./pages/Inventory"));

const ProtectedRoute = ({ children }) => {
  const [hasSession, setHasSession] = useState(() => Boolean(getStoredUser()?.token));
  const [ready, setReady] = useState(!hasSession);

  useEffect(() => {
    let active = true;

    const syncProfile = async () => {
      const storedUser = getStoredUser();

      if (!storedUser?.token) {
        if (active) {
          setHasSession(false);
          setReady(true);
        }
        return;
      }

      try {
        const res = await axios.get("/users/profile");
        if (active) {
          updateStoredUserProfile(res.data);
          setHasSession(Boolean(getStoredUser()?.token));
        }
      } catch {
        if (active) {
          setHasSession(Boolean(getStoredUser()?.token));
        }
      } finally {
        if (active) {
          setReady(true);
        }
      }
    };

    syncProfile();

    return () => {
      active = false;
    };
  }, []);

  if (!hasSession) {
    return <LandingPage showAuth />;
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 text-sm text-gray-600 dark:bg-gray-950 dark:text-gray-300">
        Loading workspace...
      </div>
    );
  }

  return children;
};

const App = () => {
  return (
    <>
      <CommandPalette />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-gray-100 text-sm text-gray-600 dark:bg-gray-950 dark:text-gray-300">
            Loading workspace...
          </div>
        }
      >
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:projectId"
        element={
          <ProtectedRoute>
            <ProjectDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <Members />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-tasks"
        element={
          <ProtectedRoute>
            <MyTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity"
        element={
          <ProtectedRoute>
            <Activity />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/employees"
        element={
          <ProtectedRoute>
            <HrEmployees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/attendance"
        element={
          <ProtectedRoute>
            <HrAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/leaves"
        element={
          <ProtectedRoute>
            <HrLeaves />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/payroll"
        element={
          <ProtectedRoute>
            <HrPayroll />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        }
      />
      <Route path="/join" element={<JoinPage />} />
      <Route
        path="*"
        element={<h1 className="p-6 text-center">404 - Page Not Found</h1>}
      />
    </Routes>
      </Suspense>
    </>
  );
};

export default App;

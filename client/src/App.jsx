import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import ProjectDetail from "./pages/ProjectDetail";
import Members from "./pages/Members";
import MyTasks from "./pages/MyTasks";
import JoinPage from "./pages/JoinPage";
import Activity from "./pages/Activity";
import Analytics from "./pages/Analytics";
import CommandPalette from "./components/CommandPalette";
import axios from "./services/axiosInstance";
import { getStoredUser, updateStoredUserProfile } from "./utils/authStorage";

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
      <Route path="/join" element={<JoinPage />} />
      <Route
        path="*"
        element={<h1 className="p-6 text-center">404 - Page Not Found</h1>}
      />
    </Routes>
    </>
  );
};

export default App;

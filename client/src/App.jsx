import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import ProjectDetail from "./pages/ProjectDetail";
import Members from "./pages/Members";
import MyTasks from "./pages/MyTasks";
import JoinPage from "./pages/JoinPage";
import { getStoredUser } from "./utils/authStorage";

const ProtectedRoute = ({ children }) => {
  return getStoredUser()?.token ? children : <LandingPage showAuth />;
};

const App = () => {
  return (
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
      <Route path="/join" element={<JoinPage />} />
      <Route
        path="*"
        element={<h1 className="p-6 text-center">404 - Page Not Found</h1>}
      />
    </Routes>
  );
};

export default App;

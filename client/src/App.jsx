import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import CreateProject from "./pages/CreateProject";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";

// Simulated auth check (replace this with real JWT check)
const isUserAuthenticated = () => {
  return !!localStorage.getItem("token");
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(isUserAuthenticated());
  }, []);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <Dashboard />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
      <Route
        path="/create-project"
        element={
          isAuthenticated ? (
            <CreateProject />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />

      {/* 404 Page */}
      <Route
        path="*"
        element={<h1 className="p-6 text-center">404 - Page Not Found</h1>}
      />
    </Routes>
  );
}

export default App;

import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateProject from "./pages/CreateProject";

function App() {
  return (
    <Routes>
      {/* Redirect base URL to /login */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Main routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} /> 
      <Route path="/create-project" element={<CreateProject />} />
      
      {/* Optional: catch-all for 404 */}
      <Route path="*" element={<h1>404 - Page Not Found</h1>} />
    </Routes>
  );
}

export default App;

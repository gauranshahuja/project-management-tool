import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      navigate("/login");
    } else {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error("Failed to parse user data");
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-100 p-4">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">
          Welcome{user?.name ? `, ${user.name}` : " to Project Manager"}!
        </h2>
        <p className="mb-4">You are successfully logged in.</p>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Home;

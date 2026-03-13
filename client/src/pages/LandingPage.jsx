import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-b from-indigo-600 to-purple-500 text-white">
      {/* Hero Section */}
      <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center px-8">
        {/* Left: Text Content */}
        <div className="w-full lg:w-1/2 py-10 flex flex-col justify-center gap-6">
          <motion.h1
            className="text-5xl font-extrabold"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Project Management Tool
          </motion.h1>
          <p className="text-lg max-w-prose">
            Organize your work, track tasks, and collaborate effortlessly.
            Build, manage, and deliver with clarity and speed.
          </p>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => navigate("/register")}
              className="bg-white text-indigo-600 font-semibold px-6 py-3 rounded shadow hover:shadow-lg transition"
            >
              Register
            </button>
            <button
              onClick={() => navigate("/login")}
              className="border border-white font-semibold px-6 py-3 rounded hover:bg-white hover:text-indigo-600 transition"
            >
              Login
            </button>
          </div>
          <p className="text-sm mt-4">
            Trusted by teams to keep projects on track with real-time collaboration.
          </p>
        </div>

        {/* Right: Placeholder or animation removed */}
        <div className="w-full lg:w-1/2 flex justify-center items-center py-10">
          <img
            src="https://lottie.host/01a53e0d-3c0e-4085-b504-ec5f2a407c7e/nkxUt6WhOb.json"
            alt="Animation"
            className="w-3/4 max-w-md"
          />
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="flex justify-center py-4">
        <div className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center p-1">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
        </div>
      </div>

      {/* Feature Cards */}
      <div className="py-16 px-8 bg-white text-gray-900">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              title: "Fast Collaboration",
              desc: "Work in real-time with your team across tasks and deadlines.",
            },
            {
              title: "Intuitive Design",
              desc: "Minimal and clean user interface built for efficiency.",
            },
            {
              title: "Progress Tracking",
              desc: "Monitor project health with smart notifications and stats.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-gray-100 p-6 rounded-xl shadow hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16 px-8 bg-indigo-50 text-gray-900">
        <h2 className="text-3xl font-bold text-center mb-12">What Users Say</h2>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {[
            {
              quote:
                "This tool changed the way our team collaborates. Smooth, simple, and powerful.",
              author: "Aryan M., Frontend Lead",
            },
            {
              quote:
                "I’ve tried many project managers, but this one hits the sweet spot of features and ease.",
              author: "Sneha D., Product Manager",
            },
          ].map((t, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow">
              <p>“{t.quote}”</p>
              <p className="mt-4 font-semibold">— {t.author}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

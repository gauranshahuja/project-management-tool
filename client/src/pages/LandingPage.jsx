import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import FeatureSection from "../components/FeatureSection";
import ContactForm from "../components/ContactForm";
import Newsletter from "../components/Newsletter";
import TestimonialCard from "../components/Testimonials";
import { motion } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaArrowUp } from "react-icons/fa";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import animationData from "../assets/animations/project-animation.json";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { app } from "../utils/firebase"; 

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      localStorage.setItem("token", await user.getIdToken());
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  return (
    <div className="relative">
      {/* Background blur if modal is open */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40" />
      )}

      {/* Main Page */}
      <div className={`relative z-10 ${showAuthModal ? "pointer-events-none select-none" : ""}`}>
        <div id="top" />
        <Navbar />

        {/* Hero Section */}
        <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 pt-32 relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold mb-4"
          >
            Empower Your Projects
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg max-w-xl mb-6"
          >
            Manage tasks, teams, and timelines all in one place with ProjectHub.
          </motion.p>

          {/* Animation */}
          <div className="w-full max-w-lg mb-6">
            <Lottie animationData={animationData} loop autoplay />
          </div>

          <motion.button
            onClick={() => setShowAuthModal(true)}
            whileHover={{ scale: 1.05 }}
            className="mt-2 inline-block px-6 py-3 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 transition"
          >
            Get Started
          </motion.button>
        </section>

        {/* Blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-300 opacity-20 rounded-full filter blur-3xl z-0 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-pink-300 opacity-20 rounded-full filter blur-3xl z-0 pointer-events-none" />

        {/* Features */}
        <section id="features" className="relative z-10 py-20 px-6 bg-white dark:bg-gray-900">
          <h2 className="text-3xl font-bold text-center mb-12" data-aos="fade-up">
            Powerful Features
          </h2>
          <FeatureSection />
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="relative z-10 py-20 px-6 bg-gray-50 dark:bg-gray-800">
          <h2 className="text-3xl font-bold text-center mb-12" data-aos="fade-up">
            What Our Users Say
          </h2>
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            <TestimonialCard
              name="Aarav Sharma"
              text="ProjectHub helped us streamline our workflow and collaborate effectively."
              role="Product Manager"
            />
            <TestimonialCard
              name="Sana Kapoor"
              text="I love the clean UI and how easy it is to track project progress!"
              role="Designer"
            />
          </div>
        </section>

        {/* Newsletter */}
        <section id="newsletter" className="relative z-10 py-20 px-6 bg-indigo-50 dark:bg-gray-700">
          <h2 className="text-3xl font-bold text-center mb-8" data-aos="fade-up">
            Stay in the Loop
          </h2>
          <Newsletter />
        </section>

        {/* Auth Buttons */}
        <section id="auth" className="relative z-10 py-20 px-6 bg-white dark:bg-gray-900">
          <h2 className="text-3xl font-bold text-center mb-8" data-aos="fade-up">
            Ready to Get Started?
          </h2>
          <div className="flex justify-center gap-6">
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 transition"
            >
              Login
            </button>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Register
            </button>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="relative z-10 py-20 px-6 bg-white dark:bg-gray-900">
          <h2 className="text-3xl font-bold text-center mb-8" data-aos="fade-up">
            Let’s Talk!
          </h2>
          <ContactForm />
        </section>

        {/* Scroll to Top */}
        <a
          href="#top"
          className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition"
        >
          <FaArrowUp />
        </a>

        {/* Footer */}
        <footer className="bg-gray-100 dark:bg-gray-800 text-center py-4 text-sm text-gray-600 dark:text-gray-300">
          © {new Date().getFullYear()} ProjectHub. All rights reserved.
        </footer>
      </div>

      {/* Modal Auth Popup */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-sm w-full text-center relative z-50">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Sign in with Google</h2>
            <button
              onClick={handleGoogleLogin}
              className="px-6 py-3 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition mb-4"
            >
              Continue with Google
            </button>
            <button
              onClick={() => setShowAuthModal(false)}
              className="mt-2 text-sm text-gray-600 dark:text-gray-300 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

import { useEffect } from "react";
import Navbar from "../components/Navbar";
import FeatureSection from "../components/FeatureSection";
import TestimonialCard from "../components/Testimonials";
import Newsletter from "../components/Newsletter";
import ContactForm from "../components/ContactForm";
import DarkModeToggle from "../components/DarkModeToggle";
import AOS from "aos";
import "aos/dist/aos.css";
import { motion } from "framer-motion";
import { FaArrowUp } from "react-icons/fa";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import animationData from "../assets/animation.json";

const LandingPage = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <div className="relative bg-gradient-to-br from-white to-gray-100 dark:from-gray-900 dark:to-black text-gray-900 dark:text-white">
      {/* Scroll-to-top anchor */}
      <div id="top" />

      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <header className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl sm:text-6xl font-bold leading-tight"
        >
          Manage Projects with Ease
        </motion.h1>

        {/* Lottie animation */}
        <div className="w-full max-w-md mt-6">
          <Lottie animationData={animationData} loop autoplay />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-4 text-lg sm:text-xl"
        >
          Plan, track, and manage your team’s work all in one place.
        </motion.p>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="mt-6 inline-block"
        >
          <Link
            to="/auth"
            className="px-6 py-3 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 transition"
          >
            Get Started
          </Link>
        </motion.div>
      </header>

      {/* Features Section */}
      <section id="features" data-aos="fade-up" className="py-20 px-6 bg-white dark:bg-gray-900">
        <h2 className="text-3xl font-bold text-center mb-12">Awesome Features</h2>
        <FeatureSection />
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" data-aos="fade-up" className="py-20 px-6 bg-gray-100 dark:bg-gray-800">
        <h2 className="text-3xl font-bold text-center mb-12">What Users Say</h2>
        <TestimonialCard />
      </section>

      {/* Newsletter Section */}
      <section id="newsletter" data-aos="fade-up" className="py-20 px-6 bg-white dark:bg-gray-900">
        <h2 className="text-3xl font-bold text-center mb-8">Stay Updated</h2>
        <Newsletter />
      </section>

      {/* Contact Section */}
      <section id="contact" data-aos="fade-up" className="py-20 px-6 bg-gray-100 dark:bg-gray-800">
        <h2 className="text-3xl font-bold text-center mb-8">Contact Us</h2>
        <ContactForm />
      </section>

      {/* Auth Section (login/register links) */}
      <section id="auth" className="py-10 text-center">
        <p className="text-lg mb-4">Already have an account?</p>
        <Link to="/auth" className="text-indigo-600 hover:underline font-medium">
          Login
        </Link>

        <p className="text-lg mt-6 mb-4">New here?</p>
        <Link to="/auth" className="text-indigo-600 hover:underline font-medium">
          Register
        </Link>
      </section>

      {/* Scroll to Top Button */}
      <a
        href="#top"
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition"
      >
        <FaArrowUp />
      </a>

      {/* Dark Mode Toggle Floating */}
      <div className="fixed bottom-6 left-6">
        <DarkModeToggle />
      </div>
    </div>
  );
};

export default LandingPage;

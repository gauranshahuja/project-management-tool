import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { lazy, Suspense } from "react";
import FeatureSection from "../components/FeatureSection";
import ContactForm from "../components/ContactForm";
import Newsletter from "../components/Newsletter";
import TestimonialCard from "../components/Testimonials";
import animationData from "../assets/animations/project-animation.json";
import { FaArrowUp } from "react-icons/fa";
import AuthModal from "../components/AuthModal";

const Lottie = lazy(() => import("lottie-react"));

const LandingPage = ({ showAuth = false }) => {
  const [showAuthModal, setShowAuthModal] = useState(showAuth);
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    if (showAuth) {
      setAuthMode("login");
      setShowAuthModal(true);
    }
  }, [showAuth]);

  const handleGetStarted = () => {
    setAuthMode("login");
    setShowAuthModal(true);
  };

  const handleLogin = () => {
    setAuthMode("login");
    setShowAuthModal(true);
  };

  const handleRegister = () => {
    setAuthMode("register");
    setShowAuthModal(true);
  };

  return (
    <div className="relative">
      <div className="relative z-50">
        <div id="top" />
        <Navbar onLogin={handleLogin} onRegister={handleRegister} />

        <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 pb-14 pt-28 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
            Multi-company project OS
          </p>
          <h1 className="mb-4 text-4xl font-bold text-gray-950 dark:text-white md:text-6xl">
            ProjectHub
          </h1>

          <p className="mb-6 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300 md:text-lg">
            Run projects, tasks, teams, roles, activity, and analytics from one
            focused workspace.
          </p>

          <div className="mb-6 w-full max-w-md">
            <Suspense
              fallback={
                <div className="mx-auto h-64 w-64 animate-pulse rounded-full bg-indigo-50 dark:bg-gray-800" />
              }
            >
              <Lottie animationData={animationData} loop autoplay />
            </Suspense>
          </div>

          <button
            type="button"
            onClick={handleGetStarted}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 font-medium text-white shadow-md transition hover:bg-indigo-700"
          >
            Get Started
          </button>
        </section>

        <section id="features" className="relative z-10 py-20 px-6 bg-white dark:bg-gray-900">
          <h2 className="text-3xl font-bold text-center mb-12">
            Powerful Features
          </h2>
          <FeatureSection />
        </section>

        <section id="testimonials" className="relative z-10 py-20 px-6 bg-gray-50 dark:bg-gray-800">
          <h2 className="text-3xl font-bold text-center mb-12">
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

        <section id="newsletter" className="relative z-10 py-20 px-6 bg-indigo-50 dark:bg-gray-700">
          <h2 className="text-3xl font-bold text-center mb-8">
            Stay in the Loop
          </h2>
          <Newsletter />
        </section>

        <section id="contact" className="relative z-10 py-20 px-6 bg-white dark:bg-gray-900">
          <h2 className="text-3xl font-bold text-center mb-8">
            Let's Talk!
          </h2>
          <ContactForm />
        </section>

        <a
          href="#top"
          className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition"
        >
          <FaArrowUp />
        </a>

        <footer className="bg-gray-100 dark:bg-gray-800 text-center py-4 text-sm text-gray-600 dark:text-gray-300">
          Copyright {new Date().getFullYear()} ProjectHub. All rights reserved.
        </footer>
      </div>

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};

export default LandingPage;

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";
import Lottie from "lottie-react";
import animationData from "../assets/animations/project-animation.json";

import { FaRocket, FaLock, FaUsers } from "react-icons/fa";

import FeatureCard from "../components/FeatureCard";
import Testimonials from "../components/Testimonials";
import Newsletter from "../components/Newsletter";
import ContactForm from "../components/ContactForm";
import DarkModeToggle from "../components/DarkModeToggle";
import Navbar from "../components/Navbar";

function LandingPage() {
  const testimonialRef = useRef(null);
  const newsletterRef = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  const scrollTo = (ref) => {
    ref?.current?.scrollIntoView({ behavior: "smooth" });
  };

  const features = [
    {
      icon: <FaRocket className="text-indigo-600 dark:text-indigo-400" size={32} />,
      title: "Fast Launch",
      description: "Get your projects up and running in no time.",
    },
    {
      icon: <FaLock className="text-indigo-600 dark:text-indigo-400" size={32} />,
      title: "Secure Access",
      description: "Your data is protected with industry-standard encryption.",
    },
    {
      icon: <FaUsers className="text-indigo-600 dark:text-indigo-400" size={32} />,
      title: "Team Collaboration",
      description: "Manage teams and assign tasks efficiently.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-white overflow-x-hidden">
      <Navbar
        scrollToTestimonial={() => scrollTo(testimonialRef)}
        scrollToNewsletter={() => scrollTo(newsletterRef)}
        scrollToContact={() => scrollTo(contactRef)}
      />

      <DarkModeToggle />

      {/* Animated Blobs */}
      <div className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse z-0"></div>
      <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-indigo-300 dark:bg-indigo-700 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-ping z-0"></div>

      {/* Hero Section with Lottie */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24">
        <div className="w-60 md:w-80" data-aos="fade-up">
          <Lottie animationData={animationData} loop />
        </div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-extrabold mb-4"
        >
          Manage Projects Effortlessly
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg mb-6 max-w-xl"
        >
          Streamline your team’s workflow and stay productive.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <a
            href="/register"
            className="bg-indigo-600 text-white px-6 py-3 rounded-full font-semibold shadow hover:bg-indigo-700 transition"
          >
            Create Account
          </a>
          <a
            href="/login"
            className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-full font-semibold hover:bg-indigo-50 dark:hover:bg-gray-700 transition"
          >
            Login
          </a>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 z-10 relative">
        <h2 className="text-3xl font-bold text-center mb-10" data-aos="fade-up">
          Key Features
        </h2>
        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="transition duration-300"
              data-aos="fade-up"
              data-aos-delay={i * 100}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialRef} className="py-20 bg-white dark:bg-gray-900 px-4">
        <div data-aos="fade-up">
          <Testimonials />
        </div>
      </section>

      {/* Newsletter Section */}
      <section ref={newsletterRef} className="py-20 px-4 bg-indigo-50 dark:bg-indigo-900">
        <div data-aos="fade-up">
          <Newsletter />
        </div>
      </section>

      {/* Contact Form */}
      <section ref={contactRef} className="py-20 px-4 bg-gray-100 dark:bg-gray-800">
        <div data-aos="fade-up">
          <ContactForm />
        </div>
      </section>

      {/* Floating CTA Button */}
      <a
        href="/register"
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-full shadow-lg transition duration-300"
      >
        Let’s Chat 💬
      </a>
    </div>
  );
}

export default LandingPage;
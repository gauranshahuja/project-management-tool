import { useEffect } from "react";
import lottie from "lottie-web";
import AOS from "aos";
import "aos/dist/aos.css";
import animationData from "../assets/animations/project-animation.json";

const testimonials = [
  {
    name: "Anjali Verma",
    role: "Product Manager",
    text: "This tool changed how our team collaborates. It's intuitive and powerful!",
  },
  {
    name: "Ravi Kumar",
    role: "Team Lead",
    text: "Project Management Tool helped us hit every deadline. A must-have for startups.",
  },
  {
    name: "Sara Nair",
    role: "Developer",
    text: "Beautiful UI, smooth workflow, and awesome features. Highly recommended!",
  },
];

export default function LandingPage() {
  useEffect(() => {
    const container = document.getElementById("lottie-animation");
    if (container) {
      lottie.loadAnimation({
        container,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData,
      });
    }

    AOS.init({
      duration: 800,
      once: true,
    });
  }, []);

  return (
    <div className="font-sans text-gray-800 bg-white">
      {/* Hero */}
      <section
        className="h-screen flex flex-col justify-center items-center text-center px-4 relative"
        data-aos="fade-up"
      >
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Project Management Tool
        </h1>
        <p className="text-lg md:text-xl mb-6 max-w-xl">
          Organize, Collaborate & Deliver Projects Faster with Ease.
        </p>
        <a
          href="#features"
          className="bg-blue-600 text-white px-6 py-3 rounded-full text-lg transition hover:bg-blue-700"
        >
          Explore Features
        </a>

        {/* Lottie animation */}
        <div
          id="lottie-animation"
          className="w-full max-w-md mt-10"
          aria-label="Lottie animation"
        ></div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 animate-bounce text-gray-500">
          <span>&#8595;</span>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-100">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12" data-aos="fade-up">
            Key Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[
              {
                title: "Team Collaboration",
                desc: "Invite your team and assign roles to streamline your projects.",
              },
              {
                title: "Task Management",
                desc: "Create, track, and prioritize tasks easily with drag-and-drop.",
              },
              {
                title: "Analytics Dashboard",
                desc: "Visualize project progress and productivity stats in real-time.",
              },
            ].map((f, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
                data-aos="zoom-in"
                data-aos-delay={idx * 100}
              >
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12" data-aos="fade-up">
            What Our Users Say
          </h2>
          <div className="flex overflow-x-auto gap-6 snap-x snap-mandatory">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="snap-center min-w-[300px] bg-gray-100 p-6 rounded-2xl shadow text-left"
                data-aos="fade-right"
                data-aos-delay={idx * 200}
              >
                <p className="italic text-gray-700 mb-4">“{t.text}”</p>
                <h4 className="font-semibold">{t.name}</h4>
                <p className="text-sm text-gray-500">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section
        className="py-16 bg-blue-600 text-white text-center"
        data-aos="fade-up"
      >
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="mb-6">Sign up today and supercharge your productivity!</p>
        <a
          href="/register"
          className="inline-block bg-white text-blue-600 px-6 py-3 rounded-full font-medium text-lg transition hover:bg-gray-100"
        >
          Create Account
        </a>
      </section>
    </div>
  );
}

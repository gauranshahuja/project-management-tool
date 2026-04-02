import { useEffect, useState } from "react";
import { FaQuoteLeft } from "react-icons/fa";

const testimonials = [
  {
    name: "Aman Singh",
    feedback: "This tool has completely changed how we manage our projects. Love it!",
  },
  {
    name: "Priya Desai",
    feedback: "Simple, fast, and efficient. My team is more productive than ever.",
  },
  {
    name: "Ravi Kumar",
    feedback: "Beautiful UI and smooth experience. Highly recommend!",
  },
];

function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const testimonial = testimonials[index];

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-white relative z-10">
      <h2 className="text-3xl font-bold text-center mb-10">What Our Users Say</h2>
      <div className="max-w-2xl mx-auto text-center transition-all duration-700 ease-in-out">
        <FaQuoteLeft className="mx-auto text-indigo-500 text-4xl mb-4" />
        <p className="text-xl italic mb-4">"{testimonial.feedback}"</p>
        <p className="font-semibold">- {testimonial.name}</p>
      </div>
    </section>
  );
}

export default Testimonials;

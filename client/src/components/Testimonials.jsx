import { useEffect, useState } from "react";

const testimonials = [
  {
    name: "Alice",
    comment: "This tool transformed the way our team works!",
  },
  {
    name: "Bob",
    comment: "Simple, clean, and powerful.",
  },
  {
    name: "Clara",
    comment: "Helped me stay organized and productive.",
  },
];

function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const { name, comment } = testimonials[index];

  return (
    <section className="bg-indigo-100 dark:bg-gray-800 text-center py-16 px-4">
      <h2 className="text-3xl font-bold text-indigo-600 dark:text-white mb-8">What Users Say</h2>
      <blockquote className="text-xl italic text-gray-700 dark:text-gray-200 max-w-2xl mx-auto">
        "{comment}"
      </blockquote>
      <p className="mt-4 font-semibold text-indigo-600 dark:text-indigo-300">- {name}</p>
    </section>
  );
}

export default Testimonials;

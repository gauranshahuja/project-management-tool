function Newsletter() {
  return (
    <section className="py-16 px-6 bg-indigo-100 dark:bg-gray-800 text-gray-800 dark:text-white relative z-10">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Stay in the Loop</h2>
        <p className="mb-6 text-lg">Subscribe to our newsletter to get updates directly to your inbox.</p>
        <form className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          <input
            type="email"
            placeholder="Enter your email"
            className="px-4 py-2 rounded-full w-full sm:w-auto border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold transition"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}

export default Newsletter;

function ContactForm() {
  return (
    <section className="bg-white dark:bg-gray-900 py-16 px-6">
      <h2 className="text-3xl font-bold text-center text-indigo-600 dark:text-white mb-8">Contact Us</h2>
      <form className="max-w-xl mx-auto space-y-6">
        <input
          type="text"
          placeholder="Your Name"
          className="w-full p-3 rounded border dark:bg-gray-800 dark:border-gray-700"
        />
        <input
          type="email"
          placeholder="Your Email"
          className="w-full p-3 rounded border dark:bg-gray-800 dark:border-gray-700"
        />
        <textarea
          placeholder="Your Message"
          rows={5}
          className="w-full p-3 rounded border dark:bg-gray-800 dark:border-gray-700"
        ></textarea>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white p-3 rounded font-bold hover:bg-indigo-700 transition"
        >
          Send Message
        </button>
      </form>
    </section>
  );
}

export default ContactForm;

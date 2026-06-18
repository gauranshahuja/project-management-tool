const FeatureCard = ({ icon, title, description }) => {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center hover:scale-105 transition-transform"
    >
      <div className="text-indigo-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
};

export default FeatureCard;

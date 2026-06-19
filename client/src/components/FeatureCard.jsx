const FeatureCard = ({ icon, title, description, detail, tone = "indigo" }) => {
  const toneClasses = {
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-200",
    emerald:
      "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-200",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-200",
  };

  return (
    <div className="border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950">
      <div
        className={`mb-5 inline-flex h-11 w-11 items-center justify-center ${toneClasses[tone]}`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-950 dark:text-white">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
        {description}
      </p>
      {detail && (
        <p className="mt-5 border-t border-gray-200 pt-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:border-gray-800">
          {detail}
        </p>
      )}
    </div>
  );
};

export default FeatureCard;

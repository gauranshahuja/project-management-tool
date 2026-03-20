import { IconContext } from "react-icons";

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:scale-105 transition transform duration-300">
      <IconContext.Provider value={{ size: "2em", className: "text-indigo-500 mb-4" }}>
        <div>{icon}</div>
      </IconContext.Provider>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default FeatureCard;

import FeatureCard from "./FeatureCard";
import { FaTasks, FaUsers, FaChartLine } from "react-icons/fa";

const features = [
  {
    icon: <FaTasks size={30} />,
    title: "Task Management",
    description:
      "Create, assign, and track tasks easily with intuitive controls and real-time updates.",
  },
  {
    icon: <FaUsers size={30} />,
    title: "Team Collaboration",
    description:
      "Communicate and collaborate with your team seamlessly using built-in chat and notifications.",
  },
  {
    icon: <FaChartLine size={30} />,
    title: "Progress Tracking",
    description:
      "Visualize your progress with charts, timelines, and automated status reports.",
  },
];

const FeatureSection = () => {
  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
        />
      ))}
    </div>
  );
};

export default FeatureSection;

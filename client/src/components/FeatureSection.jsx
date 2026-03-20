import FeatureCard from "./FeatureCard";
import { FaTasks, FaUsers, FaChartLine } from "react-icons/fa";

function FeatureSection() {
  return (
    <section className="py-16 px-6 bg-gray-50 dark:bg-gray-900 text-center">
      <h2 className="text-3xl font-bold mb-8 text-indigo-600 dark:text-white">Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <FeatureCard
          icon={<FaTasks />}
          title="Task Management"
          description="Organize and prioritize tasks effortlessly."
        />
        <FeatureCard
          icon={<FaUsers />}
          title="Team Collaboration"
          description="Work together and stay on the same page."
        />
        <FeatureCard
          icon={<FaChartLine />}
          title="Progress Tracking"
          description="Visualize your progress in real-time."
        />
      </div>
    </section>
  );
}

export default FeatureSection;

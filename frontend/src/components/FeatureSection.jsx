import FeatureCard from "./FeatureCard";
import { FaTasks, FaUsers, FaChartLine } from "react-icons/fa";

const features = [
  {
    icon: <FaTasks size={30} />,
    title: "Execution without ambiguity",
    description:
      "Create projects, assign owners, set priorities, discuss work, and move tasks from list to board without losing context.",
    detail: "Projects + tasks + comments",
    tone: "indigo",
  },
  {
    icon: <FaUsers size={30} />,
    title: "Company access control",
    description:
      "Invite teammates, manage roles, limit member actions, and keep every company workspace scoped to the right people.",
    detail: "Owner/Admin/Manager/Member",
    tone: "emerald",
  },
  {
    icon: <FaChartLine size={30} />,
    title: "Decision-ready reporting",
    description:
      "See overdue work, status distribution, top assignees, and activity logs before leadership meetings start.",
    detail: "Analytics + audit trail",
    tone: "amber",
  },
];

const FeatureSection = () => {
  return (
    <div className="mt-10 grid gap-5 md:grid-cols-3">
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
          detail={feature.detail}
          tone={feature.tone}
        />
      ))}
    </div>
  );
};

export default FeatureSection;

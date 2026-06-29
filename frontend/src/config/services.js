import {
  FiGrid,
  FiFolder,
  FiUsers,
  FiBox,
  FiBook,
  FiMessageSquare,
  FiBarChart2,
  FiSettings,
} from "react-icons/fi";

// The console service tree. One source of truth for the sidebar, the services
// catalog, and onboarding. Each top-level service has a key, label, icon, and
// either a `path` (leaf) or `children` (expandable group).
export const services = [
  {
    key: "overview",
    label: "Overview",
    icon: FiGrid,
    path: "/console",
  },
  {
    key: "projects",
    label: "Projects",
    icon: FiFolder,
    children: [
      { key: "projects-list", label: "Projects", path: "/console/projects" },
      { key: "tasks", label: "Tasks", path: "/console/tasks" },
      { key: "my-tasks", label: "My Tasks", path: "/console/my-tasks" },
    ],
  },
  {
    key: "people",
    label: "People",
    icon: FiUsers,
    children: [
      { key: "employees", label: "Employees", path: "/console/people/employees" },
      { key: "attendance", label: "Attendance", path: "/console/people/attendance" },
      { key: "leave", label: "Leave", path: "/console/people/leave" },
      { key: "payroll", label: "Payroll", path: "/console/people/payroll" },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    icon: FiBox,
    children: [
      { key: "products", label: "Products", path: "/console/inventory/products" },
      { key: "stock", label: "Stock", path: "/console/inventory/stock" },
      { key: "purchase-orders", label: "Purchase Orders", path: "/console/inventory/purchase-orders" },
      { key: "orders", label: "Orders", path: "/console/inventory/orders" },
      { key: "returns", label: "Returns", path: "/console/inventory/returns" },
      { key: "transfers", label: "Transfers", path: "/console/inventory/transfers" },
    ],
  },
  {
    key: "directory",
    label: "Directory",
    icon: FiBook,
    children: [
      { key: "contacts", label: "Contacts", path: "/console/contacts" },
    ],
  },
  {
    key: "communication",
    label: "Communication",
    icon: FiMessageSquare,
    children: [
      { key: "chat", label: "Chat", path: "/console/chat" },
      { key: "notifications", label: "Notifications", path: "/console/notifications" },
    ],
  },
  {
    key: "insights",
    label: "Insights",
    icon: FiBarChart2,
    children: [
      { key: "dashboard", label: "Dashboard", path: "/console/insights/dashboard" },
      { key: "analytics", label: "Analytics", path: "/console/insights/analytics" },
      { key: "reports", label: "Reports", path: "/console/insights/reports" },
    ],
  },
  {
    key: "administration",
    label: "Administration",
    icon: FiSettings,
    children: [
      { key: "members", label: "Members & Roles", path: "/console/admin/members" },
      { key: "organization", label: "Organization", path: "/console/admin/organization" },
      { key: "services", label: "Services", path: "/console/admin/services" },
    ],
  },
];

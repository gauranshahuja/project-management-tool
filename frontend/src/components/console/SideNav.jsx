import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";
import { services } from "../../config/services";

// Is any leaf under this group the active route? Used to auto-expand the group.
const groupHasActivePath = (node, pathname) =>
  node.children?.some((child) => pathname.startsWith(child.path));

const leafClass = ({ isActive }) =>
  `flex items-center rounded px-3 py-1.5 text-sm transition-colors ${
    isActive
      ? "bg-brand-subtle font-medium text-brand"
      : "text-ink-muted hover:bg-surface-subtle hover:text-ink"
  }`;

const Group = ({ node, pathname }) => {
  const [open, setOpen] = useState(() => groupHasActivePath(node, pathname));
  const Icon = node.icon;

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-subtle"
      >
        {Icon && <Icon className="shrink-0 text-ink-muted" aria-hidden="true" />}
        <span className="flex-1 text-left">{node.label}</span>
        <FiChevronRight
          aria-hidden="true"
          className={`shrink-0 text-ink-subtle transition-transform ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>
      {open && (
        <ul className="mt-0.5 space-y-0.5 pl-6">
          {node.children.map((child) => (
            <li key={child.key}>
              <NavLink to={child.path} className={leafClass}>
                {child.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

const TopLeaf = ({ node }) => {
  const Icon = node.icon;
  return (
    <li>
      <NavLink
        to={node.path}
        end
        className={({ isActive }) =>
          `flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors ${
            isActive
              ? "bg-brand-subtle text-brand"
              : "text-ink hover:bg-surface-subtle"
          }`
        }
      >
        {Icon && <Icon className="shrink-0 text-ink-muted" aria-hidden="true" />}
        <span>{node.label}</span>
      </NavLink>
    </li>
  );
};

const SideNav = () => {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Services"
      className="flex h-full w-60 flex-col gap-0.5 overflow-y-auto border-r border-line bg-surface px-2 py-3"
    >
      <ul className="space-y-0.5">
        {services.map((node) =>
          node.children ? (
            <Group key={node.key} node={node} pathname={pathname} />
          ) : (
            <TopLeaf key={node.key} node={node} />
          )
        )}
      </ul>
    </nav>
  );
};

export default SideNav;

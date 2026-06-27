// Surface container used across the console for grouped content.
const Card = ({ title, description, actions, footer, className = "", children }) => (
  <div
    className={`rounded-card border border-line bg-surface shadow-card ${className}`}
  >
    {(title || actions) && (
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          {title && <h3 className="text-sm font-medium text-ink">{title}</h3>}
          {description && (
            <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className="px-4 py-4">{children}</div>
    {footer && (
      <div className="border-t border-line px-4 py-3 text-sm text-ink-muted">
        {footer}
      </div>
    )}
  </div>
);

export default Card;

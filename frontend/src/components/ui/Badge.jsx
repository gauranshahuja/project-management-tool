// Small status pill. Tone picks the color; default is neutral.
const tones = {
  neutral: "bg-surface-subtle text-ink-muted border-line-strong",
  brand: "bg-brand-subtle text-brand border-brand-subtle",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
};

const Badge = ({ tone = "neutral", className = "", children }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
      tones[tone] || tones.neutral
    } ${className}`}
  >
    {children}
  </span>
);

export default Badge;

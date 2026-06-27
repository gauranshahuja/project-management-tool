import { forwardRef } from "react";

// Shared wrapper: label on top, control in the middle, error/hint below.
export const Field = ({ label, htmlFor, error, hint, required, children }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="text-xs text-danger">{error}</p>
    ) : hint ? (
      <p className="text-xs text-ink-subtle">{hint}</p>
    ) : null}
  </div>
);

const controlBase =
  "w-full rounded border bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50";

const lineClass = (error) => (error ? "border-danger" : "border-line-strong");

export const Input = forwardRef(function Input(
  { label, error, hint, required, id, className = "", ...props },
  ref
) {
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <input
        ref={ref}
        id={id}
        className={`${controlBase} h-9 ${lineClass(error)} ${className}`}
        {...props}
      />
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, id, rows = 4, className = "", ...props },
  ref
) {
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={`${controlBase} py-2 ${lineClass(error)} ${className}`}
        {...props}
      />
    </Field>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, required, id, children, className = "", ...props },
  ref
) {
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <select
        ref={ref}
        id={id}
        className={`${controlBase} h-9 ${lineClass(error)} ${className}`}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
});

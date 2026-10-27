import type { ComponentProps, ReactNode } from "react";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "soft";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm",
  outline: "border border-line bg-surface text-ink hover:border-brand-400 hover:text-brand-600",
  ghost: "text-ink hover:bg-surface-muted",
  danger: "bg-danger text-white hover:brightness-95",
  soft: "bg-brand-50 text-brand-700 hover:bg-brand-100",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  fullWidth,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-[var(--radius-card)] border border-line bg-surface shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "success" | "danger" | "accent";
  className?: string;
}) {
  const tones = {
    neutral: "bg-surface-muted text-ink-muted",
    brand: "bg-brand-50 text-brand-700",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    accent: "bg-amber-100 text-amber-700",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}

export function Stars({ value, count, className }: { value: number; count?: number; className?: string }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)} aria-label={`Rated ${value} out of 5`}>
      <span aria-hidden className="text-accent">
        {"★★★★★".slice(0, Math.floor(rounded))}
        {rounded % 1 >= 0.5 ? "½" : ""}
        <span className="text-line">{"★★★★★".slice(Math.ceil(rounded))}</span>
      </span>
      {count !== undefined && <span className="text-ink-muted">({count})</span>}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 px-6 py-14 text-center">
      {icon && <div className="text-4xl text-ink-faint">{icon}</div>}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-md text-sm text-ink-muted">{description}</p>}
      {action}
    </div>
  );
}

export function Alert({
  tone = "danger",
  children,
}: {
  tone?: "danger" | "success" | "info";
  children: ReactNode;
}) {
  const tones = {
    danger: "border-danger/30 bg-danger-soft text-danger",
    success: "border-success/30 bg-success-soft text-success",
    info: "border-brand-200 bg-brand-50 text-brand-700",
  } as const;
  return (
    <div role="alert" className={cn("rounded-xl border px-4 py-3 text-sm font-medium", tones[tone])}>
      {children}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ink-faint">{hint}</p>}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

const controlClasses =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-surface-muted";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlClasses, "min-h-24 resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(controlClasses, "appearance-none pr-9", className)} {...props}>
      {children}
    </select>
  );
}

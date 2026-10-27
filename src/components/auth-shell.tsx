import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="container-page flex justify-center py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Link href="/" className="text-2xl font-extrabold text-brand-600">Bazar</Link>
          <h1 className="text-xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
        </div>
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-sm">{children}</div>
        {footer && <div className="mt-4 text-center text-sm text-ink-muted">{footer}</div>}
      </div>
    </div>
  );
}

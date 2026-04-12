import { clsx } from "clsx";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

export function Section({ children, className }: SectionProps) {
  return (
    <section className={clsx("py-16 sm:py-20", className)}>{children}</section>
  );
}

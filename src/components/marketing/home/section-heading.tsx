import { clsx } from "clsx";

export function SectionHeading({
  kicker,
  title,
  className,
}: {
  kicker: string;
  title?: string;
  className?: string;
}) {
  return (
    <div className={clsx(className)}>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-foreground">
        {kicker}
      </p>
      {title && (
        <h2 className="mt-4 text-2xl font-medium tracking-tight sm:text-3xl">
          {title}
        </h2>
      )}
    </div>
  );
}

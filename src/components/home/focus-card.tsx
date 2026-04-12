export function FocusCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border border-border-subtle p-6 transition-all duration-300 hover:border-accent/30 hover:bg-surface/60">
      <h3 className="font-medium tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}

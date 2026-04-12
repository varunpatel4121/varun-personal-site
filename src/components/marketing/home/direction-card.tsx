export function DirectionCard({
  index,
  title,
  description,
  tags,
}: {
  index: string;
  title: string;
  description: string;
  tags: string[];
}) {
  return (
    <div className="group rounded-xl border border-border-subtle bg-surface/40 p-6 transition-all duration-300 hover:border-accent/30 hover:bg-surface">
      <span className="font-mono text-xs text-subtle">{index}</span>
      <h3 className="mt-3 text-lg font-medium tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-border-subtle bg-surface px-2.5 py-0.5 font-mono text-xs text-subtle transition-colors group-hover:border-accent/20"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="animate-in pb-12 pt-16 sm:pt-20">
      <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
          {description}
        </p>
      )}
    </div>
  );
}

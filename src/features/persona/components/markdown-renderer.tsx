"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Partial<Components> = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  h1: ({ children }) => (
    <h1 className="mb-3 mt-6 text-lg font-semibold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-5 text-base font-semibold first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-sm font-semibold first:mt-0">{children}</h3>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent-foreground underline decoration-accent-foreground/30 underline-offset-2 transition-colors hover:decoration-accent-foreground/60"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-border pl-4 text-muted last:mb-0">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <div className="mb-3 overflow-hidden rounded-lg border border-border-subtle last:mb-0">
          <div className="flex items-center justify-between border-b border-border-subtle bg-surface px-3 py-1.5">
            <span className="font-mono text-[10px] text-subtle">
              {className?.replace("language-", "") ?? "code"}
            </span>
            <CopyButton text={String(children).replace(/\n$/, "")} />
          </div>
          <pre className="overflow-x-auto bg-surface/50 p-3">
            <code className="font-mono text-[13px] leading-relaxed text-foreground/90">
              {children}
            </code>
          </pre>
        </div>
      );
    }
    return (
      <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[13px] text-accent-foreground">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  hr: () => <hr className="my-4 border-border-subtle" />,
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border-subtle bg-surface px-3 py-2 text-left text-xs font-medium text-muted">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border-subtle px-3 py-2">{children}</td>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
};

function CopyButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text)}
      className="rounded px-1.5 py-0.5 text-[10px] text-subtle transition-colors hover:bg-surface-elevated hover:text-muted"
    >
      Copy
    </button>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

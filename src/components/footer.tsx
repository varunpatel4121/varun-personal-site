import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border-subtle">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <p className="text-sm text-subtle">
          &copy; {new Date().getFullYear()} {siteConfig.name}
        </p>
        <div className="flex items-center gap-6">
          <FooterLink href={siteConfig.links.github} label="GitHub" />
          <FooterLink href={siteConfig.links.linkedin} label="LinkedIn" />
          <FooterLink href={siteConfig.links.twitter} label="X" />
          <FooterLink href={siteConfig.links.email} label="Email" />
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
      className="text-sm text-subtle transition-colors hover:text-foreground"
    >
      {label}
    </Link>
  );
}

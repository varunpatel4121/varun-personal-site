import Link from "next/link";
import { siteConfig } from "@/lib/site";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-muted transition-colors hover:text-foreground"
        >
          &larr; {siteConfig.name}
        </Link>
        {children}
      </div>
    </div>
  );
}

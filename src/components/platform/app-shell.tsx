"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apps, type AppConfig } from "@/config/apps";
import { createClient } from "@/lib/supabase/client";

function resolveCurrentApp(pathname: string): AppConfig | undefined {
  return apps.find((app) => pathname.startsWith(app.href));
}

export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const currentApp = resolveCurrentApp(pathname);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-background/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 12L6 8l4-4" />
            </svg>
            <span className="hidden sm:inline">varunpatel.me</span>
          </Link>

          <div className="h-4 w-px bg-border-subtle" />

          {currentApp && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium tracking-tight">
                {currentApp.name}
              </span>
              {currentApp.status === "beta" && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent-foreground">
                  beta
                </span>
              )}
            </div>
          )}

          <div className="ml-auto flex items-center gap-4">
            {userEmail && (
              <>
                <span className="hidden text-xs text-subtle sm:inline">
                  {userEmail}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-muted transition-colors hover:text-foreground"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}

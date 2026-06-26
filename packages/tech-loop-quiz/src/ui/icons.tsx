"use client";

/**
 * Brand + UI marks. The Blue Light logo is an inline SVG (no asset file). The
 * platform icons come from Iconify (@iconify/react): Simple Icons for the real
 * brands (in their real brand colors), Lucide for the generic categories (which
 * inherit the button text color via `currentColor`). All render at 22px and fit
 * the dark, clean UI.
 */

import { Icon } from "@iconify/react";

export function Logo({ size = 22, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <span className="tlq-logo">
      <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="14" cy="14" r="11" fill="none" stroke="var(--tlq-accent)" strokeWidth="1.4" opacity="0.35" />
        <circle cx="14" cy="14" r="5.4" fill="var(--tlq-accent)" />
        <g stroke="var(--tlq-accent)" strokeWidth="1.6" strokeLinecap="round">
          <line x1="14" y1="1.5" x2="14" y2="4.4" /><line x1="14" y1="23.6" x2="14" y2="26.5" />
          <line x1="1.5" y1="14" x2="4.4" y2="14" /><line x1="23.6" y1="14" x2="26.5" y2="14" />
          <line x1="5.2" y1="5.2" x2="7.2" y2="7.2" /><line x1="20.8" y1="20.8" x2="22.8" y2="22.8" />
          <line x1="22.8" y1="5.2" x2="20.8" y2="7.2" /><line x1="7.2" y1="20.8" x2="5.2" y2="22.8" />
        </g>
      </svg>
      {wordmark && <span className="tlq-wordmark">Blue Light Health</span>}
    </span>
  );
}

/**
 * Platform id → Iconify icon name. Simple Icons for real brands, Lucide for the
 * generic categories. (Ids come from config/platforms.json.)
 */
const PLATFORM_ICON: Record<string, string> = {
  instagram: "simple-icons:instagram",
  tiktok: "simple-icons:tiktok",
  youtube: "simple-icons:youtube",
  twitter: "simple-icons:x",
  reddit: "simple-icons:reddit",
  meta_facebook: "simple-icons:meta",
  twitch: "simple-icons:twitch",
  discord: "simple-icons:discord",
  snapchat: "simple-icons:snapchat",
  tv_and_streaming: "lucide:monitor-play",
  pc_gaming_console_gaming: "lucide:gamepad-2",
  ai_chat_gpt_gemini_claude: "lucide:sparkles",
  conversational_chatbots: "lucide:message-square",
  adult_content: "lucide:eye-off",
  betting_trading_gambling: "lucide:circle-dollar-sign",
};

/**
 * Real brand colors for the Simple Icons brands, chosen to read on the dark
 * navy theme (X is a black/white mark, so it stays white). Generic Lucide
 * categories have no entry and inherit currentColor (the button text color).
 */
const PLATFORM_COLOR: Record<string, string> = {
  instagram: "#E4405F",
  tiktok: "#25F4EE",
  youtube: "#FF0000",
  twitter: "#FFFFFF",
  reddit: "#FF4500",
  meta_facebook: "#0866FF",
  twitch: "#9146FF",
  discord: "#5865F2",
  snapchat: "#FFFC00",
};

export function PlatformIcon({ id }: { id: string }) {
  return (
    <Icon
      icon={PLATFORM_ICON[id] ?? "lucide:globe"}
      width={22}
      height={22}
      color={PLATFORM_COLOR[id]}
      aria-hidden
    />
  );
}

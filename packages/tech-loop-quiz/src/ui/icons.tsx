"use client";

/**
 * Brand + UI marks. The Blue Light logo is an inline SVG (no asset file). The
 * platform icons come from Iconify (@iconify/react): Simple Icons for the real
 * brands, Lucide for the generic categories. Every icon is monochrome and
 * inherits the button's text color via `currentColor`, so selected/unselected
 * states follow automatically — no full brand colors, consistent with the dark,
 * clean, outline-style UI.
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
  adult_content: "lucide:shield-alert",
  betting_trading_gambling: "lucide:dice-5",
};

export function PlatformIcon({ id }: { id: string }) {
  return <Icon icon={PLATFORM_ICON[id] ?? "lucide:globe"} width={22} height={22} aria-hidden />;
}

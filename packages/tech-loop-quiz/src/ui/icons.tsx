"use client";

/**
 * Inline SVG marks — no asset files, fully portable. The Blue Light logo and a
 * set of clean, monochrome platform glyphs. These are simplified category icons
 * (a camera for photo apps, a play button for video, etc.), not reproductions of
 * trademarked brand logos — consistent with the UI and safe to ship anywhere.
 */

import type { ReactNode } from "react";

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

const svg = (children: ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const dot = (cx: number, cy: number, r = 1.1) => <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />;

export function PlatformIcon({ id }: { id: string }) {
  switch (id) {
    case "instagram":
      return svg(<><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" />{dot(17, 7, 1)}</>);
    case "tiktok":
      return svg(<><circle cx="8.5" cy="17" r="2.3" /><path d="M10.8 17V5c.7 2.2 2.2 3.3 4.4 3.4" /></>);
    case "youtube":
      return svg(<><rect x="2.5" y="6" width="19" height="12" rx="3.5" /><path d="M10.4 9.4l4.2 2.6-4.2 2.6z" fill="currentColor" stroke="none" /></>);
    case "twitter":
      return svg(<><path d="M4.5 4.5l15 15M19.5 4.5l-15 15" /></>);
    case "tv_and_streaming":
      return svg(<><rect x="3" y="5" width="18" height="12" rx="2.5" /><path d="M8.5 21h7M12 17v4" /></>);
    case "reddit":
      return svg(<><circle cx="12" cy="13.5" r="7.5" />{dot(9.3, 13)}{dot(14.7, 13)}<path d="M9.3 16.4c1.7 1.1 3.7 1.1 5.4 0" /><path d="M15 7.2l-.8 4" /><circle cx="15.2" cy="6.4" r="1.2" /></>);
    case "meta_facebook":
      return svg(<><circle cx="8.6" cy="12" r="5.4" /><circle cx="15.4" cy="12" r="5.4" /></>);
    case "twitch":
      return svg(<><path d="M5 4.5h14v8l-3.5 3.5H12L9.5 19.5V16H5z" />{<line x1="11" y1="8.5" x2="11" y2="12" />}<line x1="15" y1="8.5" x2="15" y2="12" /></>);
    case "discord":
      return svg(<><rect x="3.5" y="6" width="17" height="11" rx="5.5" />{dot(9, 11.5, 1.2)}{dot(15, 11.5, 1.2)}<path d="M8 16l-1 2M16 16l1 2" /></>);
    case "pc_gaming_console_gaming":
      return svg(<><rect x="3" y="8" width="18" height="9" rx="4.5" /><path d="M7.5 11v3M6 12.5h3" />{dot(16, 11.5)}{dot(18, 13.5)}{dot(14, 13.5)}</>);
    case "snapchat":
      return svg(<><path d="M12 4.5c2.5 0 4 1.9 4 4.3 0 1.4.3 2 1.3 2.3 1 .3 1.7.5 1.7 1s-1 .8-1.7 1.1c-.6.3 .1 1.4-1 1.9-.9.4-1.3-.2-2.3.3C13 16 13 17 12 17s-1-1-2-1.6c-1-.5-1.4.1-2.3-.3-1.1-.5-.4-1.6-1-1.9-.7-.3-1.7-.6-1.7-1.1s.7-.7 1.7-1c1-.3 1.3-.9 1.3-2.3 0-2.4 1.5-4.3 4-4.3z" /></>);
    case "ai_chat_gpt_gemini_claude":
      return svg(<><path d="M12 3.5l1.7 4.8 4.8 1.7-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7z" />{dot(18.5, 18, 1)}</>);
    case "conversational_chatbots":
      return svg(<><path d="M4.5 6.5h15v9h-9l-4 3z" />{dot(9, 11, 1)}{dot(12, 11, 1)}{dot(15, 11, 1)}</>);
    case "adult_content":
      return svg(<><path d="M12 3.5l7.5 3v5c0 4.3-3.2 7.4-7.5 8.5-4.3-1.1-7.5-4.2-7.5-8.5v-5z" /><path d="M9.2 12l2 2 3.6-3.8" /></>);
    case "betting_trading_gambling":
      return svg(<><rect x="4" y="4" width="16" height="16" rx="4.5" />{dot(9, 9)}{dot(15, 15)}{dot(12, 12)}</>);
    default:
      return svg(<><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c3 2.5 3 14.5 0 17M12 3.5c-3 2.5-3 14.5 0 17" /></>);
  }
}

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  event: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): number {
  if (process.env.NODE_ENV === "production") return LOG_LEVELS.info;
  return LOG_LEVELS.debug;
}

function emit(level: LogLevel, payload: LogPayload) {
  if (LOG_LEVELS[level] < getMinLevel()) return;

  const entry = {
    level,
    ts: new Date().toISOString(),
    ...payload,
  };

  switch (level) {
    case "error":
      console.error(JSON.stringify(entry));
      break;
    case "warn":
      console.warn(JSON.stringify(entry));
      break;
    default:
      console.log(JSON.stringify(entry));
  }
}

export const log = {
  debug: (payload: LogPayload) => emit("debug", payload),
  info: (payload: LogPayload) => emit("info", payload),
  warn: (payload: LogPayload) => emit("warn", payload),
  error: (payload: LogPayload) => emit("error", payload),
};

let counter = 0;

/** Lightweight request-scoped correlation id */
export function createRequestId(): string {
  counter = (counter + 1) % 1_000_000;
  return `req_${Date.now()}_${counter}`;
}

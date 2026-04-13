import { vi } from "vitest";

interface QueryResult {
  data: unknown;
  error: null | { message: string };
}

/**
 * Creates a fluent mock that mimics the Supabase PostgREST builder chain.
 * Every chainable method returns `this`, and terminal calls resolve the preset data.
 */
export function createMockSupabaseClient(presets: Record<string, QueryResult> = {}) {
  function makeBuilder(tableName: string): Record<string, unknown> {
    const preset = presets[tableName] ?? { data: null, error: null };

    const builder: Record<string, unknown> = {};

    const chainMethods = [
      "select",
      "insert",
      "update",
      "delete",
      "upsert",
      "eq",
      "neq",
      "gt",
      "lt",
      "gte",
      "lte",
      "like",
      "ilike",
      "in",
      "order",
      "limit",
      "range",
      "filter",
    ];

    for (const method of chainMethods) {
      builder[method] = vi.fn().mockReturnValue(builder);
    }

    builder.single = vi.fn().mockResolvedValue(preset);
    builder.maybeSingle = vi.fn().mockResolvedValue(preset);
    builder.then = (resolve: (v: QueryResult) => void) => resolve(preset);

    // Allow select() to return the builder for further chaining
    (builder.select as ReturnType<typeof vi.fn>).mockReturnValue(builder);
    (builder.insert as ReturnType<typeof vi.fn>).mockReturnValue(builder);
    (builder.delete as ReturnType<typeof vi.fn>).mockReturnValue(builder);

    return builder;
  }

  return {
    from: vi.fn((table: string) => makeBuilder(table)),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
  };
}

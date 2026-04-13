import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Project } from "@/lib/supabase/types";
import { log } from "@/lib/logger";

/**
 * The signup trigger normally creates the profile row, but it can be missing
 * if the schema was re-applied after the user already existed in auth.users.
 * This ensures the row exists before any FK-dependent inserts.
 */
async function ensureProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (!data) {
    log.info({ event: "persona.profile.backfill", userId });
    await supabase.from("profiles").insert({ id: userId });
  }
}

export async function getOrCreateDefaultProject(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Project> {
  await ensureProfile(supabase, userId);

  const { data: existing } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .eq("app", "persona")
    .eq("slug", "default")
    .single();

  if (existing) return existing as Project;

  log.info({ event: "persona.project.create", userId });

  const { data: created, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: "Persona",
      slug: "default",
      app: "persona",
      description: "Default Persona workspace",
    })
    .select()
    .single();

  if (error) {
    log.error({
      event: "persona.project.create_failed",
      userId,
      errorMessage: error.message,
    });
    throw new Error(`Failed to create default project: ${error.message}`);
  }

  return created as Project;
}

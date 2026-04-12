import { createClient } from "@/lib/supabase/server";
import { PersonaWorkspace } from "@/features/persona/components/persona-workspace";

export default async function PersonaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("app", "persona")
    .order("created_at", { ascending: false });

  return (
    <PersonaWorkspace
      userEmail={user?.email ?? null}
      projects={projects ?? []}
    />
  );
}

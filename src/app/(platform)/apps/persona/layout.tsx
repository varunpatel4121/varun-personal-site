import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateDefaultProject } from "@/features/persona/lib/server/project";
import { listChats } from "@/features/persona/lib/server/chats";
import { PersonaWorkspace } from "@/features/persona/components/persona-workspace";

export const metadata: Metadata = {
  title: "Persona",
  description:
    "Conversational AI with configurable personality layers and memory.",
};

export default async function PersonaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const project = await getOrCreateDefaultProject(supabase, user.id);
  const chats = await listChats(supabase, project.id);

  return (
    <PersonaWorkspace
      userId={user.id}
      projectId={project.id}
      initialChats={chats}
    >
      {children}
    </PersonaWorkspace>
  );
}

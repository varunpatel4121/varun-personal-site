import type { Project, Chat, Message, Document } from "@/lib/supabase/types";

export type PersonaProject = Project & { app: "persona" };

export type PersonaChat = Chat;
export type PersonaMessage = Message;
export type PersonaDocument = Document;

export interface PersonaWorkspaceProps {
  userEmail: string | null;
  projects: Project[];
}

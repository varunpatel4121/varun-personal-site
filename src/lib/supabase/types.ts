export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  app: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Chat = {
  id: string;
  project_id: string;
  user_id: string;
  title: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Pick<Profile, "id"> & Partial<Omit<Profile, "id">>;
        Update: Partial<Omit<Profile, "id">>;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: Pick<Project, "user_id" | "name" | "slug"> &
          Partial<Omit<Project, "id" | "user_id" | "name" | "slug">>;
        Update: Partial<Omit<Project, "id" | "user_id">>;
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: Document;
        Insert: Pick<
          Document,
          "project_id" | "user_id" | "name" | "storage_path"
        > &
          Partial<
            Omit<
              Document,
              "id" | "project_id" | "user_id" | "name" | "storage_path"
            >
          >;
        Update: Partial<Omit<Document, "id" | "user_id">>;
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      chats: {
        Row: Chat;
        Insert: Pick<Chat, "project_id" | "user_id"> &
          Partial<Omit<Chat, "id" | "project_id" | "user_id">>;
        Update: Partial<Omit<Chat, "id" | "user_id">>;
        Relationships: [
          {
            foreignKeyName: "chats_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chats_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: Message;
        Insert: Pick<Message, "chat_id" | "role" | "content"> &
          Partial<Omit<Message, "id" | "chat_id" | "role" | "content">>;
        Update: Partial<Omit<Message, "id" | "chat_id">>;
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

// Database type for the Supabase JS client.
// Shape mirrors what `supabase gen types typescript` would produce so that
// the supabase-js constraints (Database['public'] extends GenericSchema) hold.

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          slug: string;
          name: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          owner_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      tenant_members: {
        Row: {
          tenant_id: string;
          user_id: string;
          role: "owner" | "admin" | "agent";
          created_at: string;
        };
        Insert: {
          tenant_id: string;
          user_id: string;
          role?: "owner" | "admin" | "agent";
          created_at?: string;
        };
        Update: {
          role?: "owner" | "admin" | "agent";
        };
        Relationships: [];
      };
      chatbot_configs: {
        Row: {
          tenant_id: string;
          bot_name: string;
          welcome_message: string;
          primary_color: string;
          text_color: string;
          position: "left" | "right";
          avatar_url: string | null;
          ai_enabled: boolean;
          ai_model: string;
          ai_system_prompt: string;
          collect_lead: boolean;
          lead_fields: string[];
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          bot_name?: string;
          welcome_message?: string;
          primary_color?: string;
          text_color?: string;
          position?: "left" | "right";
          avatar_url?: string | null;
          ai_enabled?: boolean;
          ai_model?: string;
          ai_system_prompt?: string;
          collect_lead?: boolean;
          lead_fields?: string[];
        };
        Update: {
          bot_name?: string;
          welcome_message?: string;
          primary_color?: string;
          text_color?: string;
          position?: "left" | "right";
          avatar_url?: string | null;
          ai_enabled?: boolean;
          ai_model?: string;
          ai_system_prompt?: string;
          collect_lead?: boolean;
          lead_fields?: string[];
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          tenant_id: string;
          visitor_id: string;
          visitor_name: string | null;
          visitor_email: string | null;
          status: "open" | "closed";
          last_message_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          visitor_id: string;
          visitor_name?: string | null;
          visitor_email?: string | null;
          status?: "open" | "closed";
        };
        Update: {
          visitor_name?: string | null;
          visitor_email?: string | null;
          status?: "open" | "closed";
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          tenant_id: string;
          sender: "human" | "lead" | "ai";
          author_id: string | null;
          author_name: string | null;
          content: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          tenant_id: string;
          sender: "human" | "lead" | "ai";
          author_id?: string | null;
          author_name?: string | null;
          content: string;
          metadata?: Json;
        };
        Update: {
          content?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      tenant_role: "owner" | "admin" | "agent";
      message_sender: "human" | "lead" | "ai";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

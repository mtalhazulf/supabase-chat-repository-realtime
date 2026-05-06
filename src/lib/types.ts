export type MessageSender = "human" | "lead" | "ai";
export type TenantRole = "owner" | "admin" | "agent";

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  owner_id: string;
  created_at: string;
};

export type TenantMember = {
  tenant_id: string;
  user_id: string;
  role: TenantRole;
  created_at: string;
};

export type ChatbotConfig = {
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

export type Conversation = {
  id: string;
  tenant_id: string;
  visitor_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  status: "open" | "closed";
  last_message_at: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  tenant_id: string;
  sender: MessageSender;
  author_id: string | null;
  author_name: string | null;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

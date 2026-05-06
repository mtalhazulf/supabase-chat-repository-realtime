"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ChatbotConfig, Message, Tenant } from "@/lib/types";

// ---------- Query keys ----------
export const qk = {
  conversationMessages: (conversationId: string) => ["conversation", conversationId, "messages"] as const,
  tenantConfig: (tenantId: string) => ["tenant", tenantId, "config"] as const,
  tenant: (tenantId: string) => ["tenant", tenantId] as const,
};

// ---------- Tenants ----------
export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; slug: string }) =>
      api<{ tenant: Tenant }>("/api/tenants", { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants"] }),
  });
}

export function useUpdateTenant(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string; slug?: string }) =>
      api<{ tenant: Tenant }>(`/api/tenants/${tenantId}`, { method: "PATCH", body: input }),
    onSuccess: ({ tenant }) => {
      qc.setQueryData(qk.tenant(tenantId), tenant);
      qc.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

export function useDeleteTenant(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ ok: true }>(`/api/tenants/${tenantId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.removeQueries({ queryKey: qk.tenant(tenantId) });
      qc.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

// ---------- Chatbot config ----------
export function useUpdateConfig(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ChatbotConfig>) =>
      api<{ config: ChatbotConfig }>(`/api/tenants/${tenantId}/config`, {
        method: "PATCH",
        body: patch,
      }),
    onSuccess: ({ config }) => qc.setQueryData(qk.tenantConfig(tenantId), config),
  });
}

// ---------- Messages: agent send ----------
export function useAgentSend(opts: { conversationId: string; tenantId: string }) {
  return useMutation({
    mutationFn: (content: string) =>
      api<{ message: Message }>("/api/agent/send", {
        method: "POST",
        body: { conversationId: opts.conversationId, tenantId: opts.tenantId, content },
      }),
  });
}

// ---------- Messages: visitor (widget) ----------
export function useWidgetMessages(
  conversationId: string | null,
  options?: Pick<UseQueryOptions<{ messages: Message[] }>, "initialData">,
) {
  return useQuery({
    queryKey: conversationId ? qk.conversationMessages(conversationId) : ["conversation", "none"],
    enabled: !!conversationId,
    queryFn: ({ signal }) =>
      api<{ messages: Message[] }>(`/api/widget/messages?conversationId=${conversationId}`, { signal }),
    initialData: options?.initialData,
  });
}

export function useWidgetSend() {
  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      visitorId: string;
      conversationId: string | null;
      content: string;
      lead?: { name?: string; email?: string; phone?: string };
    }) => api<{ conversationId: string; message: Message }>("/api/widget/send", { method: "POST", body: input }),
  });
}

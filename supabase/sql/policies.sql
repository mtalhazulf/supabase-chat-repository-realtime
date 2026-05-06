-- =========================================================
-- Supabase-specific layer that Prisma doesn't manage:
--   - foreign keys to auth.users
--   - helper functions (security definer)
--   - row level security policies
--   - triggers (touch conversation, bootstrap tenant)
--   - realtime publication
--
-- Apply with:  bun run db:policies
-- Idempotent: safe to re-run after schema changes.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- FKs to auth.users (Prisma cannot reference auth schema) ----------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tenants_owner_id_fkey'
  ) then
    alter table public.tenants
      add constraint tenants_owner_id_fkey
      foreign key (owner_id) references auth.users (id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'tenant_members_user_id_fkey'
  ) then
    alter table public.tenant_members
      add constraint tenant_members_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'messages_author_id_fkey'
  ) then
    alter table public.messages
      add constraint messages_author_id_fkey
      foreign key (author_id) references auth.users (id) on delete set null;
  end if;
end $$;

-- ---------- check constraints ----------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tenants_slug_check') then
    alter table public.tenants add constraint tenants_slug_check check (slug ~ '^[a-z0-9-]{2,40}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'configs_position_check') then
    alter table public.chatbot_configs add constraint configs_position_check check (position in ('left','right'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'conversations_status_check') then
    alter table public.conversations add constraint conversations_status_check check (status in ('open','closed'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'messages_content_len_check') then
    alter table public.messages add constraint messages_content_len_check check (length(content) between 1 and 8000);
  end if;
end $$;

-- ---------- helper functions ----------
create or replace function public.is_tenant_member(p_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = p_tenant and user_id = auth.uid()
  );
$$;

create or replace function public.is_tenant_admin(p_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = p_tenant
      and user_id = auth.uid()
      and role in ('owner','admin')
  );
$$;

-- ---------- triggers ----------
create or replace function public.touch_conversation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
after insert on public.messages
for each row execute function public.touch_conversation();

create or replace function public.bootstrap_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tenant_members (tenant_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;

  insert into public.chatbot_configs (tenant_id)
  values (new.id)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists tenants_bootstrap on public.tenants;
create trigger tenants_bootstrap
after insert on public.tenants
for each row execute function public.bootstrap_tenant();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table public.tenants          enable row level security;
alter table public.tenant_members   enable row level security;
alter table public.chatbot_configs  enable row level security;
alter table public.conversations    enable row level security;
alter table public.messages         enable row level security;

-- Tenants
drop policy if exists tenants_select on public.tenants;
create policy tenants_select on public.tenants
  for select using (public.is_tenant_member(id));

drop policy if exists tenants_insert on public.tenants;
create policy tenants_insert on public.tenants
  for insert with check (auth.uid() = owner_id);

drop policy if exists tenants_update on public.tenants;
create policy tenants_update on public.tenants
  for update using (owner_id = auth.uid());

drop policy if exists tenants_delete on public.tenants;
create policy tenants_delete on public.tenants
  for delete using (owner_id = auth.uid());

-- Members
drop policy if exists members_select on public.tenant_members;
create policy members_select on public.tenant_members
  for select using (public.is_tenant_member(tenant_id));

drop policy if exists members_insert on public.tenant_members;
create policy members_insert on public.tenant_members
  for insert with check (public.is_tenant_admin(tenant_id));

drop policy if exists members_update on public.tenant_members;
create policy members_update on public.tenant_members
  for update using (public.is_tenant_admin(tenant_id));

drop policy if exists members_delete on public.tenant_members;
create policy members_delete on public.tenant_members
  for delete using (public.is_tenant_admin(tenant_id));

-- Configs (public read so widget on any site can pull branding via anon key)
drop policy if exists configs_select_public on public.chatbot_configs;
create policy configs_select_public on public.chatbot_configs
  for select using (true);

drop policy if exists configs_update on public.chatbot_configs;
create policy configs_update on public.chatbot_configs
  for update using (public.is_tenant_admin(tenant_id));

drop policy if exists configs_insert on public.chatbot_configs;
create policy configs_insert on public.chatbot_configs
  for insert with check (public.is_tenant_admin(tenant_id));

-- Conversations / Messages: members read everything for their tenant.
-- Visitors interact via service-role API (bypasses RLS).
drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations
  for select using (public.is_tenant_member(tenant_id));

drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations
  for insert with check (public.is_tenant_member(tenant_id));

drop policy if exists conversations_update on public.conversations;
create policy conversations_update on public.conversations
  for update using (public.is_tenant_member(tenant_id));

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select using (public.is_tenant_member(tenant_id));

drop policy if exists messages_insert_human on public.messages;
create policy messages_insert_human on public.messages
  for insert with check (
    public.is_tenant_member(tenant_id)
    and sender = 'human'
    and author_id = auth.uid()
  );

-- =========================================================
-- Lock down SECURITY DEFINER helpers — used by RLS only,
-- not intended as REST RPCs.
-- =========================================================
revoke execute on function public.is_tenant_member(uuid) from public, anon, authenticated;
revoke execute on function public.is_tenant_admin(uuid)  from public, anon, authenticated;
revoke execute on function public.bootstrap_tenant()     from public, anon, authenticated;
revoke execute on function public.touch_conversation()   from public, anon, authenticated;

-- =========================================================
-- REALTIME publication
-- =========================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end $$;

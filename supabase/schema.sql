-- =====================================================================
--  منصة الفرق المشاركة في المسابقات — أكاديمية سنابل التقنية
--  الصق هذا الملف كاملاً في: Supabase → SQL Editor → New query → Run
--  يمكن تشغيله أكثر من مرة دون مشاكل
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- الجداول ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  full_name text,
  role text not null default 'member' check (role in ('admin','member')),
  specialty text,
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  competition text,
  description text,
  start_date date,
  end_date date,
  color text default '#1f4d3a',
  created_at timestamptz default now()
);

create table if not exists public.project_members (
  project_id uuid references public.projects on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  role text not null default 'editor' check (role in ('manager','editor','viewer')),
  primary key (project_id, user_id)
);
-- (للتحديث من نسخة سابقة) إضافة دور «مدير المشروع»
alter table public.project_members drop constraint if exists project_members_role_check;
alter table public.project_members add constraint project_members_role_check check (role in ('manager','editor','viewer'));

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  title text not null,
  period text not null default 'month' check (period in ('month','quarter','half','year')),
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  goal_id uuid references public.goals on delete set null,
  title text not null,
  description text,
  type text default 'research' check (type in ('research','code','design','build','other')),
  status text default 'todo' check (status in ('todo','doing','review','done')),
  priority text default 'med' check (priority in ('low','med','high')),
  assignee uuid references public.profiles on delete set null,
  start_date date default current_date,
  due_date date,
  progress int default 0 check (progress between 0 and 100),
  score int check (score between 0 and 10),
  feedback text,
  completed_at timestamptz,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  task_id uuid not null references public.tasks on delete cascade,
  user_id uuid references public.profiles on delete set null,
  kind text not null check (kind in ('file','image','code','link','text')),
  title text,
  content text,
  language text,
  file_path text,
  created_at timestamptz default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  path text not null,
  language text default 'plaintext',
  content text default '',
  updated_by uuid references public.profiles on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (project_id, path)
);

create table if not exists public.file_versions (
  id bigserial primary key,
  project_id uuid not null references public.projects on delete cascade,
  file_id uuid references public.files on delete set null,
  path text,
  action text check (action in ('create','update','delete','rename','restore')),
  content text,
  user_id uuid references public.profiles on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.activity (
  id bigserial primary key,
  project_id uuid not null references public.projects on delete cascade,
  user_id uuid references public.profiles on delete set null,
  action text,
  details text,
  created_at timestamptz default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  kind text not null default 'note' check (kind in ('issue','note','announcement')),
  title text not null,
  body text,
  resolved boolean default false,
  user_id uuid references public.profiles on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.library (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  section text not null check (section in ('research','books','misc')),
  kind text not null default 'link' check (kind in ('link','file','image','model')),
  title text not null,
  url text,
  file_path text,
  tags text,
  notes text,
  user_id uuid references public.profiles on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.parts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  name text not null,
  url text,
  image_url text,
  image_path text,
  qty int default 1,
  price numeric,
  status text default 'needed' check (status in ('needed','ordered','received')),
  notes text,
  user_id uuid references public.profiles on delete set null,
  created_at timestamptz default now()
);

-- الرسائل والتعميمات
create table if not exists public.messages (
  id bigserial primary key,
  kind text not null default 'chat' check (kind in ('chat','announcement')),
  sender uuid references public.profiles on delete set null,
  recipient uuid references public.profiles on delete cascade,
  project_id uuid references public.projects on delete cascade,
  subject text,
  body text not null,
  created_at timestamptz default now()
);
create table if not exists public.message_reads (
  message_id bigint references public.messages on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  read_at timestamptz default now(),
  primary key (message_id, user_id)
);

-- دليل الأرقام المهمة (مجتمع المهتمين)
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  name text not null,
  title text,
  organization text,
  phone text,
  whatsapp text,
  telegram text,
  email text,
  links text,
  tags text,
  notes text,
  user_id uuid references public.profiles on delete set null,
  created_at timestamptz default now()
);

create index if not exists messages_recipient_idx on public.messages(recipient);
create index if not exists tasks_project_idx on public.tasks(project_id);
create index if not exists files_project_idx on public.files(project_id);
create index if not exists versions_file_idx on public.file_versions(file_id);
create index if not exists activity_project_idx on public.activity(project_id, created_at desc);

-- صلاحيات الوصول عبر الـ API (الحماية الفعلية تتم بسياسات RLS بالأسفل)
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on all tables in schema public from anon;

-- ---------- دوال الصلاحيات ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_member(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from project_members where project_id = p and user_id = auth.uid());
$$;

create or replace function public.can_edit(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from project_members where project_id = p and user_id = auth.uid() and role in ('editor','manager'));
$$;

create or replace function public.is_manager(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from project_members where project_id = p and user_id = auth.uid() and role = 'manager');
$$;

-- هل يجوز لي مراسلة هذا الشخص؟ (المدير، أو زميل في نفس المشروع)
create or replace function public.can_message(u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin()
    or exists (select 1 from profiles where id = u and role = 'admin')
    or exists (select 1 from project_members a join project_members b on a.project_id = b.project_id
               where a.user_id = auth.uid() and b.user_id = u);
$$;

-- إنشاء ملف تعريفي تلقائياً لكل مستخدم جديد
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name)
  values (new.id, split_part(new.email, '@', 1),
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- سياسات الأمان (كل فريق يرى مشروعه فقط) ----------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_admin on public.profiles;
create policy profiles_admin on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects for select to authenticated using (public.is_member(id));
drop policy if exists projects_admin on public.projects;
create policy projects_admin on public.projects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists pm_read on public.project_members;
create policy pm_read on public.project_members for select to authenticated
  using (user_id = auth.uid() or public.is_member(project_id));
drop policy if exists pm_admin on public.project_members;
create policy pm_admin on public.project_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

do $$
declare t text;
begin
  foreach t in array array['goals','tasks','submissions','files','file_versions','activity','notes','library','parts','contacts'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_member(project_id))', t || '_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_write', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.can_edit(project_id)) with check (public.can_edit(project_id))', t || '_write', t);
  end loop;
end $$;

-- التعميمات يكتبها المدير فقط
drop policy if exists notes_write on public.notes;
create policy notes_write on public.notes for all to authenticated
  using (public.can_edit(project_id) and (kind <> 'announcement' or public.is_admin()))
  with check (public.can_edit(project_id) and (kind <> 'announcement' or public.is_admin()));

-- المهام: العضو يضيف ويعدّل مهامه فقط، ومدير المشروع (والمدير العام) يدير مهام الجميع
drop policy if exists tasks_write on public.tasks;
create policy tasks_write on public.tasks for all to authenticated
  using (public.is_manager(project_id) or (public.can_edit(project_id) and (assignee = auth.uid() or created_by = auth.uid())))
  with check (public.is_manager(project_id) or (public.can_edit(project_id) and assignee = auth.uid()));

-- الرسائل
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;
drop policy if exists msg_read on public.messages;
create policy msg_read on public.messages for select to authenticated using (
  sender = auth.uid() or recipient = auth.uid() or public.is_admin()
  or (kind = 'announcement' and (project_id is null or public.is_member(project_id))));
drop policy if exists msg_insert on public.messages;
create policy msg_insert on public.messages for insert to authenticated with check (
  sender = auth.uid() and (
    (kind = 'chat' and recipient is not null and public.can_message(recipient))
    or (kind = 'announcement' and public.is_admin())));
drop policy if exists msg_delete on public.messages;
create policy msg_delete on public.messages for delete to authenticated using (public.is_admin() or sender = auth.uid());
drop policy if exists reads_read on public.message_reads;
create policy reads_read on public.message_reads for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists reads_write on public.message_reads;
create policy reads_write on public.message_reads for insert to authenticated with check (user_id = auth.uid());

-- ---------- تخزين الملفات ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('team-files', 'team-files', false, 52428800)
on conflict (id) do nothing;

drop policy if exists tf_read on storage.objects;
create policy tf_read on storage.objects for select to authenticated
  using (bucket_id = 'team-files' and public.is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists tf_insert on storage.objects;
create policy tf_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'team-files' and public.can_edit(((storage.foldername(name))[1])::uuid));
drop policy if exists tf_delete on storage.objects;
create policy tf_delete on storage.objects for delete to authenticated
  using (bucket_id = 'team-files' and public.can_edit(((storage.foldername(name))[1])::uuid));

-- ---------- التحديث اللحظي ----------
do $$
declare t text;
begin
  foreach t in array array['notes','activity','tasks','messages'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when others then null;
    end;
  end loop;
end $$;

-- =====================================================================
-- بعد إنشاء حساب المدير من Authentication → Users (البريد admin@sanabel.team)
-- شغّل السطر التالي مرة واحدة لتصبح مديراً:
--   update public.profiles set role = 'admin', full_name = 'م. أسامة الصلخدي' where username = 'admin';
-- =====================================================================

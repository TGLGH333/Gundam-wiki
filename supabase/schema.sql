create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('user', 'admin');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text,
  display_name text,
  role public.user_role not null default 'user',
  account_status text not null default 'active' check (account_status in ('active','suspended')),
  contribution_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()

);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists account_status text not null default 'active';
do $$ begin
  alter table public.profiles add constraint profiles_account_status_check check (account_status in ('active','suspended'));
exception
  when duplicate_object then null;
end $$;
update public.profiles set username = 'user_' || left(replace(id::text, '-', ''), 8) where username is null or username = '';
create unique index if not exists profiles_username_unique on public.profiles (lower(username));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  desired_username text;
begin
  desired_username := coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), 'user_' || left(replace(new.id::text, '-', ''), 8));
  if char_length(desired_username) < 2 or char_length(desired_username) > 24 or desired_username ~ '\s' then
    raise exception 'INVALID_USERNAME';
  end if;
  if exists(select 1 from public.profiles where lower(username) = lower(desired_username)) then
    raise exception 'USERNAME_TAKEN';
  end if;
  insert into public.profiles (id, email, username, display_name, role, account_status)
  values (new.id, coalesce(new.email, ''), desired_username, desired_username, 'user', 'active')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id, email, username, display_name)
select id, coalesce(email, ''), 'user_' || left(replace(id::text, '-', ''), 8), split_part(coalesce(email, 'user'), '@', 1)
from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));


create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles" on public.profiles for select to authenticated using ((select public.is_admin()));

create or replace function public.is_username_available(candidate text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select char_length(trim(candidate)) between 2 and 24
    and trim(candidate) !~ '\s'
    and not exists(select 1 from public.profiles where lower(username) = lower(trim(candidate)));
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;

create or replace function public.change_username(new_username text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  normalized text := trim(new_username);
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if char_length(normalized) < 2 or char_length(normalized) > 24 or normalized ~ '\s' then raise exception 'INVALID_USERNAME'; end if;
  if exists(select 1 from public.profiles where lower(username) = lower(normalized) and id <> current_user_id) then raise exception 'USERNAME_TAKEN'; end if;
  update public.profiles set username = normalized, display_name = normalized, updated_at = now() where id = current_user_id;
  update public.community_comments set author = normalized where user_id = current_user_id::text;
  return normalized;
end;
$$;

grant execute on function public.change_username(text) to authenticated;

create or replace function public.admin_update_user(target_user_id uuid, new_role public.user_role, new_status text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  if new_status not in ('active','suspended') then raise exception 'INVALID_STATUS'; end if;
  update public.profiles set role = new_role, account_status = new_status, updated_at = now() where id = target_user_id;
  return found;
end;
$$;

grant execute on function public.admin_update_user(uuid, public.user_role, text) to authenticated;

create or replace function public.admin_delete_user(target_user_id uuid)
returns boolean
language plpgsql
security definer set search_path = public, auth
as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  if target_user_id = auth.uid() then raise exception 'CANNOT_DELETE_SELF'; end if;
  delete from auth.users where id = target_user_id;
  return found;
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;

create table if not exists public.wiki_pages (
  id bigint primary key,
  title text not null unique,
  slug text not null unique,
  category text not null,
  summary text not null default '',
  content text not null default '',
  tags jsonb not null default '[]'::jsonb,
  kit text,
  grade text,
  scale text,
  release text,
  price text,
  views integer not null default 0,
  likes integer not null default 0,
  status text not null default 'published' check (status in ('published','pending','locked')),
  revision integer not null default 1,
  updated_at date not null default current_date
);

create table if not exists public.wiki_revisions (
  id bigint primary key,
  page_id bigint not null references public.wiki_pages(id) on delete cascade,
  revision integer not null,
  content text not null,
  summary text not null,
  editor text not null,
  status text not null default 'pending' check (status in ('approved','pending','rejected')),
  created_at date not null default current_date,
  unique(page_id, revision)
);

create table if not exists public.works (
  id bigint primary key,
  title text not null,
  kit text not null default '',
  description text not null default '',
  tags jsonb not null default '[]'::jsonb,
  author text not null,
  likes integer not null default 0,
  comments integer not null default 0,
  color text not null default 'from-blue-700 to-indigo-400',
  image_url text,
  created_at text not null
);

create table if not exists public.forum_posts (
  id bigint primary key,
  board text not null,
  title text not null,
  content text not null,
  tags jsonb not null default '[]'::jsonb,
  author text not null,
  replies integer not null default 0,
  likes integer not null default 0,
  pinned boolean not null default false,
  featured boolean not null default false,
  created_at text not null
);

create table if not exists public.tools (
  id bigint primary key,
  name text not null unique,
  brand text not null,
  category text not null,
  price text not null,
  rating numeric(2,1) not null default 0,
  reviews integer not null default 0,
  specs jsonb not null default '[]'::jsonb,
  pros jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb
);

alter table public.forum_posts add column if not exists tags jsonb not null default '[]'::jsonb;
alter table public.tools add column if not exists tags jsonb not null default '[]'::jsonb;
alter table public.wiki_pages add column if not exists image_url text;
alter table public.wiki_revisions add column if not exists image_url text;

create table if not exists public.community_comments (
  id bigint primary key,
  target_type text not null check (target_type in ('post','work','tool')),
  target_id bigint not null,
  author text not null,
  user_id text not null,
  content text not null,
  rating integer check (rating between 1 and 5),
  created_at text not null
);

create table if not exists public.community_likes (
  id text primary key,
  target_type text not null check (target_type in ('post','work')),
  target_id bigint not null,
  user_id text not null,
  unique(target_type, target_id, user_id)
);

alter table public.wiki_pages enable row level security;
alter table public.wiki_revisions enable row level security;
alter table public.works enable row level security;
alter table public.forum_posts enable row level security;
alter table public.tools enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_likes enable row level security;

drop policy if exists "public read wiki" on public.wiki_pages;
create policy "public read wiki" on public.wiki_pages for select using (true);
drop policy if exists "authenticated write wiki" on public.wiki_pages;
drop policy if exists "admin manage wiki" on public.wiki_pages;
create policy "admin manage wiki" on public.wiki_pages for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "public read revisions" on public.wiki_revisions;
create policy "public read revisions" on public.wiki_revisions for select using (true);
drop policy if exists "authenticated write revisions" on public.wiki_revisions;
drop policy if exists "authenticated insert revisions" on public.wiki_revisions;
create policy "authenticated insert revisions" on public.wiki_revisions for insert to authenticated with check (true);
drop policy if exists "authenticated update revisions" on public.wiki_revisions;
create policy "authenticated update revisions" on public.wiki_revisions for update to authenticated using (true) with check (true);
drop policy if exists "admin delete revisions" on public.wiki_revisions;
create policy "admin delete revisions" on public.wiki_revisions for delete to authenticated using ((select public.is_admin()));

drop policy if exists "public read works" on public.works;
create policy "public read works" on public.works for select using (true);
drop policy if exists "authenticated write works" on public.works;
drop policy if exists "authenticated insert works" on public.works;
create policy "authenticated insert works" on public.works for insert to authenticated with check (true);
drop policy if exists "authenticated update works" on public.works;
create policy "authenticated update works" on public.works for update to authenticated using (true) with check (true);
drop policy if exists "admin delete works" on public.works;
create policy "admin delete works" on public.works for delete to authenticated using ((select public.is_admin()));

drop policy if exists "public read posts" on public.forum_posts;
create policy "public read posts" on public.forum_posts for select using (true);
drop policy if exists "authenticated write posts" on public.forum_posts;
drop policy if exists "authenticated insert posts" on public.forum_posts;
create policy "authenticated insert posts" on public.forum_posts for insert to authenticated with check (true);
drop policy if exists "authenticated update posts" on public.forum_posts;
create policy "authenticated update posts" on public.forum_posts for update to authenticated using (true) with check (true);
drop policy if exists "admin delete posts" on public.forum_posts;
create policy "admin delete posts" on public.forum_posts for delete to authenticated using ((select public.is_admin()));

drop policy if exists "public read tools" on public.tools;
create policy "public read tools" on public.tools for select using (true);
drop policy if exists "authenticated write tools" on public.tools;
drop policy if exists "admin insert tools" on public.tools;
create policy "admin insert tools" on public.tools for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "authenticated update tools" on public.tools;
create policy "authenticated update tools" on public.tools for update to authenticated using (true) with check (true);
drop policy if exists "admin delete tools" on public.tools;
create policy "admin delete tools" on public.tools for delete to authenticated using ((select public.is_admin()));

drop policy if exists "public read comments" on public.community_comments;
create policy "public read comments" on public.community_comments for select using (true);
drop policy if exists "authenticated write comments" on public.community_comments;
drop policy if exists "users insert comments" on public.community_comments;
create policy "users insert comments" on public.community_comments for insert to authenticated with check (user_id = (select auth.uid())::text);
drop policy if exists "users update own comments" on public.community_comments;
create policy "users update own comments" on public.community_comments for update to authenticated using (user_id = (select auth.uid())::text) with check (user_id = (select auth.uid())::text);
drop policy if exists "admin delete comments" on public.community_comments;
create policy "admin delete comments" on public.community_comments for delete to authenticated using ((select public.is_admin()));

drop policy if exists "public read likes" on public.community_likes;
create policy "public read likes" on public.community_likes for select using (true);
drop policy if exists "authenticated write likes" on public.community_likes;
drop policy if exists "users insert likes" on public.community_likes;
create policy "users insert likes" on public.community_likes for insert to authenticated with check (user_id = (select auth.uid())::text);
drop policy if exists "users update own likes" on public.community_likes;
create policy "users update own likes" on public.community_likes for update to authenticated using (user_id = (select auth.uid())::text) with check (user_id = (select auth.uid())::text);
drop policy if exists "users delete own likes" on public.community_likes;
create policy "users delete own likes" on public.community_likes for delete to authenticated using (user_id = (select auth.uid())::text or (select public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('works', 'works', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public view work images" on storage.objects;
create policy "public view work images" on storage.objects for select using (bucket_id = 'works');
drop policy if exists "authenticated upload work images" on storage.objects;
create policy "authenticated upload work images" on storage.objects for insert to authenticated with check (bucket_id = 'works');
drop policy if exists "owners update work images" on storage.objects;
create policy "owners update work images" on storage.objects for update to authenticated using (bucket_id = 'works' and owner_id = (select auth.uid())::text) with check (bucket_id = 'works');
drop policy if exists "owners delete work images" on storage.objects;
create policy "owners delete work images" on storage.objects for delete to authenticated using (bucket_id = 'works' and owner_id = (select auth.uid())::text);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wiki-images', 'wiki-images', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public view wiki images" on storage.objects;
create policy "public view wiki images" on storage.objects for select using (bucket_id = 'wiki-images');
drop policy if exists "authenticated upload wiki images" on storage.objects;
create policy "authenticated upload wiki images" on storage.objects for insert to authenticated with check (bucket_id = 'wiki-images');
drop policy if exists "owners update wiki images" on storage.objects;
create policy "owners update wiki images" on storage.objects for update to authenticated using (bucket_id = 'wiki-images' and owner_id = (select auth.uid())::text) with check (bucket_id = 'wiki-images');
drop policy if exists "owners delete wiki images" on storage.objects;
create policy "owners delete wiki images" on storage.objects for delete to authenticated using (bucket_id = 'wiki-images' and owner_id = (select auth.uid())::text);

insert into public.wiki_pages (id,title,slug,category,summary,content,tags,kit,grade,scale,release,price,views,likes,status,revision,updated_at) values
(1,'RG 元祖高达 Ver.2.0','rg-rx78-2-ver2','模型图鉴','RG系列15周年纪念作品，采用全新进阶MS关节。','## 套件概览\nRG 元祖高达 Ver.2.0 是面向进阶玩家与素组玩家都很友好的套件。','["素组友好","RG","元祖","2024新品"]','RX-78-2 Gundam','RG','1/144','2024','3,500日元',24820,913,'published',3,'2026-07-09'),
(2,'新手素组全流程','basic-assembly-guide','入门指南','从开盒检查到消光的第一只高达完整路线。','## 准备工具\n剪钳、笔刀、镊子、打磨棒与收纳盒。','["新手友好","素组","水口处理"]',null,null,null,null,null,16500,621,'published',2,'2026-07-08')
on conflict (id) do nothing;

insert into public.tools (id,name,brand,category,price,rating,reviews,specs,pros) values
(1,'SPN-120 单刃剪钳','神之手','剪钳/水口钳','¥320-420',4.8,126,'["单刃","适合精修","需注意维护"]','["水口白痕少","手感细腻","适合二段剪"]'),
(2,'田宫 74035 精密剪钳','田宫','剪钳/水口钳','¥130-180',4.5,89,'["双刃","耐用","入门友好"]','["耐用度高","维护简单","泛用性强"]')
on conflict (id) do nothing;

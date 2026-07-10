create extension if not exists pgcrypto;

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
  pros jsonb not null default '[]'::jsonb
);

alter table public.wiki_pages enable row level security;
alter table public.wiki_revisions enable row level security;
alter table public.works enable row level security;
alter table public.forum_posts enable row level security;
alter table public.tools enable row level security;

drop policy if exists "public read wiki" on public.wiki_pages;
create policy "public read wiki" on public.wiki_pages for select using (true);
drop policy if exists "authenticated write wiki" on public.wiki_pages;
create policy "authenticated write wiki" on public.wiki_pages for all to authenticated using (true) with check (true);

drop policy if exists "public read revisions" on public.wiki_revisions;
create policy "public read revisions" on public.wiki_revisions for select using (true);
drop policy if exists "authenticated write revisions" on public.wiki_revisions;
create policy "authenticated write revisions" on public.wiki_revisions for all to authenticated using (true) with check (true);

drop policy if exists "public read works" on public.works;
create policy "public read works" on public.works for select using (true);
drop policy if exists "authenticated write works" on public.works;
create policy "authenticated write works" on public.works for all to authenticated using (true) with check (true);

drop policy if exists "public read posts" on public.forum_posts;
create policy "public read posts" on public.forum_posts for select using (true);
drop policy if exists "authenticated write posts" on public.forum_posts;
create policy "authenticated write posts" on public.forum_posts for all to authenticated using (true) with check (true);

drop policy if exists "public read tools" on public.tools;
create policy "public read tools" on public.tools for select using (true);
drop policy if exists "authenticated write tools" on public.tools;
create policy "authenticated write tools" on public.tools for all to authenticated using (true) with check (true);

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

insert into public.wiki_pages (id,title,slug,category,summary,content,tags,kit,grade,scale,release,price,views,likes,status,revision,updated_at) values
(1,'RG 元祖高达 Ver.2.0','rg-rx78-2-ver2','模型图鉴','RG系列15周年纪念作品，采用全新进阶MS关节。','## 套件概览\nRG 元祖高达 Ver.2.0 是面向进阶玩家与素组玩家都很友好的套件。','["素组友好","RG","元祖","2024新品"]','RX-78-2 Gundam','RG','1/144','2024','3,500日元',24820,913,'published',3,'2026-07-09'),
(2,'新手素组全流程','basic-assembly-guide','入门指南','从开盒检查到消光的第一只高达完整路线。','## 准备工具\n剪钳、笔刀、镊子、打磨棒与收纳盒。','["新手友好","素组","水口处理"]',null,null,null,null,null,16500,621,'published',2,'2026-07-08')
on conflict (id) do nothing;

insert into public.tools (id,name,brand,category,price,rating,reviews,specs,pros) values
(1,'SPN-120 单刃剪钳','神之手','剪钳/水口钳','¥320-420',4.8,126,'["单刃","适合精修","需注意维护"]','["水口白痕少","手感细腻","适合二段剪"]'),
(2,'田宫 74035 精密剪钳','田宫','剪钳/水口钳','¥130-180',4.5,89,'["双刃","耐用","入门友好"]','["耐用度高","维护简单","泛用性强"]')
on conflict (id) do nothing;

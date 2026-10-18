-- Run in Supabase Dashboard > SQL Editor. Tables store portfolio content.
create extension if not exists pgcrypto;

create table if not exists public."Profile" (
  id text primary key default 'main', name text not null default 'Nama Kamu', role text not null default '', headline text not null default '', bio text not null default '', location text not null default 'Indonesia', email text not null default '', whatsapp text not null default '', availability text not null default '', "yearsExperience" integer not null default 0, "projectsCompleted" integer not null default 0, "clientsSatisfied" integer not null default 0, "avatarUrl" text not null default '', "resumeUrl" text not null default '', "githubUrl" text not null default '', "linkedinUrl" text not null default '', "instagramUrl" text not null default '', "updatedAt" timestamptz not null default now()
);
create table if not exists public."Service" (id text primary key default gen_random_uuid()::text, title text not null, description text not null, icon text not null default 'code', "priceLabel" text not null default 'Diskusikan kebutuhan', features jsonb not null default '[]'::jsonb, "sortOrder" integer not null default 0, "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now());
create table if not exists public."Project" (id text primary key default gen_random_uuid()::text, title text not null, category text not null, description text not null, "imageUrl" text not null default '', "demoUrl" text not null default '', "repoUrl" text not null default '', tags jsonb not null default '[]'::jsonb, "coverStyle" text not null default 'violet', featured boolean not null default false, "sortOrder" integer not null default 0, "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now());
create table if not exists public."Testimonial" (id text primary key default gen_random_uuid()::text, name text not null, role text not null, company text not null default '', content text not null, "avatarUrl" text not null default '', rating integer not null default 5 check (rating between 1 and 5), "sortOrder" integer not null default 0, "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now());
create table if not exists public."Message" (id text primary key default gen_random_uuid()::text, name text not null, email text not null, service text not null default '', message text not null, read boolean not null default false, "createdAt" timestamptz not null default now());

alter table public."Profile" enable row level security;
alter table public."Service" enable row level security;
alter table public."Project" enable row level security;
alter table public."Testimonial" enable row level security;
alter table public."Message" enable row level security;

-- Public visitors may read portfolio content, but never messages. Writes are server-side only.
drop policy if exists "public read profile" on public."Profile"; create policy "public read profile" on public."Profile" for select to anon, authenticated using (true);
drop policy if exists "public read services" on public."Service"; create policy "public read services" on public."Service" for select to anon, authenticated using (true);
drop policy if exists "public read projects" on public."Project"; create policy "public read projects" on public."Project" for select to anon, authenticated using (true);
drop policy if exists "public read testimonials" on public."Testimonial"; create policy "public read testimonials" on public."Testimonial" for select to anon, authenticated using (true);
revoke all on public."Profile", public."Service", public."Project", public."Testimonial", public."Message" from anon, authenticated;
grant select on public."Profile", public."Service", public."Project", public."Testimonial" to anon, authenticated;

-- Public Storage bucket for portfolio images. Uploads are performed by authenticated server routes using the service role key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('portfolio-media', 'portfolio-media', true, 10485760, array['image/jpeg','image/png','image/webp']) on conflict (id) do update set public = true, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

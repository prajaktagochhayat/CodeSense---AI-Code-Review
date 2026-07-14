-- Profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  avatar_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Projects table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_name text not null,
  language text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Reviews table (extended with code and file_name)
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  review_type text not null check (review_type in ('static', 'ai', 'combined')),
  overall_score integer check (overall_score >= 0 and overall_score <= 100),
  summary text,
  code text not null,
  file_name text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Review findings table
create table if not exists public.review_findings (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references public.reviews(id) on delete cascade not null,
  severity text not null check (severity in ('critical', 'warning', 'minor', 'info')),
  issue text not null,
  explanation text not null,
  suggested_fix text,
  file_name text,
  line_number integer
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.reviews enable row level security;
alter table public.review_findings enable row level security;

-- RLS Policies
create policy "Users can view their own profiles"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profiles"
  on public.profiles for update
  using (auth.uid() = id);

-- Projects Policies
create policy "Users can view their own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Reviews Policies (Joined via projects)
create policy "Users can view reviews of their projects"
  on public.reviews for select
  using (exists (
    select 1 from public.projects
    where public.projects.id = public.reviews.project_id
    and public.projects.user_id = auth.uid()
  ));

create policy "Users can insert reviews for their projects"
  on public.reviews for insert
  with check (exists (
    select 1 from public.projects
    where public.projects.id = public.reviews.project_id
    and public.projects.user_id = auth.uid()
  ));

create policy "Users can delete reviews of their projects"
  on public.reviews for delete
  using (exists (
    select 1 from public.projects
    where public.projects.id = public.reviews.project_id
    and public.projects.user_id = auth.uid()
  ));

-- Review Findings Policies (Joined via reviews -> projects)
create policy "Users can view findings of their reviews"
  on public.review_findings for select
  using (exists (
    select 1 from public.reviews
    join public.projects on public.projects.id = public.reviews.project_id
    where public.reviews.id = public.review_findings.review_id
    and public.projects.user_id = auth.uid()
  ));

create policy "Users can insert findings for their reviews"
  on public.review_findings for insert
  with check (exists (
    select 1 from public.reviews
    join public.projects on public.projects.id = public.reviews.project_id
    where public.reviews.id = public.review_findings.review_id
    and public.projects.user_id = auth.uid()
  ));

-- Day 10: DB Schema documented cleanly

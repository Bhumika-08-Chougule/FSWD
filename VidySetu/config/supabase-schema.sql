-- ============================================================
-- SmartEdu Supabase Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ulknyrfeqmyjgoumplrk/sql
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  password text not null,
  role text not null default 'student' check (role in ('student', 'teacher')),
  avatar text default '',
  enrolled_courses uuid[] default '{}',
  learning_stats jsonb default '{
    "hoursSpent": 0,
    "completedCourses": [],
    "weeklyActivity": [
      {"day": "Mon", "hours": 0},
      {"day": "Tue", "hours": 0},
      {"day": "Wed", "hours": 0},
      {"day": "Thu", "hours": 0},
      {"day": "Fri", "hours": 0},
      {"day": "Sat", "hours": 0},
      {"day": "Sun", "hours": 0}
    ]
  }'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- COURSES TABLE
-- ============================================================
create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  category text not null check (category in (
    'Web Development',
    'Artificial Intelligence',
    'Cloud Computing',
    'Cyber Security',
    'Data Science',
    'Mobile Development'
  )),
  price numeric(10,2) not null default 0,
  thumbnail_url text not null,
  content_url text default 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  difficulty text not null default 'Beginner' check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  tags text[] default '{}',
  teacher_id uuid references public.users(id) on delete cascade,
  teacher_name text not null,
  rating numeric(3,2) default 4.8,
  num_reviews integer default 0,
  students_enrolled integer default 0,
  duration_hours numeric(5,1) default 12,
  lessons_count integer default 24,
  syllabus jsonb default '[]'::jsonb,
  features text[] default '{"Full Lifetime Access","Hands-on Projects","Certificate of Completion"}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ORDERS TABLE
-- ============================================================
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  courses jsonb not null default '[]'::jsonb,
  total_amount numeric(10,2) not null,
  payment_method text default 'card',
  payment_status text default 'completed' check (payment_status in ('pending', 'completed', 'failed')),
  promo_code text default null,
  discount numeric(10,2) default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- REVIEWS TABLE
-- ============================================================
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  user_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_courses_category on public.courses(category);
create index if not exists idx_courses_teacher on public.courses(teacher_id);
create index if not exists idx_reviews_course on public.reviews(course_id);
create index if not exists idx_orders_user on public.orders(user_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger on_users_updated
  before update on public.users
  for each row execute procedure public.handle_updated_at();

create or replace trigger on_courses_updated
  before update on public.courses
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Disable RLS — backend uses service-role secret key which bypasses RLS.
-- Enable RLS only if you use anon/publishable key on the client side.
alter table public.users disable row level security;
alter table public.courses disable row level security;
alter table public.orders disable row level security;
alter table public.reviews disable row level security;

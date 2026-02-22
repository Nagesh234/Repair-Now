-- Migration: 01_categories_and_workflow.sql
-- Run this in your Supabase SQL Editor to apply Pillars 1, 2 & 3 database changes.

-- 1. Create Categories Table (Pillar 1)
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  inspection_fee decimal(10,2) not null default 0.00,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.categories enable row level security;
create policy "Public categories are viewable by everyone." on categories for select using ( true );

-- Insert default Seed Data
insert into public.categories (name, inspection_fee, image_url) values
  ('AC Repair', 299.00, 'https://cdn-icons-png.flaticon.com/512/911/911409.png'),
  ('Washing Machine Repair', 199.00, 'https://cdn-icons-png.flaticon.com/512/3003/3003984.png'),
  ('Refrigerator Repair', 249.00, 'https://cdn-icons-png.flaticon.com/512/468/468388.png')
on conflict do nothing;

-- 2. Update Repairs Table (Pillar 1 & 2)
alter table public.repairs add column category_id uuid references public.categories(id);
-- Assuming it's safe to drop the old category text column in dev
alter table public.repairs drop column if exists category;

alter table public.repairs add column estimated_cost decimal(10,2);
alter table public.repairs add column final_cost decimal(10,2);

-- Update the status enum check constraint
alter table public.repairs drop constraint if exists repairs_status_check;
alter table public.repairs add constraint repairs_status_check 
  check (status in ('pending', 'accepted', 'en_route', 'diagnosing', 'estimate_provided', 'repairing', 'completed', 'cancelled'));

-- 3. Update Profiles Table (Pillar 3)
alter table public.profiles add column rating decimal(3,2) default 5.00;
alter table public.profiles add column total_jobs integer default 0;
alter table public.profiles add column kyc_status text check (kyc_status in ('pending', 'approved', 'rejected')) default 'pending';

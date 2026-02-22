-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users & Partners)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null,
  email text,
  full_name text,
  role text check (role in ('client', 'partner', 'admin')),
  avatar_url text,
  phone_number text,
  rating decimal(3,2) default 5.00,
  total_jobs integer default 0,
  kyc_status text check (kyc_status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

-- CATEGORIES (Master Data)
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  inspection_fee decimal(10,2) not null default 0.00,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- REPAIR REQUESTS
create table if not exists public.repairs (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.profiles(id) not null,
  partner_id uuid references public.profiles(id),
  title text not null,
  description text,
  category_id uuid references public.categories(id),
  status text check (status in ('pending', 'accepted', 'en_route', 'diagnosing', 'estimate_provided', 'repairing', 'completed', 'cancelled')),
  estimated_cost decimal(10, 2),
  final_cost decimal(10, 2),
  price decimal(10, 2),
  scheduled_for timestamp with time zone,
  address text,
  latitude double precision,
  longitude double precision,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- REPAIR PHOTOS (Before/After)
create table if not exists public.repair_photos (
  id uuid default uuid_generate_v4() primary key,
  repair_id uuid references public.repairs(id) on delete cascade not null,
  photo_url text not null,
  type text check (type in ('before', 'after', 'issue')),
  uploaded_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- PAYMENTS
create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  repair_id uuid references public.repairs(id) on delete cascade not null,
  amount decimal(10, 2) not null,
  status text check (status in ('pending', 'completed', 'failed', 'refunded')),
  provider text default 'razorpay',
  transaction_id text, -- e.g., razorpay_order_id
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- REVIEWS
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  repair_id uuid references public.repairs(id) on delete cascade not null,
  client_id uuid references public.profiles(id) not null,
  partner_id uuid references public.profiles(id) not null,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- TECHNICIAN VERIFICATIONS
create table if not exists public.technician_verifications (
  id uuid default uuid_generate_v4() primary key,
  partner_id uuid references public.profiles(id) on delete cascade not null,
  id_proof_url text,
  certificate_url text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  submitted_at timestamp with time zone default timezone('utc'::text, now()),
  reviewed_at timestamp with time zone,
  reviewer_id uuid references public.profiles(id)
);

-- PARTNER LOCATIONS (For matching)
create table if not exists public.partner_locations (
  id uuid default uuid_generate_v4() primary key,
  partner_id uuid references public.profiles(id) on delete cascade not null,
  latitude double precision not null,
  longitude double precision not null,
  last_updated timestamp with time zone default timezone('utc'::text, now())
);

-- NOTIFICATIONS
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  type text, -- e.g., 'repair_update', 'payment', 'system'
  related_entity_id uuid, -- e.g., repair_id
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS POLICIES
alter table public.profiles enable row level security;
alter table public.repairs enable row level security;
alter table public.repair_photos enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.technician_verifications enable row level security;
alter table public.partner_locations enable row level security;
alter table public.notifications enable row level security;

-- PROFILES
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- CATEGORIES
alter table public.categories enable row level security;
drop policy if exists "Public categories are viewable by everyone." on categories;
create policy "Public categories are viewable by everyone." on categories for select using ( true );

-- REPAIRS
-- Clients see their own repairs
drop policy if exists "Clients see own repairs" on repairs;
create policy "Clients see own repairs" on repairs for select using ( auth.uid() = client_id );
drop policy if exists "Clients create repairs" on repairs;
create policy "Clients create repairs" on repairs for insert with check ( auth.uid() = client_id );
-- Partners need to see available repairs (e.g., status 'pending' and nearby - specialized query or see all pending)
-- For simplicity, partners can see assigned repairs or pending repairs
drop policy if exists "Partners see assigned repairs" on repairs;
create policy "Partners see assigned repairs" on repairs for select using ( auth.uid() = partner_id );
drop policy if exists "Partners see pending repairs" on repairs;
create policy "Partners see pending repairs" on repairs for select using ( status = 'pending' ); -- Needs refinement for location masking

-- REPAIR PHOTOS
drop policy if exists "View photos for related repairs" on repair_photos;
create policy "View photos for related repairs" on repair_photos for select using (
  exists (select 1 from repairs where repairs.id = repair_photos.repair_id and (repairs.client_id = auth.uid() or repairs.partner_id = auth.uid()))
);
drop policy if exists "Upload photos to related repairs" on repair_photos;
create policy "Upload photos to related repairs" on repair_photos for insert with check (
  exists (select 1 from repairs where repairs.id = repair_photos.repair_id and (repairs.client_id = auth.uid() or repairs.partner_id = auth.uid()))
);

-- PAYMENTS
drop policy if exists "View own payments" on payments;
create policy "View own payments" on payments for select using (
  exists (select 1 from repairs where repairs.id = payments.repair_id and (repairs.client_id = auth.uid() or repairs.partner_id = auth.uid()))
);

-- REVIEWS
drop policy if exists "Public reviews" on reviews;
create policy "Public reviews" on reviews for select using ( true );
drop policy if exists "Clients create reviews" on reviews;
create policy "Clients create reviews" on reviews for insert with check ( auth.uid() = client_id );

-- TECHNICIAN VERIFICATIONS
drop policy if exists "Partners view own verification" on technician_verifications;
create policy "Partners view own verification" on technician_verifications for select using ( auth.uid() = partner_id );
drop policy if exists "Partners submit verification" on technician_verifications;
create policy "Partners submit verification" on technician_verifications for insert with check ( auth.uid() = partner_id );

-- PARTNER LOCATIONS
drop policy if exists "Partners update own location" on partner_locations;
create policy "Partners update own location" on partner_locations for update using ( auth.uid() = partner_id );
drop policy if exists "Partners insert own location" on partner_locations;
create policy "Partners insert own location" on partner_locations for insert with check ( auth.uid() = partner_id );
drop policy if exists "Public locations" on partner_locations;
create policy "Public locations" on partner_locations for select using ( true ); -- Masked in API usually

-- NOTIFICATIONS
drop policy if exists "Users see own notifications" on notifications;
create policy "Users see own notifications" on notifications for select using ( auth.uid() = user_id );

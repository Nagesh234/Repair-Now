-- Create OTP Codes table
create table public.otp_codes (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  code text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null
);

-- Add unique constraint to phone_number in profiles if not exists
alter table public.profiles add constraint profiles_phone_number_key unique (phone_number);

-- Enable RLS on otp_codes
alter table public.otp_codes enable row level security;

-- Allow service role (backend) full access, deny public access by default
create policy "Enable access to service role only" on public.otp_codes
    as permissive for all
    to service_role
    using (true)
    with check (true);

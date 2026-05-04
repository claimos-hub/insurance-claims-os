-- Create policies table for the retention system
create table if not exists policies (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  insurance_type text not null,        -- car, health, life, property, travel, other
  provider text not null,              -- insurance company name
  policy_number text not null,
  start_date date not null,
  end_date date not null,
  discount_end_date date,              -- nullable, when discount expires
  status text not null default 'active' check (status in ('active', 'expiring', 'expired')),
  created_at timestamptz not null default now()
);

-- Index for fast customer lookups
create index if not exists idx_policies_customer_id on policies(customer_id);

-- Index for retention alert queries (finding expiring policies)
create index if not exists idx_policies_end_date on policies(end_date);
create index if not exists idx_policies_discount_end_date on policies(discount_end_date);
create index if not exists idx_policies_status on policies(status);

-- Optional: link policies to claims via policy_number
-- (claims already have a policy_number column that can match)
comment on table policies is 'Customer insurance policies with retention/discount tracking';

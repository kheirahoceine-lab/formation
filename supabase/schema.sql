-- شغلي هاذ الملف مرة واحدة فـ Supabase: Dashboard > SQL Editor > New query > Run

create type user_role as enum ('student', 'influencer', 'admin');
create type enrollment_status as enum ('pending', 'active', 'rejected');
create type payment_method as enum ('baridimob', 'ccp', 'chargily');
create type payment_status as enum ('pending', 'confirmed', 'rejected');
create type commission_type as enum ('percent', 'fixed');
create type influencer_status as enum ('pending', 'approved', 'rejected');
create type commission_status as enum ('pending', 'paid');
create type payout_status as enum ('pending', 'approved', 'paid');

-- ============ الجداول ============

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  role user_role not null default 'student',
  created_at timestamptz not null default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  price_da integer not null default 0,
  cover_image text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  title text not null,
  video_url text,
  order_index integer not null default 0,
  is_free_preview boolean not null default false,
  created_at timestamptz not null default now()
);

create table lesson_files (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons on delete cascade,
  file_url text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles on delete cascade,
  course_id uuid not null references courses on delete cascade,
  status enrollment_status not null default 'pending',
  progress_percent integer not null default 0,
  referred_by uuid references profiles,
  enrolled_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments on delete cascade,
  lesson_id uuid not null references lessons on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (enrollment_id, lesson_id)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments on delete cascade,
  amount_da integer not null,
  method payment_method not null,
  receipt_image_url text,
  status payment_status not null default 'pending',
  reviewed_by uuid references profiles,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table influencers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles on delete cascade,
  promo_code text not null unique,
  referral_slug text not null unique,
  commission_type commission_type not null default 'percent',
  commission_value numeric not null default 0,
  status influencer_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table referral_visits (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references influencers on delete cascade,
  visited_at timestamptz not null default now()
);

create table commissions (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references influencers on delete cascade,
  enrollment_id uuid not null references enrollments on delete cascade,
  payment_id uuid not null references payments on delete cascade,
  amount_da integer not null,
  status commission_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table payout_requests (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references influencers on delete cascade,
  amount_requested integer not null,
  status payout_status not null default 'pending',
  bank_info text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

create table live_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  title text not null,
  meeting_link text not null,
  scheduled_at timestamptz not null
);

-- ============ تسجيل بروفايل أوتوماتيكي مع كل حساب جديد ============

create function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============ دوال مساعدة للصلاحيات (RLS) ============

create function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer set search_path = public;

create function is_enrolled(target_course_id uuid)
returns boolean as $$
  select exists (
    select 1 from enrollments
    where course_id = target_course_id
      and student_id = auth.uid()
      and status = 'active'
  );
$$ language sql security definer set search_path = public;

-- ============ تفعيل RLS ============

alter table profiles enable row level security;
alter table courses enable row level security;
alter table lessons enable row level security;
alter table lesson_files enable row level security;
alter table enrollments enable row level security;
alter table lesson_progress enable row level security;
alter table payments enable row level security;
alter table influencers enable row level security;
alter table referral_visits enable row level security;
alter table commissions enable row level security;
alter table payout_requests enable row level security;
alter table live_sessions enable row level security;

-- profiles
create policy "profiles: read own or admin" on profiles
  for select using (id = auth.uid() or is_admin());
create policy "profiles: update own or admin" on profiles
  for update using (id = auth.uid() or is_admin());

-- courses: الكاتالوغ مفتوح للجميع، التعديل للأدمين برك
create policy "courses: public read published" on courses
  for select using (is_published or is_admin());
create policy "courses: admin write" on courses
  for all using (is_admin()) with check (is_admin());

-- lessons: البريفيو مفتوح، الباقي للمسجلين فالدورة أو الأدمين
create policy "lessons: preview or enrolled or admin" on lessons
  for select using (is_free_preview or is_enrolled(course_id) or is_admin());
create policy "lessons: admin write" on lessons
  for all using (is_admin()) with check (is_admin());

-- lesson_files: نفس منطق الدروس
create policy "lesson_files: enrolled or admin" on lesson_files
  for select using (
    is_admin() or exists (
      select 1 from lessons where lessons.id = lesson_files.lesson_id
        and is_enrolled(lessons.course_id)
    )
  );
create policy "lesson_files: admin write" on lesson_files
  for all using (is_admin()) with check (is_admin());

-- enrollments
create policy "enrollments: own or admin" on enrollments
  for select using (student_id = auth.uid() or is_admin());
create policy "enrollments: student create own" on enrollments
  for insert with check (student_id = auth.uid());
create policy "enrollments: admin update" on enrollments
  for update using (is_admin());

-- lesson_progress
create policy "lesson_progress: own or admin" on lesson_progress
  for select using (
    is_admin() or exists (
      select 1 from enrollments
      where enrollments.id = lesson_progress.enrollment_id
        and enrollments.student_id = auth.uid()
    )
  );
create policy "lesson_progress: student write own" on lesson_progress
  for all using (
    exists (
      select 1 from enrollments
      where enrollments.id = lesson_progress.enrollment_id
        and enrollments.student_id = auth.uid()
    )
  );

-- payments
create policy "payments: own or admin" on payments
  for select using (
    is_admin() or exists (
      select 1 from enrollments
      where enrollments.id = payments.enrollment_id
        and enrollments.student_id = auth.uid()
    )
  );
create policy "payments: student upload receipt" on payments
  for insert with check (
    exists (
      select 1 from enrollments
      where enrollments.id = payments.enrollment_id
        and enrollments.student_id = auth.uid()
    )
  );
create policy "payments: admin review" on payments
  for update using (is_admin());

-- influencers
create policy "influencers: own or admin" on influencers
  for select using (user_id = auth.uid() or is_admin());
create policy "influencers: request own" on influencers
  for insert with check (user_id = auth.uid());
create policy "influencers: admin approve" on influencers
  for update using (is_admin());

-- referral_visits: القراءة للإنفلونسر تاع نفسه أو الأدمين، الكتابة سيرفر برك
create policy "referral_visits: own or admin" on referral_visits
  for select using (
    is_admin() or exists (
      select 1 from influencers
      where influencers.id = referral_visits.influencer_id
        and influencers.user_id = auth.uid()
    )
  );

-- commissions
create policy "commissions: own or admin" on commissions
  for select using (
    is_admin() or exists (
      select 1 from influencers
      where influencers.id = commissions.influencer_id
        and influencers.user_id = auth.uid()
    )
  );
create policy "commissions: admin write" on commissions
  for all using (is_admin()) with check (is_admin());

-- payout_requests
create policy "payout_requests: own or admin" on payout_requests
  for select using (
    is_admin() or exists (
      select 1 from influencers
      where influencers.id = payout_requests.influencer_id
        and influencers.user_id = auth.uid()
    )
  );
create policy "payout_requests: influencer request" on payout_requests
  for insert with check (
    exists (
      select 1 from influencers
      where influencers.id = payout_requests.influencer_id
        and influencers.user_id = auth.uid()
    )
  );
create policy "payout_requests: admin update" on payout_requests
  for update using (is_admin());

-- live_sessions: المسجلين فالدورة أو الأدمين
create policy "live_sessions: enrolled or admin" on live_sessions
  for select using (is_enrolled(course_id) or is_admin());
create policy "live_sessions: admin write" on live_sessions
  for all using (is_admin()) with check (is_admin());

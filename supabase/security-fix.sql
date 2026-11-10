-- ثغرة أمنية: أي مستخدم يقدر يبدل role تاعو بروحو (مثلاً لـ admin) لأن RLS كانت
-- تسمح بالتعديل على الصف الخاص بيه بلا ما تمنع تغيير عمود role. هاذ الملف يسدها:
-- غير الأدمين يقدر يبدل role (تاعو ولا تاع حتى واحد).

create function prevent_role_escalation()
returns trigger as $$
begin
  if new.role <> old.role and not is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger profiles_prevent_role_escalation
  before update on profiles
  for each row execute procedure prevent_role_escalation();

-- باغ ثاني مرتبط: الطالب ما كانش يقدر يحدث نسبة التقدم (progress_percent) تاعو
-- فالدورة، لأن ماكانش عندو حتى صلاحية تعديل على enrollments (غير الأدمين).
-- هاذ السطور تعطيه صلاحية يعدل الصف تاعو، لكن بحارس يمنعو يبدل status
-- (ماشي يفتح روحو الدورة بلا دفع) ولا referred_by (ماشي يغير الإنفلونسر اللي جابو).

create policy "enrollments: student update own" on enrollments
  for update using (student_id = auth.uid());

create function prevent_enrollment_tampering()
returns trigger as $$
begin
  if not is_admin() then
    new.status := old.status;
    new.referred_by := old.referred_by;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger enrollments_prevent_tampering
  before update on enrollments
  for each row execute procedure prevent_enrollment_tampering();

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

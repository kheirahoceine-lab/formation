-- شغلي هاذ الملف بعد schema.sql و storage.sql
-- يسمح بتسجيل زيارة رابط الإنفلونسر حتى من زائر ماشي داخل لحسابه

create policy "referral_visits: public insert" on referral_visits
  for insert with check (true);

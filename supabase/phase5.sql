-- شغلي هاذ الملف بعد schema.sql و storage.sql
-- يسمح بتسجيل زيارة رابط الإنفلونسر حتى من زائر ماشي داخل لحسابه

create policy "referral_visits: public insert" on referral_visits
  for insert with check (true);

-- يسمح بالتحقق من كود البرومو (الزائر ماشي داخل، والطالب اللي يشري ماشي الإنفلونسر نفسو)
-- القراءة محدودة للإنفلونسرز المقبولين برك، بلا بيانات حساسة زايدة
create policy "influencers: public read approved" on influencers
  for select using (status = 'approved');

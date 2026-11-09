-- شغلي هاذ الملف بعد schema.sql (نفس الطريقة: SQL Editor > New query > Run)
-- يخلق أماكن تخزين الملفات: صور الدورات (عمومية)، ملفات الدروس، ووصولات الدفع (خاصة)

insert into storage.buckets (id, name, public)
values
  ('course-covers', 'course-covers', true),
  ('lesson-files', 'lesson-files', false),
  ('payment-receipts', 'payment-receipts', false)
on conflict (id) do nothing;

-- course-covers: صور الدورات، تبان للجميع، الكتابة للأدمين برك
create policy "course-covers: public read" on storage.objects
  for select using (bucket_id = 'course-covers');
create policy "course-covers: admin write" on storage.objects
  for insert with check (bucket_id = 'course-covers' and is_admin());
create policy "course-covers: admin update" on storage.objects
  for update using (bucket_id = 'course-covers' and is_admin());
create policy "course-covers: admin delete" on storage.objects
  for delete using (bucket_id = 'course-covers' and is_admin());

-- lesson-files: الملف يتخزن تحت مسار "<course_id>/..."
-- القراءة للمسجلين فالدورة أو الأدمين، الكتابة للأدمين برك
create policy "lesson-files: enrolled or admin read" on storage.objects
  for select using (
    bucket_id = 'lesson-files' and (
      is_admin() or is_enrolled((storage.foldername(name))[1]::uuid)
    )
  );
create policy "lesson-files: admin write" on storage.objects
  for insert with check (bucket_id = 'lesson-files' and is_admin());
create policy "lesson-files: admin update" on storage.objects
  for update using (bucket_id = 'lesson-files' and is_admin());
create policy "lesson-files: admin delete" on storage.objects
  for delete using (bucket_id = 'lesson-files' and is_admin());

-- payment-receipts: الوصل يتخزن تحت مسار "<student_id>/..."
-- الطالب يرفع وصلو برك، القراءة ليه ولا للأدمين
create policy "payment-receipts: own upload" on storage.objects
  for insert with check (
    bucket_id = 'payment-receipts' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "payment-receipts: own or admin read" on storage.objects
  for select using (
    bucket_id = 'payment-receipts' and (
      is_admin() or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

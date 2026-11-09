# منصة الدورات التكوينية

مشروع Next.js + Supabase لمنصة دورات أونلاين فالجزائر.

## خطوات التشغيل (مرة واحدة)

### 1. إنشاء حساب ومشروع فـ Supabase

1. روحي لـ https://supabase.com وافتحي حساب (مجاني).
2. "New Project" → عطيها اسم (مثلاً `formations-dz`) وباسوورد لقاعدة البيانات (خزنيه).
3. استنى شوية (دقيقة أو دقيقتين) حتى يتجهز المشروع.

### 2. تشغيل بنية قاعدة البيانات

1. فالمشروع تاعك فـ Supabase، روحي لـ **SQL Editor** (فالمنيو اليسار).
2. "New query"، نقلي كل محتوى الملف `supabase/schema.sql` اللي كاين فهاذ المشروع، لصقيه، وضغطي **Run**.
3. يخلق لك الجداول كاملين (profiles, courses, lessons...) + الحماية (RLS).

### 3. ربط المشروع بالمفاتيح

1. فـ Supabase: **Project Settings → API**.
2. نقلي قيمة `Project URL` و`anon public key`.
3. فالمجلد تاع المشروع، نسخي الملف `.env.local.example` وسميه `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
4. عمري `.env.local` بالقيم تاعك:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxx
   ```

### 4. تعطيل تأكيد البريد (اختياري، للتجربة بسهولة)

فـ Supabase: **Authentication → Sign In / Providers → Email** → عطلي "Confirm email". هكا تقدري تسجلي حساب وتدخلي مباشرة بلا ما تتسنى إيميل التأكيد. (فـ production تقدري ترجعيها.)

### 5. تشغيل المشروع

```bash
npm install
npm run dev
```

حلي http://localhost:3000

## أول دورة للتجربة

باش تشوفي حاجة فالكاتالوغ، زيدي صف فجدول `courses` من Supabase (Table Editor) بـ `is_published = true`، أو استناي المرحلة الجاية (لوحة الأدمين).

## بنية المشروع

- `src/app` — الصفحات (App Router)
- `src/lib/supabase` — الاتصال بـ Supabase (`client.ts` للمتصفح، `server.ts` للسيرفر)
- `src/proxy.ts` — يحدّث جلسة تسجيل الدخول فكل طلب (بديل middleware فـ Next.js 16)
- `supabase/schema.sql` — بنية قاعدة البيانات كاملة + الصلاحيات

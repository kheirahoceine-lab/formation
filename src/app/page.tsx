import { createClient } from "@/lib/supabase/server";
import CourseCard from "@/components/CourseCard";
import type { Course } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .returns<Course[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold text-neutral-900">
        دوراتنا التكوينية
      </h1>
      <p className="mb-8 text-neutral-600">
        دورات أونلاين عالية الجودة، تعلّم بالخطوة ودفع ساهل (BaridiMob / CCP).
      </p>

      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          قاعدة البيانات ماهياش مربوطة بعد. راجع ملف .env.local.
        </p>
      )}

      {!error && (!courses || courses.length === 0) && (
        <p className="rounded-lg bg-neutral-100 px-4 py-6 text-center text-neutral-600">
          ماكاين حتى دورة منشورة حالياً. زيدها من لوحة الأدمين.
        </p>
      )}

      {courses && courses.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

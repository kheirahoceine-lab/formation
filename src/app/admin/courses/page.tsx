import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import type { Course } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const { supabase } = await requireAdmin();
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Course[]>();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">الدورات</h2>
        <Link
          href="/admin/courses/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
        >
          + دورة جديدة
        </Link>
      </div>

      <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
        {(!courses || courses.length === 0) && (
          <p className="p-6 text-center text-neutral-500">ماكاين حتى دورة. زيدي أول واحدة.</p>
        )}
        {courses?.map((course) => (
          <Link
            key={course.id}
            href={`/admin/courses/${course.id}`}
            className="flex items-center justify-between p-4 hover:bg-neutral-50"
          >
            <div>
              <p className="font-medium">{course.title}</p>
              <p className="text-sm text-neutral-500">
                {course.price_da.toLocaleString("ar-DZ")} دج
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs ${
                course.is_published
                  ? "bg-green-100 text-green-700"
                  : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {course.is_published ? "منشورة" : "مسودة"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { updateCourse } from "@/app/actions/admin";
import type { Course, Lesson } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({
  params,
}: PageProps<"/admin/courses/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single<Course>();

  if (!course) notFound();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", id)
    .order("order_index", { ascending: true })
    .returns<Lesson[]>();

  const updateCourseWithId = updateCourse.bind(null, id);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div>
        <h2 className="mb-4 text-lg font-bold">تعديل الدورة</h2>
        <form
          action={updateCourseWithId}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="mb-1 block text-sm">العنوان</label>
            <input
              name="title"
              defaultValue={course.title}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">الرابط (slug)</label>
            <input
              name="slug"
              defaultValue={course.slug}
              required
              dir="ltr"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">الوصف</label>
            <textarea
              name="description"
              rows={4}
              defaultValue={course.description ?? ""}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">السعر (دج)</label>
            <input
              name="price_da"
              type="number"
              min={0}
              defaultValue={course.price_da}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          {course.cover_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.cover_image}
              alt=""
              className="h-32 w-full rounded-lg object-cover"
            />
          )}
          <div>
            <label className="mb-1 block text-sm">تغيير صورة الغلاف</label>
            <input name="cover" type="file" accept="image/*" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              name="is_published"
              type="checkbox"
              defaultChecked={course.is_published}
            />
            منشورة (تبان فالكاتالوغ)
          </label>
          <button className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700">
            حفظ التعديلات
          </button>
        </form>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">الدروس</h2>
          <Link
            href={`/admin/courses/${id}/lessons/new`}
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-700"
          >
            + درس جديد
          </Link>
        </div>

        <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
          {(!lessons || lessons.length === 0) && (
            <p className="p-6 text-center text-neutral-500">ماكاين حتى درس.</p>
          )}
          {lessons?.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/admin/courses/${id}/lessons/${lesson.id}`}
              className="flex items-center justify-between p-4 hover:bg-neutral-50"
            >
              <span>
                {lesson.order_index}. {lesson.title}
              </span>
              {lesson.is_free_preview && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  بريفيو
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

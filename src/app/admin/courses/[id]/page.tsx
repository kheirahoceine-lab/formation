import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { updateCourse, createLiveSession, deleteLiveSession } from "@/app/actions/admin";
import type { Course, Lesson, LiveSession } from "@/lib/types";

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

  const { data: liveSessions } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("course_id", id)
    .order("scheduled_at", { ascending: true })
    .returns<LiveSession[]>();

  const updateCourseWithId = updateCourse.bind(null, id);
  const createLiveSessionWithId = createLiveSession.bind(null, id);

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

      <div className="lg:col-span-2">
        <h2 className="mb-4 text-lg font-bold">الحصص اللايف</h2>

        <form
          action={createLiveSessionWithId}
          className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white p-4"
        >
          <div className="flex-1">
            <label className="mb-1 block text-xs">عنوان الحصة</label>
            <input
              name="title"
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs">رابط الاجتماع (Zoom/Meet)</label>
            <input
              name="meeting_link"
              dir="ltr"
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs">الوقت</label>
            <input
              name="scheduled_at"
              type="datetime-local"
              required
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700">
            إضافة
          </button>
        </form>

        <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
          {(!liveSessions || liveSessions.length === 0) && (
            <p className="p-6 text-center text-neutral-500">ماكاين حتى حصة لايف مبرمجة.</p>
          )}
          {liveSessions?.map((session) => {
            const deleteBound = deleteLiveSession.bind(null, id, session.id);
            return (
              <div key={session.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{session.title}</p>
                  <p className="text-sm text-neutral-500">
                    {new Date(session.scheduled_at).toLocaleString("ar-DZ")}
                  </p>
                </div>
                <form action={deleteBound}>
                  <button className="text-xs text-red-600 hover:underline">حذف</button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

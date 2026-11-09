import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  updateLesson,
  deleteLesson,
  uploadLessonFile,
  deleteLessonFile,
} from "@/app/actions/admin";
import type { Lesson, LessonFile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditLessonPage({
  params,
}: PageProps<"/admin/courses/[id]/lessons/[lessonId]">) {
  const { id, lessonId } = await params;
  const { supabase } = await requireAdmin();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single<Lesson>();

  if (!lesson) notFound();

  const { data: files } = await supabase
    .from("lesson_files")
    .select("*")
    .eq("lesson_id", lessonId)
    .returns<LessonFile[]>();

  const updateLessonBound = updateLesson.bind(null, id, lessonId);
  const deleteLessonBound = deleteLesson.bind(null, id, lessonId);
  const uploadFileBound = uploadLessonFile.bind(null, id, lessonId);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div>
        <h2 className="mb-4 text-lg font-bold">تعديل الدرس</h2>
        <form action={updateLessonBound} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm">عنوان الدرس</label>
            <input
              name="title"
              defaultValue={lesson.title}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">رابط الفيديو</label>
            <input
              name="video_url"
              dir="ltr"
              defaultValue={lesson.video_url ?? ""}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">ترتيب الدرس</label>
            <input
              name="order_index"
              type="number"
              defaultValue={lesson.order_index}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              name="is_free_preview"
              type="checkbox"
              defaultChecked={lesson.is_free_preview}
            />
            بريفيو مجاني
          </label>
          <button className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700">
            حفظ التعديلات
          </button>
        </form>

        <form action={deleteLessonBound} className="mt-3">
          <button className="text-sm text-red-600 hover:underline">
            حذف الدرس
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold">ملفات الدرس (PDF...)</h2>

        <form
          action={uploadFileBound}
          className="mb-4 flex items-center gap-3"
        >
          <input name="file" type="file" required className="text-sm" />
          <button className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-700">
            رفع
          </button>
        </form>

        <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
          {(!files || files.length === 0) && (
            <p className="p-4 text-center text-sm text-neutral-500">
              ماكاين حتى ملف.
            </p>
          )}
          {files?.map((file) => {
            const deleteFileBound = deleteLessonFile.bind(
              null,
              id,
              lessonId,
              file.id,
              file.file_url
            );
            return (
              <div key={file.id} className="flex items-center justify-between p-3">
                <span className="text-sm">{file.file_name}</span>
                <form action={deleteFileBound}>
                  <button className="text-xs text-red-600 hover:underline">
                    حذف
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

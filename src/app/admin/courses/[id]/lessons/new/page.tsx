import { createLesson } from "@/app/actions/admin";

export default async function NewLessonPage({
  params,
}: PageProps<"/admin/courses/[id]/lessons/new">) {
  const { id } = await params;
  const createLessonForCourse = createLesson.bind(null, id);

  return (
    <div className="max-w-lg">
      <h2 className="mb-4 text-lg font-bold">درس جديد</h2>
      <form action={createLessonForCourse} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm">عنوان الدرس</label>
          <input
            name="title"
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">
            رابط الفيديو (يوتيوب غير مدرج، Bunny...)
          </label>
          <input
            name="video_url"
            dir="ltr"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">ترتيب الدرس</label>
          <input
            name="order_index"
            type="number"
            defaultValue={1}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input name="is_free_preview" type="checkbox" />
          بريفيو مجاني (يبان بلا شراء)
        </label>
        <button className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700">
          إنشاء الدرس
        </button>
      </form>
    </div>
  );
}

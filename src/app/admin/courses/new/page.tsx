import { createCourse } from "@/app/actions/admin";

export default async function NewCoursePage({
  searchParams,
}: PageProps<"/admin/courses/new">) {
  const { error } = await searchParams;

  return (
    <div className="max-w-lg">
      <h2 className="mb-4 text-lg font-bold">دورة جديدة</h2>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={createCourse}
        className="flex flex-col gap-4"
      >
        <div>
          <label className="mb-1 block text-sm">العنوان</label>
          <input
            name="title"
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">
            الرابط (slug) — اختياري، إلا خليتيه فارغ نعمروه من العنوان
          </label>
          <input
            name="slug"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            dir="ltr"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">الوصف</label>
          <textarea
            name="description"
            rows={4}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">السعر (دج)</label>
          <input
            name="price_da"
            type="number"
            min={0}
            defaultValue={0}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">صورة الغلاف</label>
          <input name="cover" type="file" accept="image/*" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input name="is_published" type="checkbox" />
          نشر الدورة مباشرة (تبان فالكاتالوغ)
        </label>
        <button className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700">
          إنشاء الدورة
        </button>
      </form>
    </div>
  );
}

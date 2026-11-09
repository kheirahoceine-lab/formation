import Link from "next/link";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type EnrollmentRow = {
  id: string;
  status: string;
  progress_percent: number;
  courses: { title: string; slug: string; cover_image: string | null } | null;
};

export default async function DashboardPage() {
  const { supabase } = await requireUser();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, status, progress_percent, courses(title, slug, cover_image)")
    .order("enrolled_at", { ascending: false })
    .returns<EnrollmentRow[]>();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">دوراتي</h1>

      {(!enrollments || enrollments.length === 0) && (
        <p className="rounded-2xl border border-neutral-200 bg-white p-6 text-center text-neutral-500">
          ماعندكش حتى دورة بعد.{" "}
          <Link href="/" className="underline">
            شوفي الكاتالوغ
          </Link>
        </p>
      )}

      <div className="flex flex-col gap-4">
        {enrollments?.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4"
          >
            <div>
              <p className="font-medium">{e.courses?.title}</p>
              {e.status === "active" ? (
                <p className="text-sm text-neutral-500">
                  تقدمك: {e.progress_percent}%
                </p>
              ) : (
                <p className="text-sm text-amber-600">
                  {e.status === "pending" ? "بانتظار تأكيد الدفع" : "تم رفض الوصل"}
                </p>
              )}
            </div>
            {e.status === "active" && e.courses && (
              <Link
                href={`/dashboard/courses/${e.courses.slug}`}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
              >
                تابعي الدورة
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

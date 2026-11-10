import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import type { Course } from "@/lib/types";
import { submitPayment } from "@/app/actions/checkout";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
  searchParams,
}: PageProps<"/checkout/[slug]">) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const { submitted, error, already } = await searchParams;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .single<Course>();

  if (!course) notFound();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let enrollmentStatus: string | null = null;
  if (user) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("status")
      .eq("student_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();
    enrollmentStatus = enrollment?.status ?? null;
  }

  const submitPaymentForCourse = submitPayment.bind(null, slug);
  const refCode = (await cookies()).get("ref_code")?.value ?? "";

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-2 text-center text-2xl font-bold">{course.title}</h1>
      <p className="mb-6 text-center text-neutral-600">
        {course.price_da.toLocaleString("ar-DZ")} دج
      </p>

      {!user && (
        <div className="text-center">
          <p className="mb-4 text-neutral-700">لازم تدخلي لحسابك قبل الشراء.</p>
          <Link
            href="/login"
            className="rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white hover:bg-neutral-700"
          >
            تسجيل الدخول
          </Link>
        </div>
      )}

      {user && (enrollmentStatus === "active" || already) && (
        <p className="rounded-lg bg-green-50 px-4 py-6 text-center text-green-800">
          عندك هاذ الدورة من قبل.{" "}
          <Link href="/dashboard" className="underline">
            روحي للوحتي
          </Link>
        </p>
      )}

      {user && enrollmentStatus !== "active" && !already && submitted && (
        <p className="rounded-lg bg-amber-50 px-4 py-6 text-center text-amber-800">
          توصلنا بالوصل تاعك. الأدمين غادي يأكده قريباً وتتفتح الدورة.
        </p>
      )}

      {user && enrollmentStatus !== "active" && !already && !submitted && (
        <form
          action={submitPaymentForCourse}
          className="flex flex-col gap-4"
        >
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {enrollmentStatus === "rejected" && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              تم رفض الوصل السابق. جربي ترفعي وصل آخر.
            </p>
          )}

          <div>
            <p className="mb-2 text-sm font-medium">حوّلي المبلغ إلى:</p>
            <div className="rounded-lg bg-neutral-100 p-3 text-sm text-neutral-700">
              BaridiMob / CCP: 0000 0000 0000 0000 (رقم الحساب تاع المنصة)
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm">طريقة الدفع</label>
            <select
              name="method"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            >
              <option value="baridimob">BaridiMob</option>
              <option value="ccp">CCP</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm">صورة وصل الدفع</label>
            <input name="receipt" type="file" accept="image/*" required />
          </div>

          <div>
            <label className="mb-1 block text-sm">كود برومو (اختياري)</label>
            <input
              name="promo_code"
              defaultValue={refCode}
              dir="ltr"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>

          <button className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700">
            إرسال الوصل
          </button>
        </form>
      )}
    </div>
  );
}

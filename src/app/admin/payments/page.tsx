import { requireAdmin } from "@/lib/auth";
import { confirmPayment, rejectPayment } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

type PaymentRow = {
  id: string;
  amount_da: number;
  method: string;
  receipt_image_url: string | null;
  status: string;
  created_at: string;
  enrollment_id: string;
  enrollments: {
    courses: { title: string } | null;
    profiles: { full_name: string | null; phone: string | null } | null;
  } | null;
};

export default async function AdminPaymentsPage() {
  const { supabase } = await requireAdmin();

  const { data: payments } = await supabase
    .from("payments")
    .select(
      "id, amount_da, method, receipt_image_url, status, created_at, enrollment_id, enrollments(courses(title), profiles!enrollments_student_id_fkey(full_name, phone))"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .returns<PaymentRow[]>();

  const withReceiptUrls = await Promise.all(
    (payments ?? []).map(async (p) => {
      let signedUrl: string | null = null;
      if (p.receipt_image_url) {
        const { data } = await supabase.storage
          .from("payment-receipts")
          .createSignedUrl(p.receipt_image_url, 3600);
        signedUrl = data?.signedUrl ?? null;
      }
      return { ...p, signedUrl };
    })
  );

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">الدفعات بانتظار التأكيد</h2>

      {withReceiptUrls.length === 0 && (
        <p className="rounded-2xl border border-neutral-200 bg-white p-6 text-center text-neutral-500">
          ماكاين حتى دفعة بانتظار التأكيد.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {withReceiptUrls.map((p) => {
          const confirmBound = confirmPayment.bind(null, p.id, p.enrollment_id);
          const rejectBound = rejectPayment.bind(null, p.id, p.enrollment_id);
          return (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {p.enrollments?.courses?.title ?? "دورة محذوفة"}
                </p>
                <p className="text-sm text-neutral-600">
                  {p.enrollments?.profiles?.full_name} —{" "}
                  {p.enrollments?.profiles?.phone}
                </p>
                <p className="text-sm text-neutral-600">
                  {p.amount_da.toLocaleString("ar-DZ")} دج عبر {p.method}
                </p>
                {p.signedUrl && (
                  <a
                    href={p.signedUrl}
                    target="_blank"
                    className="text-sm font-medium text-ink underline"
                  >
                    شوفي الوصل
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <form action={confirmBound}>
                  <button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">
                    تأكيد
                  </button>
                </form>
                <form action={rejectBound}>
                  <button className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">
                    رفض
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

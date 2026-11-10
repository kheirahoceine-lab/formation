import { requireAdmin } from "@/lib/auth";
import { approveInfluencer, rejectInfluencer } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

type InfluencerRow = {
  id: string;
  promo_code: string;
  commission_type: string;
  commission_value: number;
  status: string;
  profiles: { full_name: string | null; phone: string | null } | null;
};

export default async function AdminInfluencersPage() {
  const { supabase } = await requireAdmin();

  const { data: influencers } = await supabase
    .from("influencers")
    .select("id, promo_code, commission_type, commission_value, status, profiles(full_name, phone)")
    .order("created_at", { ascending: false })
    .returns<InfluencerRow[]>();

  const pending = influencers?.filter((i) => i.status === "pending") ?? [];
  const others = influencers?.filter((i) => i.status !== "pending") ?? [];

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">طلبات الإنفلونسرز الجديدة</h2>

      {pending.length === 0 && (
        <p className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 text-center text-neutral-500">
          ماكاين حتى طلب جديد.
        </p>
      )}

      <div className="mb-8 flex flex-col gap-4">
        {pending.map((i) => {
          const approveBound = approveInfluencer.bind(null, i.id);
          const rejectBound = rejectInfluencer.bind(null, i.id);
          return (
            <div key={i.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="mb-1 font-medium">{i.profiles?.full_name}</p>
              <p className="mb-3 text-sm text-neutral-500">
                {i.profiles?.phone} — كود: {i.promo_code}
              </p>
              <form action={approveBound} className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-xs">نوع العمولة</label>
                  <select
                    name="commission_type"
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  >
                    <option value="percent">نسبة %</option>
                    <option value="fixed">مبلغ ثابت (دج)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs">القيمة</label>
                  <input
                    name="commission_value"
                    type="number"
                    min={0}
                    required
                    className="w-28 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <button className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700">
                  قبول
                </button>
              </form>
              <form action={rejectBound} className="mt-2">
                <button className="text-xs text-red-600 hover:underline">رفض الطلب</button>
              </form>
            </div>
          );
        })}
      </div>

      <h2 className="mb-4 text-lg font-bold">الإنفلونسرز</h2>
      <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
        {others.length === 0 && (
          <p className="p-6 text-center text-neutral-500">ماكاين حتى إنفلونسر مقبول بعد.</p>
        )}
        {others.map((i) => (
          <div key={i.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{i.profiles?.full_name}</p>
              <p className="text-sm text-neutral-500">كود: {i.promo_code}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs ${
                i.status === "approved"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {i.status === "approved"
                ? `${i.commission_value}${i.commission_type === "percent" ? "%" : " دج"}`
                : "مرفوض"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

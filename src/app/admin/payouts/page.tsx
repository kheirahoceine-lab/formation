import { requireAdmin } from "@/lib/auth";
import { approvePayout, markPayoutPaid } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

type PayoutRow = {
  id: string;
  amount_requested: number;
  bank_info: string | null;
  status: string;
  requested_at: string;
  influencers: {
    promo_code: string;
    profiles: { full_name: string | null } | null;
  } | null;
};

export default async function AdminPayoutsPage() {
  const { supabase } = await requireAdmin();

  const { data: payouts } = await supabase
    .from("payout_requests")
    .select(
      "id, amount_requested, bank_info, status, requested_at, influencers(promo_code, profiles(full_name))"
    )
    .in("status", ["pending", "approved"])
    .order("requested_at", { ascending: true })
    .returns<PayoutRow[]>();

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">طلبات سحب الأرباح</h2>

      {(!payouts || payouts.length === 0) && (
        <p className="rounded-2xl border border-neutral-200 bg-white p-6 text-center text-neutral-500">
          ماكاين حتى طلب سحب حالياً.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {payouts?.map((p) => {
          const approveBound = approvePayout.bind(null, p.id);
          const paidBound = markPayoutPaid.bind(null, p.id);
          return (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{p.influencers?.profiles?.full_name}</p>
                <p className="text-sm text-neutral-600">
                  {p.amount_requested.toLocaleString("ar-DZ")} دج — {p.bank_info}
                </p>
                <p className="text-xs text-neutral-400">كود: {p.influencers?.promo_code}</p>
              </div>
              <div className="flex gap-2">
                {p.status === "pending" && (
                  <form action={approveBound}>
                    <button className="rounded-lg bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark">
                      موافقة
                    </button>
                  </form>
                )}
                <form action={paidBound}>
                  <button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">
                    تم الدفع
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

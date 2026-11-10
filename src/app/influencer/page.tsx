import { headers } from "next/headers";
import { requireUser } from "@/lib/auth";
import { applyForInfluencer, requestPayout } from "@/app/actions/influencer";
import CopyButton from "@/components/CopyButton";
import type { Influencer, Commission, PayoutRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InfluencerPage() {
  const { supabase, user } = await requireUser();

  const { data: influencer } = await supabase
    .from("influencers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Influencer>();

  if (!influencer) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="mb-4 text-2xl font-bold">كوني إنفلونسر (مسوّقة)</h1>
        <p className="mb-6 text-neutral-600">
          احصلي على رابط خاص وكود برومو، وكل بيع يجي من عندك يربحك عمولة.
          الأدمين يراجع طلبك ويحدد نسبة العمولة تاعك.
        </p>
        <form action={applyForInfluencer}>
          <button className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark">
            اطلبي الانضمام
          </button>
        </form>
      </div>
    );
  }

  if (influencer.status === "pending") {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="rounded-lg bg-amber-50 px-4 py-6 text-amber-800">
          طلبك بانتظار مراجعة الأدمين. غادي نعلموك ملي يتأكد.
        </p>
      </div>
    );
  }

  if (influencer.status === "rejected") {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="rounded-lg bg-red-50 px-4 py-6 text-red-800">
          للأسف تم رفض طلبك. تقدري تتواصلي مع الإدارة لمزيد من المعلومات.
        </p>
      </div>
    );
  }

  const host = (await headers()).get("host");
  const referralLink = `https://${host}/?ref=${influencer.promo_code}`;

  const { count: visitsCount } = await supabase
    .from("referral_visits")
    .select("id", { count: "exact", head: true })
    .eq("influencer_id", influencer.id);

  const { data: commissions } = await supabase
    .from("commissions")
    .select("*")
    .eq("influencer_id", influencer.id)
    .order("created_at", { ascending: false })
    .returns<Commission[]>();

  const { data: payouts } = await supabase
    .from("payout_requests")
    .select("*")
    .eq("influencer_id", influencer.id)
    .order("requested_at", { ascending: false })
    .returns<PayoutRequest[]>();

  const totalEarned = (commissions ?? []).reduce((sum, c) => sum + c.amount_da, 0);
  const totalPaidOut = (payouts ?? [])
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount_requested, 0);
  const pendingPayoutRequests = (payouts ?? [])
    .filter((p) => p.status !== "paid")
    .reduce((sum, p) => sum + p.amount_requested, 0);
  const availableBalance = totalEarned - totalPaidOut - pendingPayoutRequests;

  const commissionLabel =
    influencer.commission_type === "percent"
      ? `${influencer.commission_value}%`
      : `${influencer.commission_value.toLocaleString("ar-DZ")} دج لكل طالب`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">لوحة الإنفلونسر</h1>

      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <p className="mb-1 text-sm text-neutral-500">رابطك الخاص</p>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <code dir="ltr" className="rounded-lg bg-neutral-100 px-3 py-2 text-sm">
            {referralLink}
          </code>
          <CopyButton text={referralLink} />
        </div>
        <p className="text-sm text-neutral-500">
          كود البرومو: <span className="font-bold">{influencer.promo_code}</span> —
          العمولة: <span className="font-bold">{commissionLabel}</span>
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="الزيارات" value={visitsCount ?? 0} />
        <Stat label="المبيعات" value={commissions?.length ?? 0} />
        <Stat label="إجمالي الأرباح" value={`${totalEarned.toLocaleString("ar-DZ")} دج`} />
        <Stat label="الرصيد المتاح" value={`${availableBalance.toLocaleString("ar-DZ")} دج`} />
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-bold">طلب سحب الأرباح</h2>
        <form
          action={requestPayout.bind(null, influencer.id)}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="mb-1 block text-sm">المبلغ (دج)</label>
            <input
              name="amount_requested"
              type="number"
              min={1}
              max={availableBalance > 0 ? availableBalance : undefined}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm">معلومات الحساب (RIP/CCP)</label>
            <input
              name="bank_info"
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <button className="rounded-lg bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark">
            طلب السحب
          </button>
        </form>
      </div>

      {payouts && payouts.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 font-bold">طلبات السحب</h2>
          <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 text-sm">
                <span>{p.amount_requested.toLocaleString("ar-DZ")} دج</span>
                <span className="text-neutral-500">{payoutStatusLabel(p.status)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {commissions && commissions.length > 0 && (
        <div>
          <h2 className="mb-3 font-bold">المبيعات والعمولات</h2>
          <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
            {commissions.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 text-sm">
                <span>{c.amount_da.toLocaleString("ar-DZ")} دج</span>
                <span className="text-neutral-500">
                  {c.status === "paid" ? "تم الدفع" : "بانتظار الدفع"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center">
      <p className="text-xl font-bold text-ink">{value}</p>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  );
}

function payoutStatusLabel(status: string) {
  if (status === "paid") return "تم الدفع";
  if (status === "approved") return "تمت الموافقة";
  return "بانتظار المراجعة";
}


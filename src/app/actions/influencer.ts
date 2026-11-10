"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { generatePromoCode } from "@/lib/promoCode";

export async function applyForInfluencer() {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("influencers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return;

  let lastError = null;
  for (let i = 0; i < 5; i++) {
    const code = generatePromoCode(user.email ?? "promo");
    const { error } = await supabase.from("influencers").insert({
      user_id: user.id,
      promo_code: code,
      referral_slug: code,
    });
    if (!error) {
      revalidatePath("/influencer");
      return;
    }
    lastError = error;
  }
  throw lastError;
}

export async function requestPayout(influencerId: string, formData: FormData) {
  const { supabase, user } = await requireUser();

  const amount = Number(formData.get("amount_requested") ?? 0);
  const bankInfo = String(formData.get("bank_info") ?? "").trim();

  const { data: influencer } = await supabase
    .from("influencers")
    .select("id")
    .eq("id", influencerId)
    .eq("user_id", user.id)
    .single();
  if (!influencer) return;

  const { data: commissions } = await supabase
    .from("commissions")
    .select("amount_da")
    .eq("influencer_id", influencerId);
  const { data: payouts } = await supabase
    .from("payout_requests")
    .select("amount_requested, status")
    .eq("influencer_id", influencerId);

  const totalEarned = (commissions ?? []).reduce((sum, c) => sum + c.amount_da, 0);
  const alreadyClaimed = (payouts ?? []).reduce((sum, p) => sum + p.amount_requested, 0);
  const availableBalance = totalEarned - alreadyClaimed;

  if (!amount || amount <= 0 || amount > availableBalance) return;

  await supabase.from("payout_requests").insert({
    influencer_id: influencerId,
    amount_requested: amount,
    bank_info: bankInfo,
  });

  revalidatePath("/influencer");
}

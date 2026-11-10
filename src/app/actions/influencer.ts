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
  const { supabase } = await requireUser();

  const amount = Number(formData.get("amount_requested") ?? 0);
  const bankInfo = String(formData.get("bank_info") ?? "").trim();

  await supabase.from("payout_requests").insert({
    influencer_id: influencerId,
    amount_requested: amount,
    bank_info: bankInfo,
  });

  revalidatePath("/influencer");
}

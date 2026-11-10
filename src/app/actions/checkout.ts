"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import type { Course, PaymentMethod } from "@/lib/types";

async function resolveReferrer(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  formData: FormData,
  currentUserId: string
) {
  const manualCode = String(formData.get("promo_code") ?? "").trim();
  const cookieCode = (await cookies()).get("ref_code")?.value ?? "";
  const code = manualCode || cookieCode;
  if (!code) return null;

  const { data: influencer } = await supabase
    .from("influencers")
    .select("user_id")
    .eq("promo_code", code)
    .eq("status", "approved")
    .maybeSingle();

  if (!influencer || influencer.user_id === currentUserId) return null;
  return influencer.user_id;
}

export async function submitPayment(courseSlug: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const slugPath = encodeURIComponent(courseSlug);

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", courseSlug)
    .single<Course>();

  if (!course) redirect("/");

  const { data: existing } = await supabase
    .from("enrollments")
    .select("id, status")
    .eq("student_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  if (existing?.status === "active") {
    redirect(`/checkout/${slugPath}?already=1`);
  }

  let enrollmentId = existing?.id;
  if (!enrollmentId) {
    const referredBy = await resolveReferrer(supabase, formData, user.id);
    const { data: enrollment, error } = await supabase
      .from("enrollments")
      .insert({ student_id: user.id, course_id: course.id, referred_by: referredBy })
      .select("id")
      .single();
    if (error) redirect(`/checkout/${slugPath}?error=${encodeURIComponent(error.message)}`);
    enrollmentId = enrollment.id;
  }

  const method = String(formData.get("method") ?? "baridimob") as PaymentMethod;
  const receipt = formData.get("receipt") as File | null;

  if (!receipt || receipt.size === 0) {
    redirect(`/checkout/${slugPath}?error=${encodeURIComponent("خاصك ترفعي صورة الوصل")}`);
  }

  const path = `${user.id}/${course.id}-${Date.now()}-${receipt.name}`;
  const { error: uploadError } = await supabase.storage
    .from("payment-receipts")
    .upload(path, receipt);

  if (uploadError) {
    redirect(`/checkout/${slugPath}?error=${encodeURIComponent(uploadError.message)}`);
  }

  await supabase.from("payments").insert({
    enrollment_id: enrollmentId,
    amount_da: course.price_da,
    method,
    receipt_image_url: path,
  });

  redirect(`/checkout/${slugPath}?submitted=1`);
}

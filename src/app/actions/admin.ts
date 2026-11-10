"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";

async function uploadCoverImage(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  courseId: string,
  file: File
) {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${courseId}/cover.${ext}`;
  const { error } = await supabase.storage
    .from("course-covers")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  return supabase.storage.from("course-covers").getPublicUrl(path).data
    .publicUrl;
}

export async function createCourse(formData: FormData) {
  const { supabase } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price_da = Number(formData.get("price_da") ?? 0);
  const is_published = formData.get("is_published") === "on";
  const cover = formData.get("cover") as File | null;

  const { data: course, error } = await supabase
    .from("courses")
    .insert({
      title,
      slug: slugInput || slugify(title),
      description,
      price_da,
      is_published,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/admin/courses/new?error=${encodeURIComponent(error.message)}`);
  }

  if (cover && cover.size > 0) {
    const url = await uploadCoverImage(supabase, course.id, cover);
    await supabase.from("courses").update({ cover_image: url }).eq("id", course.id);
  }

  revalidatePath("/admin/courses");
  revalidatePath("/");
  redirect(`/admin/courses/${course.id}`);
}

export async function updateCourse(courseId: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price_da = Number(formData.get("price_da") ?? 0);
  const is_published = formData.get("is_published") === "on";
  const cover = formData.get("cover") as File | null;

  const update: Record<string, unknown> = {
    title,
    slug,
    description,
    price_da,
    is_published,
    updated_at: new Date().toISOString(),
  };

  if (cover && cover.size > 0) {
    update.cover_image = await uploadCoverImage(supabase, courseId, cover);
  }

  await supabase.from("courses").update(update).eq("id", courseId);

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/");
  revalidatePath(`/courses/${slug}`);
}

export async function createLesson(courseId: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const video_url = String(formData.get("video_url") ?? "").trim();
  const order_index = Number(formData.get("order_index") ?? 0);
  const is_free_preview = formData.get("is_free_preview") === "on";

  await supabase.from("lessons").insert({
    course_id: courseId,
    title,
    video_url,
    order_index,
    is_free_preview,
  });

  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}`);
}

export async function updateLesson(
  courseId: string,
  lessonId: string,
  formData: FormData
) {
  const { supabase } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const video_url = String(formData.get("video_url") ?? "").trim();
  const order_index = Number(formData.get("order_index") ?? 0);
  const is_free_preview = formData.get("is_free_preview") === "on";

  await supabase
    .from("lessons")
    .update({ title, video_url, order_index, is_free_preview })
    .eq("id", lessonId);

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/admin/courses/${courseId}/lessons/${lessonId}`);
}

export async function deleteLesson(courseId: string, lessonId: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("lessons").delete().eq("id", lessonId);
  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}`);
}

export async function uploadLessonFile(
  courseId: string,
  lessonId: string,
  formData: FormData
) {
  const { supabase } = await requireAdmin();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;

  const path = `${courseId}/${lessonId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from("lesson-files")
    .upload(path, file);
  if (error) throw error;

  await supabase.from("lesson_files").insert({
    lesson_id: lessonId,
    file_url: path,
    file_name: file.name,
  });

  revalidatePath(`/admin/courses/${courseId}/lessons/${lessonId}`);
}

export async function deleteLessonFile(
  courseId: string,
  lessonId: string,
  fileId: string,
  path: string
) {
  const { supabase } = await requireAdmin();
  await supabase.storage.from("lesson-files").remove([path]);
  await supabase.from("lesson_files").delete().eq("id", fileId);
  revalidatePath(`/admin/courses/${courseId}/lessons/${lessonId}`);
}

export async function confirmPayment(paymentId: string, enrollmentId: string) {
  const { supabase, user } = await requireAdmin();

  const { data: payment } = await supabase
    .from("payments")
    .update({
      status: "confirmed",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .select("amount_da")
    .single();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .update({ status: "active" })
    .eq("id", enrollmentId)
    .select("referred_by")
    .single();

  if (enrollment?.referred_by && payment) {
    const { data: influencer } = await supabase
      .from("influencers")
      .select("id, commission_type, commission_value")
      .eq("user_id", enrollment.referred_by)
      .eq("status", "approved")
      .maybeSingle();

    if (influencer) {
      const commissionAmount =
        influencer.commission_type === "percent"
          ? Math.round((payment.amount_da * influencer.commission_value) / 100)
          : influencer.commission_value;

      await supabase.from("commissions").insert({
        influencer_id: influencer.id,
        enrollment_id: enrollmentId,
        payment_id: paymentId,
        amount_da: commissionAmount,
      });
    }
  }

  revalidatePath("/admin/payments");
}

export async function rejectPayment(paymentId: string, enrollmentId: string) {
  const { supabase, user } = await requireAdmin();

  await supabase
    .from("payments")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  await supabase
    .from("enrollments")
    .update({ status: "rejected" })
    .eq("id", enrollmentId);

  revalidatePath("/admin/payments");
}

export async function approveInfluencer(influencerId: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const commission_type = String(formData.get("commission_type") ?? "percent");
  const commission_value = Number(formData.get("commission_value") ?? 0);

  const { data: influencer } = await supabase
    .from("influencers")
    .update({ status: "approved", commission_type, commission_value })
    .eq("id", influencerId)
    .select("user_id")
    .single();

  if (influencer) {
    await supabase
      .from("profiles")
      .update({ role: "influencer" })
      .eq("id", influencer.user_id);
  }

  revalidatePath("/admin/influencers");
}

export async function rejectInfluencer(influencerId: string) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("influencers")
    .update({ status: "rejected" })
    .eq("id", influencerId);
  revalidatePath("/admin/influencers");
}

export async function approvePayout(payoutId: string) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("payout_requests")
    .update({ status: "approved" })
    .eq("id", payoutId);
  revalidatePath("/admin/payouts");
}

export async function markPayoutPaid(payoutId: string) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("payout_requests")
    .update({ status: "paid", processed_at: new Date().toISOString() })
    .eq("id", payoutId);
  revalidatePath("/admin/payouts");
}

export async function createLiveSession(courseId: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const meeting_link = String(formData.get("meeting_link") ?? "").trim();
  const scheduled_at = String(formData.get("scheduled_at") ?? "");

  await supabase.from("live_sessions").insert({
    course_id: courseId,
    title,
    meeting_link,
    scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : null,
  });

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function deleteLiveSession(courseId: string, sessionId: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("live_sessions").delete().eq("id", sessionId);
  revalidatePath(`/admin/courses/${courseId}`);
}

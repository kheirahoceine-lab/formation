"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

export async function toggleLessonComplete(
  courseSlug: string,
  enrollmentId: string,
  lessonId: string,
  courseId: string,
  completed: boolean
) {
  const { supabase } = await requireUser();

  await supabase.from("lesson_progress").upsert(
    {
      enrollment_id: enrollmentId,
      lesson_id: lessonId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "enrollment_id,lesson_id" }
  );

  const { count: totalLessons } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  const { count: completedLessons } = await supabase
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .eq("enrollment_id", enrollmentId)
    .eq("completed", true);

  const progress =
    totalLessons && totalLessons > 0
      ? Math.round(((completedLessons ?? 0) / totalLessons) * 100)
      : 0;

  await supabase
    .from("enrollments")
    .update({ progress_percent: progress })
    .eq("id", enrollmentId);

  revalidatePath(`/dashboard/courses/${courseSlug}`);
  revalidatePath(`/dashboard`);
}

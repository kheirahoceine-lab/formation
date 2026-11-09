import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { Course, Lesson } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CourseLearnPage({
  params,
}: PageProps<"/dashboard/courses/[slug]">) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const { supabase, user } = await requireUser();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .single<Course>();

  if (!course) notFound();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, status, progress_percent")
    .eq("student_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  if (!enrollment || enrollment.status !== "active") {
    redirect(`/checkout/${encodeURIComponent(slug)}`);
  }

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", course.id)
    .order("order_index", { ascending: true })
    .returns<Lesson[]>();

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed")
    .eq("enrollment_id", enrollment.id);

  const completedSet = new Set(
    (progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id)
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">{course.title}</h1>
      <p className="mb-6 text-neutral-600">تقدمك: {enrollment.progress_percent}%</p>

      <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
        {lessons?.map((lesson) => (
          <Link
            key={lesson.id}
            href={`/dashboard/courses/${slug}/lessons/${lesson.id}`}
            className="flex items-center justify-between p-4 hover:bg-neutral-50"
          >
            <span>
              {lesson.order_index}. {lesson.title}
            </span>
            {completedSet.has(lesson.id) && (
              <span className="text-sm text-green-600">✓ تم</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

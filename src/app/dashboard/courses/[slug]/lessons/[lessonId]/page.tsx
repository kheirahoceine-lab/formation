import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { toggleLessonComplete } from "@/app/actions/learning";
import type { Course, Lesson, LessonFile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: PageProps<"/dashboard/courses/[slug]/lessons/[lessonId]">) {
  const { slug: rawSlug, lessonId } = await params;
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
    .select("id, status")
    .eq("student_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  if (!enrollment || enrollment.status !== "active") {
    redirect(`/checkout/${encodeURIComponent(slug)}`);
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single<Lesson>();

  if (!lesson) notFound();

  const { data: files } = await supabase
    .from("lesson_files")
    .select("*")
    .eq("lesson_id", lessonId)
    .returns<LessonFile[]>();

  const filesWithUrls = await Promise.all(
    (files ?? []).map(async (f) => {
      const { data } = await supabase.storage
        .from("lesson-files")
        .createSignedUrl(f.file_url, 3600);
      return { ...f, signedUrl: data?.signedUrl ?? null };
    })
  );

  const { data: progressRow } = await supabase
    .from("lesson_progress")
    .select("completed")
    .eq("enrollment_id", enrollment.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const isCompleted = progressRow?.completed ?? false;
  const toggleBound = toggleLessonComplete.bind(
    null,
    slug,
    enrollment.id,
    lessonId,
    course.id,
    !isCompleted
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/dashboard/courses/${slug}`} className="mb-4 inline-block text-sm text-neutral-500 hover:underline">
        ← رجوع لقائمة الدروس
      </Link>
      <h1 className="mb-4 text-2xl font-bold">{lesson.title}</h1>

      {lesson.video_url ? (
        <div className="mb-6 aspect-video overflow-hidden rounded-2xl bg-black">
          <iframe
            src={lesson.video_url}
            className="h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="mb-6 rounded-2xl bg-neutral-100 p-6 text-center text-neutral-500">
          ماكاين فيديو لهاذ الدرس بعد.
        </p>
      )}

      {filesWithUrls.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 font-bold">الملفات</h2>
          <div className="flex flex-col gap-2">
            {filesWithUrls.map((f) => (
              <a
                key={f.id}
                href={f.signedUrl ?? "#"}
                target="_blank"
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
              >
                📄 {f.file_name}
              </a>
            ))}
          </div>
        </div>
      )}

      <form action={toggleBound}>
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            isCompleted
              ? "bg-neutral-100 text-neutral-700"
              : "bg-brand text-white hover:bg-brand-dark"
          }`}
        >
          {isCompleted ? "✓ تم إكمال الدرس (دوسي للإلغاء)" : "علّم الدرس كمكتمل"}
        </button>
      </form>
    </div>
  );
}

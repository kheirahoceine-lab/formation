import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CoursePage({
  params,
}: PageProps<"/courses/[slug]">) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single<Course>();

  if (!course) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="aspect-video overflow-hidden rounded-2xl bg-neutral-100">
        {course.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.cover_image}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <h1 className="mt-6 mb-2 text-3xl font-bold text-neutral-900">
        {course.title}
      </h1>
      <p className="mb-6 whitespace-pre-line text-neutral-700">
        {course.description}
      </p>

      <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-5">
        <span className="text-2xl font-bold text-neutral-900">
          {course.price_da.toLocaleString("ar-DZ")} دج
        </span>
        <Link
          href={`/checkout/${course.slug}`}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white hover:bg-neutral-700"
        >
          اشتري الدورة
        </Link>
      </div>
    </div>
  );
}

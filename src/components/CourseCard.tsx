import Link from "next/link";
import type { Course } from "@/lib/types";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="aspect-video bg-gradient-to-br from-brand-50 to-brand-100">
        {course.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.cover_image}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="mb-1 font-bold text-ink">{course.title}</h3>
        {course.description && (
          <p className="mb-3 line-clamp-2 text-sm text-neutral-600">
            {course.description}
          </p>
        )}
        <p className="font-bold text-brand">
          {course.price_da.toLocaleString("ar-DZ")} دج
        </p>
      </div>
    </Link>
  );
}

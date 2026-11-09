import Link from "next/link";
import type { Course } from "@/lib/types";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-md"
    >
      <div className="aspect-video bg-neutral-100">
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
        <h3 className="mb-1 font-bold text-neutral-900">{course.title}</h3>
        {course.description && (
          <p className="mb-3 line-clamp-2 text-sm text-neutral-600">
            {course.description}
          </p>
        )}
        <p className="font-bold text-neutral-900">
          {course.price_da.toLocaleString("ar-DZ")} دج
        </p>
      </div>
    </Link>
  );
}

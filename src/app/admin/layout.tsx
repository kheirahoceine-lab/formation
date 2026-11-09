import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">لوحة الأدمين</h1>
      <nav className="mb-6 flex gap-4 border-b border-neutral-200 pb-3 text-sm">
        <Link href="/admin/courses" className="hover:text-neutral-600">
          الدورات
        </Link>
        <Link href="/admin/payments" className="hover:text-neutral-600">
          الدفعات
        </Link>
      </nav>
      {children}
    </div>
  );
}

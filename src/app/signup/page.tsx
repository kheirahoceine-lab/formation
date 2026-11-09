import Link from "next/link";
import { signup } from "@/app/actions/auth";

export default async function SignupPage({
  searchParams,
}: PageProps<"/signup">) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">إنشاء حساب</h1>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={signup} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm">الاسم الكامل</label>
          <input
            type="text"
            name="full_name"
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">رقم الهاتف</label>
          <input
            type="tel"
            name="phone"
            placeholder="05xxxxxxxx"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">البريد الإلكتروني</label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">كلمة السر</label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <button className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700">
          إنشاء الحساب
        </button>
      </form>

      <p className="mt-4 text-sm text-neutral-600">
        عندك حساب؟{" "}
        <Link href="/login" className="font-medium text-neutral-900 underline">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  );
}

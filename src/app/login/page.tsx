import Link from "next/link";
import { login } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">تسجيل الدخول</h1>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={login} className="flex flex-col gap-4">
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
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <button className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700">
          دخول
        </button>
      </form>

      <p className="mt-4 text-sm text-neutral-600">
        ماعندكش حساب؟{" "}
        <Link href="/signup" className="font-medium text-neutral-900 underline">
          إنشاء حساب
        </Link>
      </p>
    </div>
  );
}

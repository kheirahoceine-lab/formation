import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";

export default async function Header() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  let dashboardHref = "/dashboard";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "admin") dashboardHref = "/admin";
    else if (profile?.role === "influencer") dashboardHref = "/influencer";
  }

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-neutral-900">
          منصة الدورات
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-neutral-600">
            الدورات
          </Link>
          {user ? (
            <>
              <Link href={dashboardHref} className="hover:text-neutral-600">
                لوحتي
              </Link>
              <form action={logout}>
                <button className="rounded-lg bg-neutral-100 px-3 py-1.5 hover:bg-neutral-200">
                  تسجيل الخروج
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-neutral-600">
                تسجيل الدخول
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-700"
              >
                إنشاء حساب
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

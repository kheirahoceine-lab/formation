import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // يحدّث جلسة تسجيل الدخول فـ cookies قبل ما تدخل الصفحة
  await supabase.auth.getUser();

  // تتبع رابط الإنفلونسر: ?ref=CODE
  const ref = request.nextUrl.searchParams.get("ref");
  if (ref) {
    const { data: influencer } = await supabase
      .from("influencers")
      .select("id")
      .eq("promo_code", ref)
      .eq("status", "approved")
      .maybeSingle();

    if (influencer) {
      await supabase.from("referral_visits").insert({ influencer_id: influencer.id });
      response.cookies.set("ref_code", ref, {
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "منصة الدورات التكوينية",
  description: "دورات تكوينية أونلاين للسوق الجزائري",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-tajawal)] bg-paper text-ink">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-neutral-200 py-6 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} منصة الدورات التكوينية — الجزائر
        </footer>
      </body>
    </html>
  );
}

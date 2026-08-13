import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileNav } from "@/components/mobile-nav";
import { AgeGate } from "@/components/age-gate";
import { BRAND, BRAND_TITLE } from "@/lib/site";

const notoSansJp = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-noto-sans-jp",
});

// 見出し・ブランド用の明朝体（和の佇まい）。JPグリフのため preload はしない。
const shipporiMincho = Shippori_Mincho({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-shippori-mincho",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://shisha-booking.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: BRAND_TITLE,
    template: `%s｜${BRAND.full}`,
  },
  applicationName: BRAND.full,
  description:
    "シーシャ屋で迷わない。日本中の「美味しい」ミックスと作り方が集まる、日本代表シーシャ図鑑 & コミュニティ。人気のミックスを探して、あなたのレシピも投稿しよう。",
  openGraph: {
    title: BRAND_TITLE,
    siteName: BRAND.full,
    description: "日本中の「美味しい」シーシャ ミックスと作り方が集まる、日本代表シーシャ図鑑コミュニティ。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_TITLE,
    description: "日本中の「美味しい」シーシャ ミックスと作り方が集まる、日本代表シーシャ図鑑コミュニティ。",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3ede1",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ageOk = (await cookies()).get("age_ok")?.value === "1";
  return (
    <html lang="ja" className={`${notoSansJp.variable} ${shipporiMincho.variable}`}>
      <body className="flex min-h-dvh flex-col pb-16 md:pb-0">
        <a href="#main" className="skip-link">本文へスキップ</a>
        <SiteHeader />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter />
        <MobileNav />
        {!ageOk && <AgeGate />}
        <Analytics />
      </body>
    </html>
  );
}

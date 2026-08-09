import type { Metadata, Viewport } from "next";
import { Outfit, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileNav } from "@/components/mobile-nav";
import { AgeGate } from "@/components/age-gate";

const outfit = Outfit({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

const notoSansJp = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-noto-sans-jp",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mixhub-jp.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "MixHub — シーシャのミックス図鑑",
  description:
    "シーシャ屋で迷わない。日本中の「美味しい」ミックスと作り方が集まる、シーシャのミックス図鑑 & コミュニティ。人気のミックスを探して、あなたのレシピも投稿しよう。",
  openGraph: {
    title: "MixHub — シーシャのミックス図鑑",
    description: "日本中の「美味しい」シーシャ ミックスと作り方が集まる図鑑コミュニティ。",
    type: "website",
    locale: "ja_JP",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MixHub — シーシャのミックス図鑑",
    description: "日本中の「美味しい」シーシャ ミックスと作り方が集まる図鑑コミュニティ。",
    images: ["/og-default.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f4ee",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ageOk = (await cookies()).get("age_ok")?.value === "1";
  return (
    <html lang="ja" className={`${outfit.variable} ${notoSansJp.variable}`}>
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

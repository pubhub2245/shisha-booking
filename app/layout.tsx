import type { Metadata } from "next";
import { Outfit, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileNav } from "@/components/mobile-nav";

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://shisha-booking.vercel.app";

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
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${outfit.variable} ${notoSansJp.variable}`}>
      <body className="flex min-h-dvh flex-col pb-16 md:pb-0">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <MobileNav />
      </body>
    </html>
  );
}

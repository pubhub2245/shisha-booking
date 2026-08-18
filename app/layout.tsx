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
    "1つのフレーバーを、どう作るか。ボウル・詰め方・HMD・炭・火入れ。実際に作られた作り方を試して、比べられます。",
  openGraph: {
    title: BRAND_TITLE,
    siteName: BRAND.full,
    description: "1つのフレーバーを、どう作るか。実際に作られた作り方を試して、比べられます。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_TITLE,
    description: "1つのフレーバーを、どう作るか。実際に作られた作り方を試して、比べられます。",
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

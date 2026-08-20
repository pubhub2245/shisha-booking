import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Shippori_Mincho, M_PLUS_1_Code } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileNav } from "@/components/mobile-nav";
import { AgeGate } from "@/components/age-gate";
import { MotionGuards } from "@/components/motion-guards";
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

// 記録・台帳の質感を出す等幅ラベル（ブランド名・件数・日付・ID）。JPグリフのため preload はしない。
const mplusCode = M_PLUS_1_Code({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-mplus-code",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://shisha-booking.vercel.app");

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
    // metadataBase は相対URLの解決にしか効かないため、url を明示しないと og:url タグ自体が出ない
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_TITLE,
    description: "1つのフレーバーを、どう作るか。実際に作られた作り方を試して、比べられます。",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3ede1" },
    { media: "(prefers-color-scheme: dark)", color: "#16130d" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ageOk = (await cookies()).get("age_ok")?.value === "1";
  return (
    <html lang="ja" className={`${notoSansJp.variable} ${shipporiMincho.variable} ${mplusCode.variable}`}>
      <body className="flex min-h-dvh flex-col pb-16 md:pb-0">
        <a href="#main" className="skip-link">本文へスキップ</a>
        <MotionGuards />
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
        <SiteFooter />
        <MobileNav />
        {!ageOk && <AgeGate />}
        <Analytics />
      </body>
    </html>
  );
}

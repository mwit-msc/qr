import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Thai-capable face — browsers fall back to this per-glyph for Thai text,
// keeping Latin in Geist and Thai legible.
const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "สร้าง QR โค้ด | MWIT LINK",
  description: "สร้าง QR โค้ดสวย ๆ พร้อมโลโก้ โดย mwit.link",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoThai.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

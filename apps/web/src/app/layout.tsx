import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Peta Belajar",
  description: "AI yang membantu menentukan arah belajar, bukan yang membuat siswa berhenti berpikir.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={manrope.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TopNav } from "@/components/TopNav";
import { DATA_SOURCE } from "@/lib/data";
import "./globals.css";

// next/font downloads the fonts once at build time and serves them from this app,
// so the browser never calls Google (works on bad hackathon wifi).
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Data Vault",
  description: "Keep all knowledge, at a fraction of the storage.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen font-sans text-sm">
        <TopNav isMock={DATA_SOURCE === "mock"} />
        <main>{children}</main>
      </body>
    </html>
  );
}

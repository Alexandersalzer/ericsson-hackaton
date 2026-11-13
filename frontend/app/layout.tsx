import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TopNav } from "@/components/TopNav";
import "./globals.css";

// next/font downloads Inter once at build time and serves it from this app,
// so the browser never calls Google (works on bad hackathon wifi).
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Data Vault",
  description: "Keep all knowledge, at a fraction of the storage.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen font-sans">
        <TopNav />
        <main>{children}</main>
      </body>
    </html>
  );
}

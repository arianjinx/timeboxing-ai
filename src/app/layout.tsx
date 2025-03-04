import type React from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Timeboxing AI - Daily Schedule",
  description: "Organize your day with AI-powered scheduling",
  openGraph: {
    title: "Timeboxing AI - Daily Schedule",
    description: "Organize your day with AI-powered scheduling",
    type: "website",
    siteName: "Timeboxing AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Timeboxing AI - Daily Schedule",
    description: "Organize your day with AI-powered scheduling",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}

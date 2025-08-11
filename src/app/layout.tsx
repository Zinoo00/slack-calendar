import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Team Calendar - Slack & Outlook Integration",
  description:
    "Beautiful team calendar app with Slack commands and Microsoft Outlook synchronization",
  keywords: [
    "calendar",
    "team",
    "slack",
    "outlook",
    "scheduling",
    "collaboration",
  ],
  authors: [{ name: "Team Calendar App" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

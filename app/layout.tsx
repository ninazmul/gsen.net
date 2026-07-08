import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
});

export const metadata: Metadata = {
  title: {
    default: "GSEN NET – Internet Service Provider Management System",
    template: "%s | GSEN NET",
  },

  description:
    "GSEN NET is a comprehensive management system for Internet Service Providers, handling customers, billing, expenses, and reports.",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_BD",
    siteName: "GSEN NET",
    title: "GSEN NET – Internet Service Provider Management System",
    description:
      "Manage your ISP business with GSEN NET - customers, billing, expenses, and reports in one place.",
    images: [
      {
        url: "/assets/images/logo.png",
        width: 1200,
        height: 630,
        alt: "GSEN NET",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "GSEN NET – Internet Service Provider Management System",
    description:
      "Comprehensive ISP management system for customers, billing, expenses, and reports.",
    images: ["/assets/images/logo.png"],
  },

  icons: {
    icon: "/assets/images/logo.png",
    apple: "/assets/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="light">
        <body className={`${inter.variable} ${dmSerif.variable} font-sans`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

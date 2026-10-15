import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rippl.network"),
  title: "Rippl: Causal Memory Layer for Autonomous Systems",
  description:
    "Rippl links every decision and agent action to the claims it relies on. Retract a claim and see everything that was standing on it.",
  keywords: [
    "causal memory",
    "FalkorDB",
    "decision provenance",
    "AI agent guardrails",
    "claim retraction",
    "GraphBLAS",
  ],
  authors: [{ name: "Anish Udupa" }],
  openGraph: {
    title: "Rippl: Causal Memory Layer for Autonomous Systems",
    description:
      "Rippl links every decision and agent action to the claims it relies on. Retract a claim and see everything that was standing on it.",
    url: "https://rippl.network",
    siteName: "Rippl",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rippl Causal Memory Layer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rippl: Causal Memory Layer for Autonomous Systems",
    description:
      "Rippl links every decision and agent action to the claims it relies on. Retract a claim and see everything that was standing on it.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full dark`}
    >
      <body className="min-h-full bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-zinc-200 antialiased m-0 p-0 border-0 outline-none">
        {children}
      </body>
    </html>
  );
}

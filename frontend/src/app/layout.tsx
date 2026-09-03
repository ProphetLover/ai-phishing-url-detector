import type { Metadata } from "next";
import { Inter, Poppins, IBM_Plex_Mono, Cairo } from "next/font/google";
import "./globals.css";
import { GlobalProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ToastProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-poppins" });
const ibmPlexMono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono" });
const cairo = Cairo({ weight: ["400", "500", "600", "700", "800"], subsets: ["arabic"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: "PhishGuard AI — AI-Powered URL Threat Detection",
  description: "Advanced machine learning models to detect phishing with high accuracy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" data-identity="cyber" dir="ltr" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} ${ibmPlexMono.variable} ${cairo.variable} font-body antialiased overflow-x-hidden w-full`}>
        <GlobalProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </GlobalProvider>
      </body>
    </html>
  );
}

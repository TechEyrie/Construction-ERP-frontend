import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { AppProviders } from "@/components/AppProviders";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-face"
});

export const metadata: Metadata = {
  title: "Owner Project Control Platform",
  description: "Owner-side construction project control",
  applicationName: "OPC",
  themeColor: "#0F1E2E",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OPC"
  },
  formatDetection: {
    telephone: false
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

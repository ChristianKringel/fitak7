import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono, Permanent_Marker, Rubik_Mono_One } from "next/font/google";

import { AppHeader } from "@/components/AppHeader";
import { APP_NAME } from "@/lib/game/config";

import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const permanentMarker = Permanent_Marker({
  variable: "--font-permanent-marker",
  subsets: ["latin"],
  weight: "400",
});

const rubikMono = Rubik_Mono_One({
  variable: "--font-rubik-mono",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description:
    "Adivinhe a música pelo trecho: rock gaúcho, música nativista, bandinhas, rock brasileiro e mais.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efe6d2" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0c0a" },
  ],
};

const fontVariables = [archivo, jetbrainsMono, permanentMarker, rubikMono]
  .map((font) => font.variable)
  .join(" ");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <AppHeader />
        <main className="mx-auto w-full max-w-md flex-1 px-5 pt-7 pb-12">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { cookies } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { getRestaurantJsonLd, getOrganizationJsonLd } from "@/lib/seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kfmdelice.sn";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "KFM Delice — Restaurant africain a Conakry | Commandez en ligne",
    template: "%s | KFM Delice",
  },
  description:
    "Restaurant africain a Conakry, Guinee. Commandez vos plats traditionnels guineens en ligne : Thiep bou dien, Yassa poulet, Mafe, Bissap. Livraison et a emporter. Paiement Mobile Money (Orange Money, MTN MoMo).",
  keywords: [
    "restaurant conakry",
    "restaurant guineen",
    "commander en ligne conakry",
    "thiep bou dien",
    "yassa poulet",
    "mafe guinee",
    "bissap",
    "livraison restaurant conakry",
    "mobile money guinee",
    "orange money",
    "mtn momo",
    "KFM Delice",
    "restaurant africain",
    "cuisine guineenne",
    "commande en ligne",
    "a emporter conakry",
  ],
  icons: {
    icon: "/logo.svg",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "KFM Delice — Restaurant africain a Conakry",
    description: "Decouvrez les saveurs authentiques de la Guinee. Thiep, Yassa, Mafe, Grillades et plus. Commandez en ligne avec livraison.",
    type: "website",
    locale: "fr_GN",
    url: APP_URL,
    siteName: "KFM Delice",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "KFM Delice — Restaurant africain a Conakry",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KFM Delice — Restaurant africain a Conakry",
    description: "Decouvrez les saveurs authentiques de la Guinee. Commandez en ligne !",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  authors: [{ name: "KFM Delice", url: APP_URL }],
  category: "food & drink",
  alternates: {
    canonical: APP_URL,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E85D04" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("kfm-locale")?.value || "fr";
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="geo.region" content="GN-C" />
        <meta name="geo.placename" content="Conakry, Guinee" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            {/* JSON-LD Structured Data for SEO */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(getRestaurantJsonLd()),
              }}
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(getOrganizationJsonLd()),
              }}
            />
            {children}
            <Toaster />
            <WhatsAppButton />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

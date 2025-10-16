import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SalonManager - Die moderne Salon-Software ohne Provisionen",
  description: "Verwaltung für Friseursalons, Kosmetikstudios und Beauty-Salons. Eigene Website, Online-Buchung, Terminkalender. 30 Tage kostenlos testen.",
  keywords: "Salon Software, Friseur Software, Terminbuchung, Online Buchungssystem, Salonverwaltung, Kundenverwaltung, Beauty Software",
  authors: [{ name: "SalonManager" }],
  creator: "SalonManager GmbH",
  publisher: "SalonManager GmbH",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://salonmanager.de",
    title: "SalonManager - Moderne Salon-Software ohne Provisionen",
    description: "Die All-in-One Lösung für Ihr Salon-Business. Ohne Provisionen, mit eigener Website. 30 Tage kostenlos testen.",
    siteName: "SalonManager",
  },
  twitter: {
    card: "summary_large_image",
    title: "SalonManager - Die moderne Salon-Software",
    description: "Verwaltung für Friseursalons. 30 Tage kostenlos testen.",
    creator: "@salonmanager",
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
  alternates: {
    canonical: "https://salonmanager.de",
  },
  category: "business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

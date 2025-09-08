import type React from "react"
import type { Metadata } from "next"
import { Open_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

// Backup font import
if (typeof document !== 'undefined') {
  const link = document.createElement('link')
  link.href = 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
}

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: "The Unsaid - Anonymous Messages to Loved Ones",
  description: "A collection of unsaid text messages to first loves, family members, friends, and others. The loudest words are the ones we never speak.",
  keywords: ["anonymous messages", "unsaid words", "emotional expression", "love letters", "unspoken thoughts"],
  authors: [{ name: "Ashwin Asthana" }],
  creator: "Ashwin Asthana",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://the-unsaid.vercel.app",
    siteName: "The Unsaid",
    title: "The Unsaid - Share Your Unspoken Words Anonymously",
    description: "A beautiful platform where people anonymously share messages they never sent to loved ones. Express your unspoken thoughts in a safe space.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Unsaid - Anonymous Messages Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@theUnsaidApp",
    creator: "@ashwinasthana",
    title: "The Unsaid - Share Your Unspoken Words",
    description: "Anonymous messages to first loves, family, and friends. The loudest words are the ones we never speak.",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${openSans.variable} font-sans antialiased`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}

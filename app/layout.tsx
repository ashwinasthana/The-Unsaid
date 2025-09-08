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
  title: "The Unsaid",
  description: "A space for thoughts that were never meant to be sent",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "The Unsaid",
    description: "A space for thoughts that were never meant to be sent",
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

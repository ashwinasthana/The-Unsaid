import type React from "react"
import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

// Backup font import
if (typeof document !== 'undefined') {
  const link = document.createElement('link')
  link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
}

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
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
      <body className={`${montserrat.variable} font-sans antialiased`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}

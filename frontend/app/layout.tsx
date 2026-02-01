import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { MusicProvider } from "@/context/music-context"
import { Toaster } from "@/components/ui/toaster"
import { AuthGuard } from "@/components/auth-guard"
import { FloatingWidget } from "@/components/floating-widget"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Painel do Harmonia",
  description: "Aplicação de reprodução de músicas",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        <AuthGuard>
          <MusicProvider>
            {children}
            <FloatingWidget />
            <Toaster />
          </MusicProvider>
        </AuthGuard>
      </body>
    </html>
  )
}
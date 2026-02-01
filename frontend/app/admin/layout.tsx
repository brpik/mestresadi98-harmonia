import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold mb-4 md:mb-0">Painel Administrativo - Harmonia</h1>
          <nav className="flex flex-wrap gap-2 md:gap-4 mt-2 md:mt-4">
            <Link href="/admin">
              <Button variant="secondary" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/categorias">
              <Button variant="secondary" size="sm">
                Categorias
              </Button>
            </Link>
            <Link href="/admin/musicas">
              <Button variant="secondary" size="sm">
                Músicas
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                Voltar ao Player
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-6">{children}</main>
      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>© {new Date().getFullYear()} Painel do Harmonia - Todos os direitos reservados</p>
      </footer>
    </div>
  )
}


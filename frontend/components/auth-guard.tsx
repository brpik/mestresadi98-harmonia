"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

const PASSWORD = "harmoniasadi123"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    // Verifica se está na página de login
    if (pathname === "/login") {
      setIsAuthenticated(true)
      return
    }

    // Verifica autenticação no localStorage (apenas no cliente)
    const authStatus = localStorage.getItem("harmonia_authenticated")
    const authTime = localStorage.getItem("harmonia_auth_time")

    if (authStatus === "true" && authTime) {
      // Verifica se a sessão não expirou (24 horas)
      const timeDiff = Date.now() - parseInt(authTime)
      const hoursDiff = timeDiff / (1000 * 60 * 60)

      if (hoursDiff < 24) {
        setIsAuthenticated(true)
        return
      } else {
        // Sessão expirada
        localStorage.removeItem("harmonia_authenticated")
        localStorage.removeItem("harmonia_auth_time")
      }
    }

    // Se não estiver autenticado, redireciona para login
    setIsAuthenticated(false)
    router.push("/login")
  }, [pathname, router, isMounted])

  // Mostra loading enquanto verifica autenticação ou não está montado
  if (!isMounted || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md p-4">
          <Skeleton className="h-16 w-16 rounded-full mx-auto bg-muted" />
          <Skeleton className="h-4 w-48 mx-auto bg-muted" />
          <Skeleton className="h-10 w-full bg-muted" />
        </div>
      </div>
    )
  }

  // Se não estiver autenticado, não renderiza nada (redirecionamento em andamento)
  if (isAuthenticated === false && pathname !== "/login") {
    return null
  }

  // Se estiver autenticado ou na página de login, renderiza o conteúdo
  return <>{children}</>
}

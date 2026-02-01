"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Lock } from "lucide-react"

const PASSWORD = "harmoniasadi123"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Simula um pequeno delay para melhor UX
    await new Promise(resolve => setTimeout(resolve, 300))

    if (password === PASSWORD) {
      // Armazena a autenticação no localStorage
      localStorage.setItem("harmonia_authenticated", "true")
      localStorage.setItem("harmonia_auth_time", Date.now().toString())
      router.push("/")
      router.refresh()
    } else {
      setError("Senha incorreta. Tente novamente.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Music className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Painel do Harmonia</CardTitle>
            <CardDescription className="mt-2">
              Digite a senha para acessar o painel
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                className="w-full"
                autoFocus
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !password}
              size="lg"
            >
              {isLoading ? "Verificando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

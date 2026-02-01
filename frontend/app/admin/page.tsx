"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { api } from "@/utils/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function AdminDashboard() {
  const [logo, setLogo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const fetchLogo = async () => {
      setLoading(true)
      try {
        // Corrigindo o endpoint para buscar o logo
        const response = await api.get("/config/logo")
        console.log("Logo response:", response.data)

        // Verifica se a resposta contém uma URL de logo
        if (response.data && response.data.logo) {
          // Corrige a construção da URL - remove /api/ se estiver presente no baseUrl
          const baseUrlWithoutApi = baseUrl.endsWith("/api") ? baseUrl.substring(0, baseUrl.length - 4) : baseUrl

          // Adiciona a baseURL se a URL não for absoluta
          const logoPath = response.data.logo
          let logoUrl

          if (typeof logoPath === "string") {
            if (logoPath.startsWith("http")) {
              logoUrl = logoPath
            } else {
              // Remove barras duplicadas e constrói o caminho correto
              logoUrl = `${baseUrlWithoutApi}/${logoPath.replace(/^\//, "")}`
            }

            console.log("URL da logo construída:", logoUrl)
            setLogo(logoUrl)
          }
        }
      } catch (error) {
        console.error("Erro ao buscar logo:", error)
        // Não exibimos toast aqui porque é comum não ter logo inicialmente
      } finally {
        setLoading(false)
      }
    }

    fetchLogo()
  }, [baseUrl])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação básica
    if (!file.type.includes("image/")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de imagem válido.",
        variant: "destructive",
      })
      return
    }

    const formData = new FormData()
    formData.append("logo", file)

    setUploading(true)
    try {
      const response = await api.post("/config/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      // Corrige a construção da URL - remove /api/ se estiver presente no baseUrl
      const baseUrlWithoutApi = baseUrl.endsWith("/api") ? baseUrl.substring(0, baseUrl.length - 4) : baseUrl

      // Adiciona a baseURL se a URL não for absoluta
      if (response.data && response.data.logo) {
        const logoPath = response.data.logo
        let logoUrl

        if (typeof logoPath === "string") {
          if (logoPath.startsWith("http")) {
            logoUrl = logoPath
          } else {
            // Remove barras duplicadas e constrói o caminho correto
            logoUrl = `${baseUrlWithoutApi}/${logoPath.replace(/^\//, "")}`
          }

          console.log("URL da logo construída após upload:", logoUrl)
          setLogo(logoUrl)
        }
      }

      toast({
        title: "Sucesso",
        description: "Logo atualizado com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao fazer upload do logo:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o logo. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Logo do Sistema</CardTitle>
            <CardDescription>Atualize o logo que será exibido no player de música</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 md:w-48 md:h-48 relative mb-4 border rounded-lg overflow-hidden">
                <Image src={logo || "/fallback-logo.png"} alt="Logo" fill className="object-cover" unoptimized />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="logo">Selecione uma nova imagem</Label>
                <Input
                  id="logo"
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? "Enviando..." : "Atualizar Logo"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento</CardTitle>
            <CardDescription>Acesse as áreas de gerenciamento do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" asChild>
              <a href="/admin/categorias">Gerenciar Categorias</a>
            </Button>
            <Button className="w-full" asChild>
              <a href="/admin/musicas">Gerenciar Músicas</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


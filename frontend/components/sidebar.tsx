"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useMusic } from "@/context/music-context"
import { api } from "@/utils/api"
import type { Category } from "@/context/music-context"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Music, 
  LogIn, 
  LogOut, 
  Coins, 
  Heart, 
  ArrowRightLeft, 
  Brain, 
  Plane,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export default function Sidebar() {
  const [logo, setLogo] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [musics, setMusics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const { selectedCategory, setSelectedCategory, searchQuery, setSearchQuery } = useMusic()
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""

  // Buscar músicas para calcular contador de busca
  useEffect(() => {
    const fetchMusics = async () => {
      if (!selectedCategory) return
      try {
        const response = await api.get(`/musicas/categoria/${selectedCategory}`)
        setMusics(response.data)
      } catch (error) {
        console.error("Erro ao buscar músicas:", error)
      }
    }
    fetchMusics()
  }, [selectedCategory])

  // Calcular músicas filtradas para o contador
  const filteredCount = musics.filter((music: any) =>
    music.titulo?.toLowerCase().includes(searchQuery.toLowerCase())
  ).length

  useEffect(() => {
    const fetchLogo = async () => {
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
        } else {
          // Se não houver logo, mantém null para usar o fallback
          setLogo(null)
        }
      } catch (error) {
        console.error("Erro ao buscar logo:", error)
        // Fallback logo será usado
        setLogo(null)
      }
    }

    const fetchCategories = async () => {
      try {
        const response = await api.get("/categorias")
        setCategories(response.data)
        if (response.data.length > 0 && !selectedCategory) {
          setSelectedCategory(response.data[0]._id)
        }
      } catch (error) {
        console.error("Erro ao buscar categorias:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogo()
    fetchCategories()
  }, [setSelectedCategory, selectedCategory, baseUrl])

  // Mapeamento de ícones para categorias
  const getCategoryIcon = (titulo: string) => {
    const titleLower = titulo.toLowerCase()
    if (titleLower.includes("entrada") || titleLower.includes("abertura")) return LogIn
    if (titleLower.includes("saída") || titleLower.includes("saida")) return LogOut
    if (titleLower.includes("bolsa") || titleLower.includes("proposta")) return Coins
    if (titleLower.includes("solidariedade") || titleLower.includes("tronco")) return Heart
    if (titleLower.includes("transição") || titleLower.includes("transicao")) return ArrowRightLeft
    if (titleLower.includes("meditação") || titleLower.includes("meditacao")) return Brain
    if (titleLower.includes("viagem") || titleLower.includes("viagens")) return Plane
    return Music
  }

  return (
    <div className="w-full md:w-64 md:min-h-screen bg-sidebar-background p-4 md:p-6 flex flex-col border-b md:border-r border-sidebar-border md:overflow-hidden">
      <div className="mb-6 flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0 ring-2 ring-primary/20">
            {loading ? (
              <Skeleton className="w-full h-full bg-muted" />
            ) : (
              <Image
                src={logo || "/placeholder-logo.png"}
                alt="Logo"
                width={48}
                height={48}
                className="object-cover"
                unoptimized
              />
            )}
          </div>
          <h1 className="text-sm md:text-base font-bold text-foreground">Painel do Harmonia</h1>
        </div>
        {/* Botão de busca - Mobile apenas */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9"
          onClick={() => setSearchDialogOpen(true)}
        >
          <Search className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      <div className="flex-1">
        <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Categorias</h2>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full bg-muted" />
            ))}
          </div>
        ) : (
          <div className="flex md:block overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0 scrollbar-hide">
            <ul className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1.5 min-w-max md:min-w-0">
              {categories.map((category, index) => {
                const Icon = getCategoryIcon(category.titulo)
                const isActive = selectedCategory === category._id
                const isLast = index === categories.length - 1
                return (
                  <li key={category._id} className={`flex-shrink-0 ${isLast ? 'pr-4 md:pr-0' : ''}`}>
                    <button
                      onClick={() => setSelectedCategory(category._id)}
                      className={`w-full whitespace-nowrap md:whitespace-normal text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3 group ${
                        isActive
                          ? "bg-primary/10 text-primary border-l-2 border-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                      <span className="text-sm font-medium">{category.titulo}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Dialog de Busca - Mobile */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buscar Músicas</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder="Buscar músicas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 bg-card border-border"
                autoFocus
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-3">
                {filteredCount} {filteredCount === 1 ? "resultado encontrado" : "resultados encontrados"}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


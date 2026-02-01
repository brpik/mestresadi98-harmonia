"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useMusic, type Music, type Category } from "@/context/music-context"
import { api } from "@/utils/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Play, Pause, ChevronLeft, ChevronRight, MusicIcon, Search, Info } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { abbreviateText } from "@/utils/string-utils"
import { useIsMobile } from "@/hooks/use-mobile"

export default function MusicList() {
  const [musics, setMusics] = useState<Music[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedMusicForDetails, setSelectedMusicForDetails] = useState<Music | null>(null)
  const isMobile = useIsMobile()
  const itemsPerPage = isMobile ? 6 : 20 // 6 no mobile, 20 no desktop
  const lastListRef = useRef<string>("")

  const { currentMusic, isPlaying, audioRef, selectedCategory, setSelectedCategory, playMusic, pauseMusic, setMusicList, searchQuery, setSearchQuery } = useMusic()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categorias")
        setCategories(response.data)
      } catch (error) {
        console.error("Erro ao buscar categorias:", error)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchMusics = async () => {
      if (!selectedCategory) return

      setLoading(true)
      try {
        const response = await api.get(`/musicas/categoria/${selectedCategory}`)
        console.log("Músicas recebidas:", response.data)

        // Processa as músicas para usar o campo caminho em vez de arquivo
        const processedMusics = response.data.map((music: any) => {
          // Cria uma cópia segura do objeto música
          const musicCopy = { ...music }

          // Verifica se caminho existe e não é undefined
          if (musicCopy.caminho) {
            // Adiciona o campo arquivo para compatibilidade com o resto do código
            musicCopy.arquivo = musicCopy.caminho
            console.log(`Música encontrada: ${musicCopy.titulo}, caminho: ${musicCopy.caminho}`)
          } else {
            console.warn(`Música sem caminho: ${musicCopy.titulo || "Desconhecida"}`)
          }

          return musicCopy
        })

        setMusics(processedMusics)
        setMusicList(processedMusics) // Atualiza a lista no contexto para navegação
        setCurrentPage(1)
      } catch (error) {
        console.error("Erro ao buscar músicas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMusics()
  }, [selectedCategory])

  const handlePlay = async (music: Music) => {
    // Verifica se o arquivo ou caminho existe
    if (!music.arquivo && !music.caminho) {
      console.error("Tentativa de reproduzir música sem arquivo/caminho:", music)
      return
    }

    // Usa a função centralizada do contexto para reproduzir a música
    playMusic(music)
  }

  const handleSelectMusic = (music: Music) => {
    // Verifica se o arquivo ou caminho existe
    if (!music.arquivo && !music.caminho) {
      console.error("Tentativa de selecionar música sem arquivo/caminho:", music)
      return
    }

    // Se a música já estiver tocando, pausa. Caso contrário, toca a música
    if (currentMusic?._id === music._id && isPlaying) {
      pauseMusic()
    } else {
      playMusic(music)
    }
  }

  // Filtro de busca - memoizado para evitar recálculos desnecessários
  const filteredMusics = useMemo(() => {
    return musics.filter((music) =>
      music.titulo.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [musics, searchQuery])

  // Atualiza a lista no contexto quando há busca ou quando as músicas mudam
  useEffect(() => {
    // Cria uma string única baseada nos IDs para comparar
    const currentIds = filteredMusics.map(m => m._id).sort().join(',')
    
    // Só atualiza se a lista realmente mudou
    if (currentIds !== lastListRef.current) {
      lastListRef.current = currentIds
      setMusicList(filteredMusics)
    }
  }, [filteredMusics, setMusicList])

  // Pagination logic
  const totalPages = Math.ceil(filteredMusics.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentMusics = filteredMusics.slice(startIndex, endIndex)

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Encontrar o nome da categoria atual
  const currentCategoryName = categories.find(cat => cat._id === selectedCategory)?.titulo || ""

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      {/* Header Fixo - Apenas Desktop */}
      <div className="hidden md:flex flex-shrink-0 p-4 md:p-6 bg-background border-b border-border/50">
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {currentCategoryName || "Selecione uma categoria"}
            </h1>
            {/* Botão de busca - Desktop */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSearchDialogOpen(true)}
            >
              <Search className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredMusics.length} {filteredMusics.length === 1 ? "música disponível" : "músicas disponíveis"}
          </p>
        </div>
      </div>

          {/* Lista de Músicas - Scrollável em Grid */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-24 md:pb-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {Array(10)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 p-4 rounded-xl bg-card/50"
                >
                  <Skeleton className="h-32 w-full rounded-lg bg-muted aspect-square" />
                  <Skeleton className="h-4 w-full bg-muted" />
                  <Skeleton className="h-3 w-2/3 bg-muted" />
                </div>
              ))}
          </div>
        ) : currentMusics.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {currentMusics.map((music) => {
              const isCurrentPlaying = currentMusic?._id === music._id && isPlaying
              return (
                <div
                  key={music._id}
                  className={`group flex flex-col gap-3 p-4 rounded-xl transition-all duration-200 relative overflow-hidden ${
                    isCurrentPlaying
                      ? "bg-primary/15 border-2 border-primary shadow-lg shadow-primary/30 ring-2 ring-primary/20"
                      : "bg-card/40 hover:bg-card/60 border-2 border-transparent hover:border-primary/30"
                  }`}
                >
                  {/* Capa/Visualizer */}
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                    {isCurrentPlaying && isPlaying ? (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center gap-1 p-4">
                          {[1, 2, 3, 2, 1].map((height, i) => (
                            <div
                              key={i}
                              className="w-1 bg-primary rounded-full animate-pulse"
                              style={{
                                height: `${30 + height * 10}%`,
                                animationDelay: `${i * 150}ms`,
                              }}
                            />
                          ))}
                        </div>
                        {/* Botão de pause sempre visível quando tocando */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Button
                            className="h-12 w-12 p-0 rounded-full bg-primary hover:bg-primary/90 flex-shrink-0 shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectMusic(music)
                            }}
                            size="icon"
                          >
                            <Pause className="h-6 w-6 text-primary-foreground" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <MusicIcon className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground/50" />
                        </div>
                        {/* Botão de play no hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            className="h-12 w-12 p-0 rounded-full bg-primary hover:bg-primary/90 flex-shrink-0 shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectMusic(music)
                            }}
                            size="icon"
                          >
                            <Play className="h-6 w-6 text-primary-foreground ml-0.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Info da música */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 
                        className={`font-bold text-sm md:text-base line-clamp-2 flex-1 ${
                          isCurrentPlaying ? "text-primary" : "text-foreground"
                        }`}
                        title={music.titulo}
                      >
                        {music.titulo}
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedMusicForDetails(music)
                          setDetailsDialogOpen(true)
                        }}
                        title="Ver detalhes"
                      >
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                    {isCurrentPlaying && (
                      <p className="text-xs text-primary/70 font-medium">Tocando agora</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <MusicIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhuma música encontrada nesta categoria</p>
          </div>
        )}
      </div>

          {/* Paginação Fixa no Bottom */}
          {totalPages > 1 && (
            <div className="flex-shrink-0 flex justify-center items-center gap-4 p-4 md:p-6 pb-24 md:pb-6 bg-background border-t border-border/50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="border-muted hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="border-muted hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Dialog de Busca - Desktop */}
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
                {filteredMusics.length} {filteredMusics.length === 1 ? "resultado encontrado" : "resultados encontrados"}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes da Música */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Música</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedMusicForDetails ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Título</p>
                  <p className="text-base text-foreground break-words">{selectedMusicForDetails.titulo}</p>
                </div>
                {selectedMusicForDetails.categoria && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Categoria</p>
                    <p className="text-base text-foreground">{selectedMusicForDetails.categoria}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma música selecionada</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


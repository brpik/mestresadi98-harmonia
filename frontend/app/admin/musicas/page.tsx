"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import { api } from "@/utils/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pencil,
  Trash2,
  Plus,
  Save,
  X,
  Upload,
  Link,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  XIcon,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Music as MusicType, Category } from "@/context/music-context"

// Estendendo a interface Music para lidar com diferentes formatos de categoria
interface ExtendedMusic extends MusicType {
  categoria:
    | string
    | { $oid: string }
    | {
        _id: string
        titulo: string
        dataCriacao?: string
        __v?: number
      }
}

export default function MusicasPage() {
  const [musics, setMusics] = useState<ExtendedMusic[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingMusic, setIsAddingMusic] = useState(false)
  const [addStatus, setAddStatus] = useState<{
    status: "idle" | "success" | "error"
    message: string
  }>({ status: "idle", message: "" })
  const [newMusic, setNewMusic] = useState({
    titulo: "",
    categoria: "",
    youtubeUrl: "",
  })
  const [uploadMethod, setUploadMethod] = useState<"file" | "youtube">("file")
  const [editingMusic, setEditingMusic] = useState<string | null>(null)
  const [editData, setEditData] = useState({
    titulo: "",
    categoria: "",
  })

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Estados para filtros
  const [filterTitle, setFilterTitle] = useState("")
  const [filterCategory, setFilterCategory] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
    fetchMusics()
  }, [])

  // Limpar o status após 5 segundos
  useEffect(() => {
    if (addStatus.status !== "idle") {
      const timer = setTimeout(() => {
        setAddStatus({ status: "idle", message: "" })
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [addStatus])

  // Reset para a primeira página quando os filtros mudam
  useEffect(() => {
    setCurrentPage(1)
  }, [filterTitle, filterCategory])

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categorias")
      setCategories(response.data)
      if (response.data.length > 0 && !newMusic.categoria) {
        setNewMusic((prev) => ({ ...prev, categoria: response.data[0]._id }))
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias.",
        variant: "destructive",
      })
    }
  }

  const fetchMusics = async () => {
    setLoading(true)
    try {
      const response = await api.get("/musicas")
      console.log("Músicas recebidas:", response.data)
      setMusics(response.data)
    } catch (error) {
      console.error("Erro ao buscar músicas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as músicas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMusic = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isAddingMusic) return // Evita múltiplos envios

    if (!newMusic.titulo.trim() || !newMusic.categoria) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setIsAddingMusic(true)
    setAddStatus({ status: "idle", message: "" })

    try {
      let response

      if (uploadMethod === "file") {
        const file = fileInputRef.current?.files?.[0]
        if (!file) {
          toast({
            title: "Erro",
            description: "Selecione um arquivo de áudio.",
            variant: "destructive",
          })
          setIsAddingMusic(false)
          return
        }

        // Validação básica do arquivo
        if (!file.type.includes("audio/")) {
          toast({
            title: "Erro",
            description: "Por favor, selecione um arquivo de áudio válido.",
            variant: "destructive",
          })
          setIsAddingMusic(false)
          return
        }

        const formData = new FormData()
        formData.append("titulo", newMusic.titulo)
        formData.append("categoria", newMusic.categoria)
        formData.append("arquivo", file)

        response = await api.post("/musicas", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
      } else {
        // Upload via YouTube
        if (!newMusic.youtubeUrl.trim()) {
          toast({
            title: "Erro",
            description: "Insira um link do YouTube válido.",
            variant: "destructive",
          })
          setIsAddingMusic(false)
          return
        }

        // Validação básica do link do YouTube
        if (!isValidYoutubeUrl(newMusic.youtubeUrl)) {
          toast({
            title: "Erro",
            description: "Por favor, insira um link válido do YouTube.",
            variant: "destructive",
          })
          setIsAddingMusic(false)
          return
        }

        response = await api.post("/musicas/youtube", {
          url: newMusic.youtubeUrl,
          titulo: newMusic.titulo,
          categoria: newMusic.categoria,
        })
      }

      setMusics([...musics, response.data])
      setNewMusic({
        titulo: "",
        categoria: categories[0]?._id || "",
        youtubeUrl: "",
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      setAddStatus({
        status: "success",
        message: `Música "${response.data.titulo}" adicionada com sucesso!`,
      })

      toast({
        title: "Sucesso",
        description: "Música adicionada com sucesso!",
      })
    } catch (error: any) {
      console.error("Erro ao criar música:", error)
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || "Erro desconhecido ao criar música"

      setAddStatus({
        status: "error",
        message: errorMessage,
      })

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsAddingMusic(false)
    }
  }

  const isValidYoutubeUrl = (url: string) => {
    // Regex simples para validar URLs do YouTube
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/
    return youtubeRegex.test(url)
  }

  // Função para extrair o ID da categoria
  const getCategoryId = (categoria: ExtendedMusic["categoria"]): string => {
    if (typeof categoria === "string") {
      return categoria
    } else if ("$oid" in categoria) {
      return categoria.$oid
    } else if ("_id" in categoria) {
      return categoria._id
    }
    return ""
  }

  // Atualize a função handleEditMusic para lidar com o novo formato
  const handleEditMusic = (music: ExtendedMusic) => {
    setEditingMusic(music._id)

    // Extrair o ID da categoria, independentemente do formato
    const categoriaId = getCategoryId(music.categoria)

    setEditData({
      titulo: music.titulo,
      categoria: categoriaId,
    })
  }

  const handleSaveEdit = async () => {
    if (!editData.titulo.trim() || !editData.categoria || !editingMusic) return

    try {
      await api.put(`/musicas/${editingMusic}`, editData)

      // Atualiza a lista de músicas
      setMusics(
        musics.map((music) =>
          music._id === editingMusic
            ? {
                ...music,
                titulo: editData.titulo,
                categoria: editData.categoria,
              }
            : music,
        ),
      )
      setEditingMusic(null)
      toast({
        title: "Sucesso",
        description: "Música atualizada com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao editar música:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a música.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMusic = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta música?")) return

    try {
      await api.delete(`/musicas/${id}`)
      setMusics(musics.filter((music) => music._id !== id))
      toast({
        title: "Sucesso",
        description: "Música excluída com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao excluir música:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a música.",
        variant: "destructive",
      })
    }
  }

  // Atualize a função getCategoryName para lidar com o novo formato
  const getCategoryName = (categoria: ExtendedMusic["categoria"]) => {
    // Se a categoria for uma string, busca pelo ID
    if (typeof categoria === "string") {
      const category = categories.find((cat) => cat._id === categoria)
      return category?.titulo || "Categoria não encontrada"
    }

    // Se a categoria for um objeto com $oid, busca pelo ID
    if (categoria && "$oid" in categoria) {
      const categoriaId = categoria.$oid
      const category = categories.find((cat) => cat._id === categoriaId)
      return category?.titulo || "Categoria não encontrada"
    }

    // Se a categoria for um objeto completo com _id e titulo
    if (categoria && "_id" in categoria && "titulo" in categoria) {
      return categoria.titulo
    }

    return "Categoria não encontrada"
  }

  // Função para limpar os filtros
  const clearFilters = () => {
    setFilterTitle("")
    setFilterCategory("")
  }

  // Filtragem de músicas com base nos critérios
  const filteredMusics = useMemo(() => {
    return musics.filter((music) => {
      // Filtro por título
      const titleMatch = filterTitle ? music.titulo.toLowerCase().includes(filterTitle.toLowerCase()) : true

      // Filtro por categoria
      const categoryMatch = filterCategory ? getCategoryId(music.categoria) === filterCategory : true

      return titleMatch && categoryMatch
    })
  }, [musics, filterTitle, filterCategory])

  // Paginação
  const totalItems = filteredMusics.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const currentItems = filteredMusics.slice(startIndex, endIndex)

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl md:text-3xl font-bold">Gerenciar Músicas</h1>

      <Card>
        <CardHeader>
          <CardTitle>Nova Música</CardTitle>
        </CardHeader>
        <CardContent>
          {addStatus.status !== "idle" && (
            <Alert
              className={`mb-4 ${
                addStatus.status === "success"
                  ? "bg-green-50 text-green-800 border-green-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {addStatus.status === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertTitle>{addStatus.status === "success" ? "Sucesso" : "Erro"}</AlertTitle>
              </div>
              <AlertDescription>{addStatus.message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleCreateMusic} className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="titulo">Título</label>
              <Input
                id="titulo"
                placeholder="Nome da música"
                value={newMusic.titulo}
                onChange={(e) => setNewMusic({ ...newMusic, titulo: e.target.value })}
                disabled={isAddingMusic}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="categoria">Categoria</label>
              <Select
                value={newMusic.categoria}
                onValueChange={(value) => setNewMusic({ ...newMusic, categoria: value })}
                disabled={isAddingMusic}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label>Método de Upload</label>
              <Tabs
                defaultValue="file"
                onValueChange={(value) => setUploadMethod(value as "file" | "youtube")}
                disabled={isAddingMusic}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file" className="flex items-center gap-2" disabled={isAddingMusic}>
                    <Upload className="h-4 w-4" />
                    <span>Upload de arquivo</span>
                  </TabsTrigger>
                  <TabsTrigger value="youtube" className="flex items-center gap-2" disabled={isAddingMusic}>
                    <Link className="h-4 w-4" />
                    <span>Link do YouTube</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="file" className="pt-4">
                  <div className="grid gap-2">
                    <label htmlFor="arquivo">Arquivo de Áudio</label>
                    <Input id="arquivo" type="file" ref={fileInputRef} accept="audio/*" disabled={isAddingMusic} />
                  </div>
                </TabsContent>
                <TabsContent value="youtube" className="pt-4">
                  <div className="grid gap-2">
                    <label htmlFor="youtubeUrl">Link do YouTube</label>
                    <Input
                      id="youtubeUrl"
                      placeholder="https://youtube.com/watch?v=..."
                      value={newMusic.youtubeUrl}
                      onChange={(e) => setNewMusic({ ...newMusic, youtubeUrl: e.target.value })}
                      disabled={isAddingMusic}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <Button type="submit" disabled={isAddingMusic} className="w-full">
              {isAddingMusic ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando música...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Música
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Músicas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="mb-6 space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filtros
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="filterTitle" className="text-sm">
                  Título da Música
                </label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    id="filterTitle"
                    placeholder="Buscar por título..."
                    value={filterTitle}
                    onChange={(e) => setFilterTitle(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="filterCategory" className="text-sm">
                  Categoria
                </label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(filterTitle || filterCategory) && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-1">
                <XIcon className="h-3 w-3" /> Limpar filtros
              </Button>
            )}
          </div>

          {loading ? (
            <p>Carregando músicas...</p>
          ) : filteredMusics.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="w-[200px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((music) => (
                      <TableRow key={music._id}>
                        <TableCell>
                          {editingMusic === music._id ? (
                            <Input
                              value={editData.titulo}
                              onChange={(e) => setEditData({ ...editData, titulo: e.target.value })}
                              autoFocus
                            />
                          ) : (
                            music.titulo
                          )}
                        </TableCell>
                        <TableCell>
                          {editingMusic === music._id ? (
                            <Select
                              value={editData.categoria}
                              onValueChange={(value) => setEditData({ ...editData, categoria: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category._id} value={category._id}>
                                    {category.titulo}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            getCategoryName(music.categoria)
                          )}
                        </TableCell>
                        <TableCell>
                          {editingMusic === music._id ? (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={handleSaveEdit}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingMusic(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditMusic(music)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteMusic(music._id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                <div className="text-sm text-gray-500">
                  Mostrando {startIndex + 1}-{endIndex} de {totalItems} músicas
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(itemsPerPage)}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Itens por página" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 por página</SelectItem>
                      <SelectItem value="10">10 por página</SelectItem>
                      <SelectItem value="20">20 por página</SelectItem>
                      <SelectItem value="50">50 por página</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-2">
                      {currentPage} / {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center py-4">
              {filterTitle || filterCategory
                ? "Nenhuma música encontrada com os filtros aplicados"
                : "Nenhuma música encontrada"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { api } from "@/utils/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, Plus, Save, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Category } from "@/context/music-context"

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategoryTitle, setNewCategoryTitle] = useState("")
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await api.get("/categorias")
      setCategories(response.data)
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryTitle.trim()) {
      toast({
        title: "Erro",
        description: "O título da categoria não pode estar vazio.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await api.post("/categorias", { titulo: newCategoryTitle })
      setCategories([...categories, response.data])
      setNewCategoryTitle("")
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao criar categoria:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar a categoria.",
        variant: "destructive",
      })
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category._id)
    setEditTitle(category.titulo)
  }

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editingCategory) return

    try {
      await api.put(`/categorias/${editingCategory}`, { titulo: editTitle })
      setCategories(categories.map((cat) => (cat._id === editingCategory ? { ...cat, titulo: editTitle } : cat)))
      setEditingCategory(null)
      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao editar categoria:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a categoria.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return

    try {
      await api.delete(`/categorias/${id}`)
      setCategories(categories.filter((cat) => cat._id !== id))
      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao excluir categoria:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a categoria.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl md:text-3xl font-bold">Gerenciar Categorias</h1>

      <Card>
        <CardHeader>
          <CardTitle>Nova Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Nome da categoria"
              value={newCategoryTitle}
              onChange={(e) => setNewCategoryTitle(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleCreateCategory} className="mt-2 sm:mt-0">
              <Plus className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorias Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando categorias...</p>
          ) : categories.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead className="w-[200px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell>
                        {editingCategory === category._id ? (
                          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus />
                        ) : (
                          category.titulo
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCategory === category._id ? (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={handleSaveEdit}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingCategory(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditCategory(category)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteCategory(category._id)}>
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
          ) : (
            <p className="text-center py-4">Nenhuma categoria encontrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


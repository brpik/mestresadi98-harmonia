"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Keyboard, X, ArrowUp, ArrowDown, Space, ChevronDown } from "lucide-react"

export function FloatingWidget() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      {/* Widget Flutuante - Apenas Desktop */}
      <div className="hidden md:block fixed bottom-28 right-6 z-40 pointer-events-none">
        <div className="pointer-events-auto">
          {!isExpanded ? (
            <Button
              onClick={() => setIsExpanded(true)}
              className="h-8 px-3 rounded-full bg-card border border-border hover:bg-card/80 shadow-lg text-xs gap-1.5"
              variant="outline"
            >
              <Keyboard className="h-3 w-3" />
              <span>Ver atalhos</span>
            </Button>
          ) : (
            <div className="bg-card border border-border rounded-lg shadow-xl w-56 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
              {/* Header */}
              <div className="bg-primary/10 border-b border-border p-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Keyboard className="h-3.5 w-3.5 text-primary" />
                  <h3 className="font-semibold text-[10px] text-foreground">Atalhos</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-2 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <ArrowUp className="h-2.5 w-2.5" />
                  <span>Aumentar volume</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <ArrowDown className="h-2.5 w-2.5" />
                  <span>Diminuir volume</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Space className="h-2.5 w-2.5" />
                  <span>Pausar/Retomar</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="h-4 w-4 rounded border border-muted-foreground/30 flex items-center justify-center text-[8px] font-semibold">
                    S
                  </div>
                  <span>Saída gradual</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

"use client"

import { useEffect, useRef } from "react"
import { useMusic } from "@/context/music-context"
import { useToast } from "@/hooks/use-toast"

export function useKeyboardShortcuts() {
  const { currentMusic, isPlaying, volume, setVolume, playMusic, pauseMusic, audioRef, fadeIn, fadeOut } = useMusic()
  const { toast } = useToast()
  const volumeToastRef = useRef<{ dismiss: () => void } | null>(null)

  useEffect(() => {
    const handleKeyPress = async (e: KeyboardEvent) => {
      // Ignora se estiver digitando em um input, textarea ou elemento editável
      const target = e.target as HTMLElement
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.getAttribute("contenteditable") === "true"
      ) {
        return
      }

      // Ignora se estiver em um dialog/modal aberto (exceto se for o player)
      if (target.closest('[role="dialog"]') && !target.closest('[data-player-dialog]')) {
        return
      }

      // Seta para cima: aumentar volume
      if (e.key === "ArrowUp") {
        e.preventDefault()
        e.stopPropagation()
        const newVolume = Math.min(1, volume + 0.05)
        setVolume(newVolume)
        
        // Feedback visual
        if (volumeToastRef.current) {
          volumeToastRef.current.dismiss()
        }
        volumeToastRef.current = toast({
          title: `Volume: ${Math.round(newVolume * 100)}%`,
          duration: 1000,
        })
        return
      }

      // Seta para baixo: diminuir volume
      if (e.key === "ArrowDown") {
        e.preventDefault()
        e.stopPropagation()
        const newVolume = Math.max(0, volume - 0.05)
        setVolume(newVolume)
        
        // Feedback visual
        if (volumeToastRef.current) {
          volumeToastRef.current.dismiss()
        }
        volumeToastRef.current = toast({
          title: `Volume: ${Math.round(newVolume * 100)}%`,
          duration: 1000,
        })
        return
      }

      // Barra de espaço: pausar/tocar (mas só se não estiver em um input)
      if (e.key === " " && currentMusic) {
        e.preventDefault()
        e.stopPropagation()
        if (isPlaying) {
          pauseMusic()
        } else {
          // Retoma a música com fade in
          console.log("Retomando música via tecla de espaço...")
          
          // Feedback visual de retorno gradual
          toast({
            title: "Retorno gradual da música",
            duration: 2000,
          })
          
          await playMusic(currentMusic, true)
          
          // Aplica fade in após iniciar a reprodução
          await new Promise(resolve => setTimeout(resolve, 300))
          
          if (audioRef.current) {
            // Verifica se o áudio está pronto
            if (audioRef.current.readyState >= 2) {
              console.log("Áudio pronto, iniciando fade in (tecla espaço)...")
              await fadeIn(undefined, 3)
            } else {
              console.log("Aguardando áudio ficar pronto (tecla espaço)...")
              // Se o áudio ainda não estiver pronto, aguarda o evento canplay
              const canPlayPromise = new Promise<void>((resolve) => {
                if (!audioRef.current) {
                  resolve()
                  return
                }
                
                const handleCanPlay = () => {
                  console.log("Áudio ficou pronto, iniciando fade in (tecla espaço)...")
                  audioRef.current?.removeEventListener('canplay', handleCanPlay)
                  resolve()
                }
                
                // Se já estiver pronto, resolve imediatamente
                if (audioRef.current.readyState >= 2) {
                  resolve()
                  return
                }
                
                audioRef.current.addEventListener('canplay', handleCanPlay)
                
                // Timeout de segurança
                setTimeout(() => {
                  audioRef.current?.removeEventListener('canplay', handleCanPlay)
                  resolve()
                }, 2000)
              })
              
              await canPlayPromise
              if (audioRef.current) {
                await fadeIn(undefined, 3)
              }
            }
          }
        }
      }

      // Tecla S: saída gradual de música (fade out)
      if ((e.key === "s" || e.key === "S") && currentMusic && isPlaying) {
        e.preventDefault()
        e.stopPropagation()
        console.log("Fade out via tecla S...")
        
        // Feedback visual de saída gradual
        toast({
          title: "Saída gradual da música",
          duration: 2000,
        })
        
        await fadeOut(5)
      }
    }

    // Adiciona o listener no document e window para capturar eventos em qualquer lugar
    // Usa capture phase para interceptar antes de outros handlers
    document.addEventListener("keydown", handleKeyPress, true)
    window.addEventListener("keydown", handleKeyPress, true)
    
    return () => {
      document.removeEventListener("keydown", handleKeyPress, true)
      window.removeEventListener("keydown", handleKeyPress, true)
    }
  }, [currentMusic, isPlaying, volume, setVolume, playMusic, pauseMusic, audioRef, fadeIn, fadeOut, toast])
}

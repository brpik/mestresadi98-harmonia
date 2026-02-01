"use client"

import type React from "react"

import { createContext, useContext, useState, type ReactNode, useRef, useEffect, useCallback } from "react"

// Atualize as interfaces para refletir a estrutura correta do MongoDB
export interface Music {
  _id: string
  titulo: string
  categoria: string
  caminho?: string // Campo correto retornado pela API
  arquivo?: string // Campo que usamos internamente
}

export interface Category {
  _id: string
  titulo: string
}

interface MusicContextType {
  currentMusic: Music | null
  setCurrentMusic: (music: Music) => void
  isPlaying: boolean
  setIsPlaying: (isPlaying: boolean) => void
  volume: number
  setVolume: (volume: number) => void
  audioRef: React.RefObject<HTMLAudioElement>
  selectedCategory: string
  setSelectedCategory: (categoryId: string) => void
  playMusic: (music: Music, continuePlayback?: boolean) => Promise<void>
  pauseMusic: () => void
  fadeOut: (durationSeconds?: number) => Promise<void>
  fadeIn: (targetVolume?: number, durationSeconds?: number) => Promise<void>
  musicList: Music[]
  setMusicList: (musics: Music[]) => void
  nextMusic: () => void
  previousMusic: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const MusicContext = createContext<MusicContextType | undefined>(undefined)

export function MusicProvider({ children }: { children: ReactNode }) {
  const [currentMusic, setCurrentMusic] = useState<Music | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [savedVolume, setSavedVolume] = useState(0.7) // Volume salvo antes do fade in
  const [selectedCategory, setSelectedCategory] = useState("")
  const [musicList, setMusicList] = useState<Music[]>([]) // Lista de músicas da categoria atual
  const [searchQuery, setSearchQuery] = useState("") // Query de busca
  const [isPlayPending, setIsPlayPending] = useState(false)
  const [isFadingIn, setIsFadingIn] = useState(false) // Flag para indicar que está fazendo fade in
  const audioRef = useRef<HTMLAudioElement>(null)

  // Função centralizada para reproduzir música
  const playMusic = useCallback(
    async (music: Music, continuePlayback = false) => {
      // Evita múltiplas chamadas simultâneas
      if (isPlayPending) return

      setIsPlayPending(true)

      try {
        // Se for uma música diferente da atual, para a reprodução atual primeiro
        if (!continuePlayback && currentMusic && currentMusic._id !== music._id && isPlaying && audioRef.current) {
          audioRef.current.pause()
        }

        // Atualiza a música atual apenas se for uma nova música
        if (!continuePlayback || currentMusic?._id !== music._id) {
          setCurrentMusic(music)
        }

        // Aguarda um momento para garantir que o estado foi atualizado
        await new Promise((resolve) => setTimeout(resolve, 50))

        if (audioRef.current) {
          // Se for continuar a reprodução e for a mesma música, não redefine o src
          if (!(continuePlayback && currentMusic?._id === music._id)) {
            // Usa o campo arquivo ou caminho, dependendo de qual estiver disponível
            const audioPath = music.arquivo || music.caminho

            if (!audioPath) {
              throw new Error("Caminho de áudio não disponível")
            }

            // Certifique-se de que o src está definido corretamente
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""

            // Corrige a construção da URL - remove /api/ se estiver presente no baseUrl
            const baseUrlWithoutApi = baseUrl.endsWith("/api") ? baseUrl.substring(0, baseUrl.length - 4) : baseUrl

            // Constrói a URL completa
            let fullPath
            if (audioPath.startsWith("http")) {
              fullPath = audioPath
            } else {
              // Remove barras duplicadas e constrói o caminho correto
              fullPath = `${baseUrlWithoutApi}/${audioPath.replace(/^\//, "")}`
            }

            console.log("URL do áudio construída:", fullPath)

            audioRef.current.src = fullPath
            audioRef.current.load()
          }

          console.log("Tentando reproduzir:", continuePlayback ? "Continuando de onde parou" : "Nova música")

          // Se for retomar (continuePlayback), inicia com volume 0 para fazer fade in
          if (continuePlayback) {
            // O volume já foi salvo quando pausou, então apenas zera para fazer fade in
            // Se não houver volume salvo, usa o volume atual ou 0.7 como padrão
            if (savedVolume <= 0) {
              const currentVol = audioRef.current.volume > 0 ? audioRef.current.volume : (volume > 0 ? volume : 0.7)
              console.log("Volume salvo não encontrado, usando:", currentVol)
              setSavedVolume(currentVol)
            } else {
              console.log("Usando volume salvo para fade in:", savedVolume)
            }
            audioRef.current.volume = 0
            setVolume(0)
            setIsFadingIn(true) // Marca que vai fazer fade in
          }

          // Usa Promise com o método play()
          await audioRef.current.play()
          setIsPlaying(true)
        }
      } catch (error) {
        console.error("Erro ao reproduzir áudio:", error)
        setIsPlaying(false)
      } finally {
        setIsPlayPending(false)
      }
    },
    [currentMusic, isPlaying, isPlayPending, volume],
  )

  // Função centralizada para pausar música
  const pauseMusic = useCallback(() => {
    if (audioRef.current && isPlaying) {
      // Salva o volume atual ANTES de pausar para usar no fade in quando retomar
      const currentVol = audioRef.current.volume > 0 ? audioRef.current.volume : volume
      if (currentVol > 0) {
        console.log("Salvando volume ao pausar:", currentVol)
        setSavedVolume(currentVol)
      }
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [isPlaying, volume])

  // Função para diminuir o volume gradualmente (fade out)
  const fadeOut = useCallback(async (durationSeconds: number = 5) => {
    if (!audioRef.current || !isPlaying) return

    const startVolume = audioRef.current.volume
    const steps = 50 // Número de passos para a transição suave
    const stepDuration = (durationSeconds * 1000) / steps
    const volumeDecrement = startVolume / steps

    return new Promise<void>((resolve) => {
      let currentStep = 0
      
      const fadeInterval = setInterval(() => {
        currentStep++
        
        if (audioRef.current) {
          const newVolume = Math.max(0, startVolume - (volumeDecrement * currentStep))
          audioRef.current.volume = newVolume
          setVolume(newVolume)
          
          if (currentStep >= steps || newVolume <= 0) {
            clearInterval(fadeInterval)
            if (audioRef.current) {
              audioRef.current.pause()
              audioRef.current.volume = startVolume // Restaura o volume original
              setVolume(startVolume)
            }
            setIsPlaying(false)
            resolve()
          }
        } else {
          clearInterval(fadeInterval)
          resolve()
        }
      }, stepDuration)
    })
  }, [isPlaying])

  // Função para aumentar o volume gradualmente (fade in)
  const fadeIn = useCallback(async (targetVolume?: number, durationSeconds: number = 3) => {
    if (!audioRef.current) {
      console.log("fadeIn: audioRef.current não existe")
      return
    }

    const startVolume = 0
    // Usa o volume alvo fornecido, ou o volume salvo, mas se for muito baixo (< 0.1), usa 0.7 como padrão
    let finalVolume = targetVolume
    if (!finalVolume) {
      finalVolume = savedVolume > 0.1 ? savedVolume : 0.7
    }
    
    console.log("Iniciando fade in de", startVolume, "para", finalVolume, "(volume salvo era:", savedVolume, ")")
    
    const steps = 30 // Número de passos para a transição suave
    const stepDuration = (durationSeconds * 1000) / steps
    const volumeIncrement = finalVolume / steps

    return new Promise<void>((resolve) => {
      let currentStep = 0
      
      // Garante que o volume inicial é 0
      if (audioRef.current) {
        audioRef.current.volume = 0
        setVolume(0)
      }
      
      const fadeInterval = setInterval(() => {
        currentStep++
        
        if (audioRef.current) {
          const newVolume = Math.min(finalVolume, startVolume + (volumeIncrement * currentStep))
          audioRef.current.volume = newVolume
          setVolume(newVolume)
          
          if (currentStep >= steps || newVolume >= finalVolume) {
            clearInterval(fadeInterval)
            if (audioRef.current) {
              audioRef.current.volume = finalVolume
              setVolume(finalVolume)
            }
            setIsFadingIn(false) // Marca que terminou o fade in
            console.log("Fade in concluído. Volume final:", finalVolume)
            resolve()
          }
        } else {
          clearInterval(fadeInterval)
          setIsFadingIn(false)
          resolve()
        }
      }, stepDuration)
    })
  }, [savedVolume])

  // Adicionar um efeito para lidar com eventos de áudio
  useEffect(() => {
    const audioElement = audioRef.current

    if (!audioElement) return

    const handleEnded = () => {
      setIsPlaying(false)
    }

    const handleError = (e: Event) => {
      console.error("Erro de áudio:", e)
      // Tenta obter mais informações sobre o erro
      if (audioElement.error) {
        console.error("Código de erro:", audioElement.error.code)
        console.error("Mensagem de erro:", audioElement.error.message)
      }
      setIsPlaying(false)
    }

    const handleCanPlay = () => {
      console.log("Áudio pronto para reprodução")
    }

    // Adicionar event listeners
    audioElement.addEventListener("ended", handleEnded)
    audioElement.addEventListener("error", handleError)
    audioElement.addEventListener("canplay", handleCanPlay)

    // Limpar event listeners
    return () => {
      audioElement.removeEventListener("ended", handleEnded)
      audioElement.removeEventListener("error", handleError)
      audioElement.removeEventListener("canplay", handleCanPlay)
    }
  }, [audioRef.current])

  // Efeito para atualizar o volume quando ele mudar (mas não durante fade in)
  useEffect(() => {
    if (audioRef.current && !isFadingIn) {
      audioRef.current.volume = volume
    }
  }, [volume, isFadingIn])

  // Salvar estado no localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const stateToSave = {
      currentMusic: currentMusic ? {
        _id: currentMusic._id,
        titulo: currentMusic.titulo,
        categoria: currentMusic.categoria,
        caminho: currentMusic.caminho,
        arquivo: currentMusic.arquivo
      } : null,
      isPlaying,
      volume,
      selectedCategory,
      savedVolume
    }
    
    localStorage.setItem('harmonia_music_state', JSON.stringify(stateToSave))
  }, [currentMusic, isPlaying, volume, selectedCategory, savedVolume])

  // Restaurar estado do localStorage ao montar
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const restoreState = async () => {
      try {
        const savedState = localStorage.getItem('harmonia_music_state')
        if (!savedState) return
        
        const state = JSON.parse(savedState)
        
        if (state.selectedCategory) {
          setSelectedCategory(state.selectedCategory)
        }
        
        if (state.volume !== undefined) {
          setVolume(state.volume)
        }
        
        if (state.savedVolume !== undefined) {
          setSavedVolume(state.savedVolume)
        }
        
        // Restaura a música se houver uma salva
        if (state.currentMusic) {
          setCurrentMusic(state.currentMusic)
          
          // Carrega o áudio
          const audioPath = state.currentMusic.arquivo || state.currentMusic.caminho
          if (audioPath && audioRef.current) {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
            const baseUrlWithoutApi = baseUrl.endsWith("/api") ? baseUrl.substring(0, baseUrl.length - 4) : baseUrl
            let fullPath
            if (audioPath.startsWith("http")) {
              fullPath = audioPath
            } else {
              fullPath = `${baseUrlWithoutApi}/${audioPath.replace(/^\//, "")}`
            }
            
            audioRef.current.src = fullPath
            audioRef.current.load()
            
            // Aguarda o áudio estar pronto e restaura o tempo
            const savedTime = localStorage.getItem('harmonia_music_time')
            const timeToRestore = savedTime ? parseFloat(savedTime) : 0
            
            const restoreTime = () => {
              if (audioRef.current && timeToRestore > 0 && !isNaN(timeToRestore)) {
                audioRef.current.currentTime = timeToRestore
                localStorage.removeItem('harmonia_music_time')
                
                // Se estava tocando, retoma a reprodução
                if (state.isPlaying) {
                  audioRef.current.play().then(() => {
                    setIsPlaying(true)
                  }).catch(err => {
                    console.error('Erro ao retomar reprodução:', err)
                  })
                }
              } else if (state.isPlaying) {
              // Se não há tempo salvo mas estava tocando, apenas retoma
                audioRef.current.play().then(() => {
                  setIsPlaying(true)
                }).catch(err => {
                  console.error('Erro ao retomar reprodução:', err)
                })
              }
            }
            
            // Aguarda o áudio estar pronto
            if (audioRef.current.readyState >= 2) {
              restoreTime()
            } else {
              const handleCanPlay = () => {
                restoreTime()
                audioRef.current?.removeEventListener('canplay', handleCanPlay)
                audioRef.current?.removeEventListener('loadedmetadata', handleCanPlay)
              }
              audioRef.current.addEventListener('canplay', handleCanPlay)
              audioRef.current.addEventListener('loadedmetadata', handleCanPlay)
              
              // Timeout de segurança
              setTimeout(() => {
                audioRef.current?.removeEventListener('canplay', handleCanPlay)
                audioRef.current?.removeEventListener('loadedmetadata', handleCanPlay)
                if (audioRef.current) {
                  restoreTime()
                }
              }, 3000)
            }
          }
        }
      } catch (error) {
        console.error('Erro ao restaurar estado:', error)
      }
    }
    
    restoreState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executa apenas uma vez ao montar

  // Função para avançar para a próxima música
  const nextMusic = useCallback(() => {
    if (!currentMusic || musicList.length === 0) return

    const currentIndex = musicList.findIndex(m => m._id === currentMusic._id)
    if (currentIndex === -1) return

    const nextIndex = (currentIndex + 1) % musicList.length
    const nextMusicItem = musicList[nextIndex]
    
    if (nextMusicItem && (nextMusicItem.arquivo || nextMusicItem.caminho)) {
      playMusic(nextMusicItem)
    }
  }, [currentMusic, musicList, playMusic])

  // Função para retroceder para a música anterior
  const previousMusic = useCallback(() => {
    if (!currentMusic || musicList.length === 0) return

    const currentIndex = musicList.findIndex(m => m._id === currentMusic._id)
    if (currentIndex === -1) return

    const prevIndex = currentIndex === 0 ? musicList.length - 1 : currentIndex - 1
    const prevMusicItem = musicList[prevIndex]
    
    if (prevMusicItem && (prevMusicItem.arquivo || prevMusicItem.caminho)) {
      playMusic(prevMusicItem)
    }
  }, [currentMusic, musicList, playMusic])

  return (
    <MusicContext.Provider
      value={{
        currentMusic,
        setCurrentMusic,
        isPlaying,
        setIsPlaying,
        volume,
        setVolume,
        audioRef,
        selectedCategory,
        setSelectedCategory,
        playMusic,
        pauseMusic,
        fadeOut,
        fadeIn,
        musicList,
        setMusicList,
        nextMusic,
        previousMusic,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
      <audio ref={audioRef} preload="auto" style={{ display: "none" }} />
    </MusicContext.Provider>
  )
}

export function useMusic() {
  const context = useContext(MusicContext)
  if (context === undefined) {
    throw new Error("useMusic must be used within a MusicProvider")
  }
  return context
}


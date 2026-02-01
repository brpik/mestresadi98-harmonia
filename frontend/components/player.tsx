"use client"

import { useEffect, useState, useRef } from "react"
import { useMusic } from "@/context/music-context"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Music, Volume2, VolumeX, Volume1, Plus, Minus, SkipBack, SkipForward } from "lucide-react"
import { abbreviateText } from "@/utils/string-utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function Player() {
  const { currentMusic, isPlaying, volume, setVolume, audioRef, playMusic, pauseMusic, fadeOut, fadeIn, nextMusic, previousMusic, musicList } = useMusic()
  const [displayVolume, setDisplayVolume] = useState(Math.round(volume * 100))
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [visualizerBars, setVisualizerBars] = useState([0, 0, 0, 0, 0])
  const [isMounted, setIsMounted] = useState(false)
  const [volumeDialogOpen, setVolumeDialogOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isSeeking, setIsSeeking] = useState(false)
  const visualizerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const seekTimeRef = useRef(0)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume, audioRef])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Função para formatar tempo (segundos para MM:SS)
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Salvar tempo atual no localStorage periodicamente
  useEffect(() => {
    if (!currentMusic || !isPlaying) return
    
    const saveInterval = setInterval(() => {
      if (audioRef.current && currentMusic) {
        localStorage.setItem('harmonia_music_time', audioRef.current.currentTime.toString())
      }
    }, 2000) // Salva a cada 2 segundos
    
    return () => clearInterval(saveInterval)
  }, [currentMusic, isPlaying])

  // Atualiza o tempo atual e duração do áudio
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      if (!isSeeking) {
        setCurrentTime(audio.currentTime)
      }
    }

    const updateDuration = () => {
      setDuration(audio.duration || 0)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('durationchange', updateDuration)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('durationchange', updateDuration)
    }
  }, [audioRef, isSeeking])

  // Handler para quando o usuário arrasta o slider
  const handleSeekChange = (value: number[]) => {
    if (!audioRef.current) return
    const newTime = value[0]
    setIsSeeking(true)
    setCurrentTime(newTime)
    seekTimeRef.current = newTime
  }

  // Handler para quando o usuário solta o slider
  const handleSeekEnd = () => {
    if (!audioRef.current || !isSeeking) return
    audioRef.current.currentTime = seekTimeRef.current || currentTime
    setIsSeeking(false)
  }

  // Atualiza o áudio quando o usuário para de arrastar
  useEffect(() => {
    if (isSeeking) {
      seekTimeRef.current = currentTime
    } else if (audioRef.current && seekTimeRef.current > 0) {
      // Quando para de arrastar, atualiza o tempo do áudio
      audioRef.current.currentTime = seekTimeRef.current
      seekTimeRef.current = 0
    }
  }, [isSeeking, currentTime, audioRef])

  useEffect(() => {
    // Atualiza o display de volume quando o volume muda
    setDisplayVolume(Math.round(volume * 100))
  }, [volume])

  // Visualizer effect - apenas no cliente
  useEffect(() => {
    if (!isMounted) return
    
    if (isPlaying) {
      visualizerIntervalRef.current = setInterval(() => {
        setVisualizerBars(Array.from({ length: 5 }, () => Math.random() * 100))
      }, 150)
    } else {
      if (visualizerIntervalRef.current) {
        clearInterval(visualizerIntervalRef.current)
      }
      setVisualizerBars([0, 0, 0, 0, 0])
    }
    return () => {
      if (visualizerIntervalRef.current) {
        clearInterval(visualizerIntervalRef.current)
      }
    }
  }, [isPlaying, isMounted])

  const handlePlayPause = async () => {
    if (!currentMusic) return

    if (isPlaying) {
      pauseMusic()
    } else {
      // Continua a reprodução de onde parou
      console.log("Retomando música com fade in...")
      await playMusic(currentMusic, true)
      
      // Aplica fade in após iniciar a reprodução
      // Aguarda um momento para garantir que o áudio está pronto
      await new Promise(resolve => setTimeout(resolve, 300))
      
      if (audioRef.current) {
        // Verifica se o áudio está pronto
        if (audioRef.current.readyState >= 2) {
          console.log("Áudio pronto, iniciando fade in...")
          // Aplica fade in até o volume salvo (será usado automaticamente pelo contexto)
          await fadeIn(undefined, 3) // Fade in de 3 segundos até o volume salvo
        } else {
          console.log("Aguardando áudio ficar pronto...")
          // Se o áudio ainda não estiver pronto, aguarda o evento canplay
          const canPlayPromise = new Promise<void>((resolve) => {
            if (!audioRef.current) {
              resolve()
              return
            }
            
            const handleCanPlay = () => {
              console.log("Áudio ficou pronto, iniciando fade in...")
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

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }

  const handleVolumeIncrease = () => {
    const newVolume = Math.min(1, volume + 0.1)
    setVolume(newVolume)
  }

  const handleVolumeDecrease = () => {
    const newVolume = Math.max(0, volume - 0.1)
    setVolume(newVolume)
  }

  const handleFadeOut = async () => {
    if (!currentMusic || !isPlaying || isFadingOut) return
    
    setIsFadingOut(true)
    try {
      await fadeOut(5) // 5 segundos de fade out
    } catch (error) {
      console.error("Erro ao fazer fade out:", error)
    } finally {
      setIsFadingOut(false)
    }
  }

  // Gradiente para a capa do álbum
  const albumGradient = currentMusic 
    ? `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.5) 50%, hsl(var(--accent)) 100%)`
    : "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)"

  return (
    <>
      {/* Mobile Player Bar - Premium Design */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 shadow-2xl">
        <div className="px-4 py-3">
          {currentMusic ? (
            <>
              {/* Barra de progresso - Mobile */}
              {duration > 0 && (
                <div 
                  className="mb-2"
                  onMouseUp={handleSeekEnd}
                  onTouchEnd={handleSeekEnd}
                >
                  <Slider
                    value={[currentTime]}
                    max={duration}
                    step={0.1}
                    onValueChange={handleSeekChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 w-full">
              {/* LEFT: Cover/Visualizer */}
              <div 
                className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg relative overflow-hidden"
                style={{ background: albumGradient }}
              >
                {isMounted && isPlaying ? (
                  <div className="absolute inset-0 flex items-center justify-center gap-0.5 p-2">
                    {visualizerBars.map((height, i) => (
                      <div
                        key={i}
                        className="w-1 bg-white/90 rounded-full"
                        style={{
                          height: `${20 + height * 0.6}%`,
                          transition: 'height 0.15s ease-out'
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Music className="h-6 w-6 text-white/70" />
                )}
              </div>

              {/* CENTER: Info */}
              <div className="flex-1 min-w-0">
                <h3 
                  className="font-bold text-sm text-foreground line-clamp-2 leading-tight"
                  title={currentMusic.titulo}
                >
                  {currentMusic.titulo}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isPlaying ? "Tocando agora" : "Pausado"}
                </p>
              </div>

              {/* RIGHT: Controls */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 p-0 rounded-full flex-shrink-0"
                  onClick={previousMusic}
                  disabled={!currentMusic || musicList.length === 0}
                  title="Música anterior"
                >
                  <SkipBack className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Button 
                  className="h-11 w-11 p-0 rounded-full bg-primary hover:bg-primary/90 flex-shrink-0 shadow-lg" 
                  onClick={handlePlayPause} 
                  disabled={!currentMusic}
                  size="icon"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 text-primary-foreground" />
                  ) : (
                    <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 p-0 rounded-full flex-shrink-0"
                  onClick={nextMusic}
                  disabled={!currentMusic || musicList.length === 0}
                  title="Próxima música"
                >
                  <SkipForward className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 p-0 rounded-full flex-shrink-0"
                  onClick={() => setVolumeDialogOpen(true)}
                >
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                </Button>
              </div>
            </div>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <div 
                className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: albumGradient }}
              >
                <Music className="h-6 w-6 text-white/40" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Nenhuma música selecionada</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Player - Fixo no Bottom, Layout Horizontal */}
      <div className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 shadow-2xl">
        <div className="w-full px-6 py-3">
          {currentMusic ? (
            <div className="flex items-center gap-4 w-full">
              {/* LEFT: Cover/Visualizer */}
              <div 
                className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg relative overflow-hidden"
                style={{ background: albumGradient }}
              >
                {isMounted && isPlaying ? (
                  <div className="absolute inset-0 flex items-center justify-center gap-0.5 p-2">
                    {visualizerBars.map((height, i) => (
                      <div
                        key={i}
                        className="w-1 bg-white/90 rounded-full"
                        style={{
                          height: `${20 + height * 0.6}%`,
                          transition: 'height 0.15s ease-out'
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Music className="h-6 w-6 text-white/70" />
                )}
              </div>

              {/* CENTER: Info e Controles */}
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                {/* Info da música */}
                <div className="flex items-center gap-3">
                  <h3 
                    className="font-bold text-sm text-foreground truncate"
                    title={currentMusic.titulo}
                  >
                    {currentMusic.titulo}
                  </h3>
                </div>

                {/* Controles e Barra de Progresso */}
                <div className="flex items-center gap-3">
                  {/* Controles de navegação */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={previousMusic}
                      disabled={!currentMusic || musicList.length === 0}
                      title="Música anterior"
                    >
                      <SkipBack className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button 
                      className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 flex-shrink-0" 
                      onClick={handlePlayPause} 
                      disabled={!currentMusic}
                      size="icon"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={nextMusic}
                      disabled={!currentMusic || musicList.length === 0}
                      title="Próxima música"
                    >
                      <SkipForward className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>

                  {/* Barra de progresso */}
                  {duration > 0 && (
                    <div 
                      className="flex-1 flex items-center gap-2"
                      onMouseUp={handleSeekEnd}
                      onTouchEnd={handleSeekEnd}
                    >
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {formatTime(currentTime)}
                      </span>
                      <Slider
                        value={[currentTime]}
                        max={duration}
                        step={0.1}
                        onValueChange={handleSeekChange}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-10">
                        {formatTime(duration)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Volume e Controles Extras */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Volume */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setVolumeDialogOpen(true)}
                    title="Volume"
                  >
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  {isPlaying && (
                    <Button 
                      className="h-9 px-3 text-xs" 
                      onClick={handleFadeOut} 
                      disabled={!currentMusic || isFadingOut} 
                      size="sm"
                      variant="outline"
                      title="Saída gradual"
                    >
                      <VolumeX className="h-3 w-3 mr-1" />
                      <span>{isFadingOut ? "Saindo..." : "Saída"}</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <div 
                className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: albumGradient }}
              >
                <Music className="h-6 w-6 text-white/40" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Nenhuma música selecionada</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Volume Dialog for Mobile */}
      <Dialog open={volumeDialogOpen} onOpenChange={setVolumeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Volume</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={handleVolumeDecrease}
                disabled={volume <= 0}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <div className="flex flex-col items-center gap-2 min-w-[120px]">
                <span className="text-2xl font-bold text-primary">
                  {displayVolume}%
                </span>
                <Volume2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={handleVolumeIncrease}
                disabled={volume >= 1}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <Slider
              defaultValue={[volume]}
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-full"
            />
            {isPlaying && (
              <Button 
                className="w-full" 
                onClick={async () => {
                  await handleFadeOut()
                  setVolumeDialogOpen(false)
                }} 
                disabled={!currentMusic || isFadingOut} 
                variant="outline"
              >
                <VolumeX className="h-4 w-4 mr-2" />
                {isFadingOut ? "Saindo..." : "Saída de Música"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


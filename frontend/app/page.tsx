"use client"

import Sidebar from "@/components/sidebar"
import MusicList from "@/components/music-list"
import Player from "@/components/player"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

export default function Home() {
  useKeyboardShortcuts()

  return (
    <main 
      className="flex flex-col md:flex-row min-h-screen md:h-screen bg-background pb-32 md:pb-20 md:overflow-hidden"
      tabIndex={0}
      onKeyDown={(e) => {
        // Garante que eventos de teclado sejam capturados
        // O hook useKeyboardShortcuts vai lidar com os eventos
      }}
    >
      {/* Sidebar - Mobile: scrollável, Desktop: fixa */}
      <div className="md:flex-shrink-0 md:overflow-hidden md:h-full">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 order-3 md:order-2 min-h-0 md:h-full md:overflow-hidden">
        <MusicList />
      </div>
      {/* Player fixo no bottom - Mobile e Desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-50 order-2">
        <Player />
      </div>
    </main>
  )
}


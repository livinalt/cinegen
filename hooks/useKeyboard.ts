'use client'

import { useEffect } from 'react'
import { useApp } from '@/context/AppContext'

export function useKeyboard() {
  const { dispatch } = useApp()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't fire when typing in inputs
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      switch (e.key) {
        case ' ':
        case 'ArrowRight':
          e.preventDefault()
          dispatch({ type: 'NEXT_LYRIC' })
          break
        case 'ArrowLeft':
          e.preventDefault()
          dispatch({ type: 'PREV_LYRIC' })
          break
        case 'f':
        case 'F':
          dispatch({ type: 'TOGGLE_FREEZE' })
          break
        case 'b':
        case 'B':
          dispatch({ type: 'TOGGLE_BLACKOUT' })
          break
        case 'r':
        case 'R':
          dispatch({ type: 'RANDOMIZE' })
          break
        case 'Escape':
          dispatch({ type: 'RESET_TO_PRESET' })
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch])
}

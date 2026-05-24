'use client'

import { useState, useRef, useCallback } from 'react'

interface UndoRedoState<T> {
  past: T[]
  present: T
  future: T[]
}

const MAX_HISTORY = 50

export function useUndoRedo<T>(initial: T) {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initial,
    future: [],
  })

  const skipRef = useRef(false)

  const canUndo = state.past.length > 0
  const canRedo = state.future.length > 0

  const set = useCallback((newPresent: T) => {
    if (skipRef.current) {
      skipRef.current = false
      setState(prev => ({ ...prev, present: newPresent }))
      return
    }
    setState(prev => ({
      past: [...prev.past.slice(-(MAX_HISTORY - 1)), prev.present],
      present: newPresent,
      future: [],
    }))
  }, [])

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.past.length === 0) return prev
      const previous = prev.past[prev.past.length - 1]
      const newPast = prev.past.slice(0, -1)
      skipRef.current = true
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.future.length === 0) return prev
      const next = prev.future[0]
      const newFuture = prev.future.slice(1)
      skipRef.current = true
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      }
    })
  }, [])

  const reset = useCallback((newInitial: T) => {
    setState({
      past: [],
      present: newInitial,
      future: [],
    })
  }, [])

  return {
    present: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  }
}
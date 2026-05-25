export type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' }
type Listener = (toast: Toast) => void

let nextId = 0
const listeners: Set<Listener> = new Set()

export function toast(message: string, type: Toast['type'] = 'error') {
  const id = ++nextId
  listeners.forEach(fn => fn({ id, message, type }))
}

export function subscribeToast(fn: Listener) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

interface SnackbarState {
  id: number
  message: string
  onUndo?: () => void
}

interface SnackbarContextValue {
  /** Shows a brief bottom message, optionally with an "Annuler" action. */
  showSnackbar: (message: string, onUndo?: () => void) => void
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null)

const DURATION_MS = 4000

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const idRef = useRef(0)

  const showSnackbar = useCallback((message: string, onUndo?: () => void) => {
    clearTimeout(timeoutRef.current)
    const id = ++idRef.current
    setSnackbar({ id, message, onUndo })
    timeoutRef.current = setTimeout(() => {
      setSnackbar((s) => (s?.id === id ? null : s))
    }, DURATION_MS)
  }, [])

  function handleUndo() {
    clearTimeout(timeoutRef.current)
    snackbar?.onUndo?.()
    setSnackbar(null)
  }

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {snackbar && (
        <div
          key={snackbar.id}
          className="animate-slide-up pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4"
        >
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
            <span>{snackbar.message}</span>
            {snackbar.onUndo && (
              <button
                type="button"
                onClick={handleUndo}
                className="shrink-0 font-semibold text-brand-300 active:opacity-70"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      )}
    </SnackbarContext.Provider>
  )
}

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext)
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider')
  return ctx
}

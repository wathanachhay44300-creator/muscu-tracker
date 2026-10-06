import { useEffect, useState } from 'react'

const SHOW_AFTER_PX = 480

/** Floating "back to top" button, shown once the page has been scrolled a good way down. */
export function BackToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let frame = 0
    function onScroll() {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        // Only touches state when crossing the threshold, not on every scroll event.
        setVisible(window.scrollY > SHOW_AFTER_PX)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  function goTop() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  if (!visible) return null
  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="Remonter en haut"
      className="animate-pop-in fixed bottom-24 left-4 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-surface text-accent shadow-lg active:bg-slate-100"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 15l6-6 6 6" />
        <path d="M6 5h12" />
      </svg>
    </button>
  )
}

import { useEffect } from 'react'

/** Follow the keyboard's visible area without resetting an intentional browser zoom. */
export function useMobileViewport() {
  useEffect(() => {
    const viewport = window.visualViewport
    const root = document.documentElement
    let lastHeight = window.innerHeight
    let frame = 0
    const update = () => {
      const unzoomed = !viewport || Math.abs(viewport.scale - 1) < 0.01
      const height = unzoomed && viewport ? viewport.height : window.innerHeight
      root.style.setProperty('--app-height', `${height}px`)
      root.style.setProperty('--app-top', `${unzoomed && viewport ? viewport.offsetTop : 0}px`)
      if (unzoomed && height < lastHeight) {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
          const focused = document.activeElement as HTMLElement | null
          if (!focused?.matches('input,textarea,select,[contenteditable="true"]')) return
          // Scroll only the form's own container; never move or rescale the whole page.
          for (let parent = focused.parentElement; parent; parent = parent.parentElement) {
            if (!/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) continue
            const field = focused.getBoundingClientRect(), area = parent.getBoundingClientRect()
            if (field.bottom > area.bottom) parent.scrollTop += field.bottom - area.bottom + 8
            else if (field.top < area.top) parent.scrollTop -= area.top - field.top + 8
            break
          }
        })
      }
      lastHeight = height
    }
    update()
    window.addEventListener('resize', update)
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', update)
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
      root.style.removeProperty('--app-height')
      root.style.removeProperty('--app-top')
    }
  }, [])
}

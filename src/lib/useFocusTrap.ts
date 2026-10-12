import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Keyboard-accessible modal behavior neither WinnerModal nor the
 * entry-confirmation dialog had: Tab/Shift+Tab were free to leave the
 * dialog for the page behind it (still visually covered by the
 * backdrop, but very much still there and focusable), Escape did
 * nothing, and focus wasn't returned to whatever opened the dialog once
 * it closed. The component using this only exists while its dialog is
 * open (conditionally rendered by the parent, not toggled internally),
 * so this just runs once on mount and cleans up once on unmount — no
 * separate "active" flag needed.
 */
export function useFocusTrap(onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const container = containerRef.current
    const first = container?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    first?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !container) return
      const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (items.length === 0) return
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return containerRef
}

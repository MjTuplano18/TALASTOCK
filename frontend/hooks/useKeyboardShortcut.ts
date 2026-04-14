import { useEffect } from 'react'

/**
 * Hook to register keyboard shortcuts
 * @param key - The key to listen for (e.g., 'k', 'Escape', 'Enter')
 * @param callback - Function to call when key is pressed
 * @param options - Additional options (ctrl, shift, alt, meta)
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
    enabled?: boolean
  } = {}
) {
  const { ctrl = false, shift = false, alt = false, meta = false, enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(event: KeyboardEvent) {
      // Check if modifiers match
      if (ctrl && !event.ctrlKey) return
      if (shift && !event.shiftKey) return
      if (alt && !event.altKey) return
      if (meta && !event.metaKey) return

      // Check if key matches (case-insensitive)
      if (event.key.toLowerCase() === key.toLowerCase()) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, callback, ctrl, shift, alt, meta, enabled])
}

/**
 * Hook to close modals/dialogs with Escape key
 * @param isOpen - Whether the modal is open
 * @param onClose - Function to call to close the modal
 */
export function useEscapeKey(isOpen: boolean, onClose: () => void) {
  useKeyboardShortcut('Escape', onClose, { enabled: isOpen })
}

import { useEffect, useRef } from 'react'

interface BarcodeScannerConfig {
  onScan: (sku: string) => void
  enabled: boolean
  minInputSpeed?: number // milliseconds between characters to detect scanner (default: 50ms)
  idleTimeout?: number // milliseconds to clear buffer after idle (default: 100ms)
}

/**
 * Custom hook for detecting barcode scanner input
 * 
 * Barcode scanners typically input characters very rapidly (< 50ms between chars)
 * followed by an Enter key. This hook distinguishes scanner input from manual typing
 * by measuring the time between keystrokes.
 * 
 * @param config - Configuration object
 * @param config.onScan - Callback function triggered when a barcode is scanned
 * @param config.enabled - Whether the scanner listener is active
 * @param config.minInputSpeed - Max milliseconds between chars to detect scanner (default: 50ms)
 * @param config.idleTimeout - Milliseconds to clear buffer after idle (default: 100ms)
 * 
 * @example
 * ```tsx
 * useBarcodeScanner({
 *   enabled: true,
 *   onScan: (sku) => {
 *     console.log('Scanned SKU:', sku)
 *     // Look up product by SKU
 *   }
 * })
 * ```
 */
export function useBarcodeScanner({
  onScan,
  enabled,
  minInputSpeed = 50,
  idleTimeout = 100,
}: BarcodeScannerConfig): void {
  const bufferRef = useRef<string>('')
  const lastKeypressRef = useRef<number>(0)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled) return

    function handleKeyPress(event: KeyboardEvent) {
      const now = Date.now()
      const timeSinceLastKeypress = now - lastKeypressRef.current

      // Clear any existing idle timer
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }

      // If Enter key is pressed, process the buffer
      if (event.key === 'Enter') {
        event.preventDefault()
        
        const scannedValue = bufferRef.current.trim()
        
        // Only trigger callback if buffer has content
        if (scannedValue.length > 0) {
          onScan(scannedValue)
        }
        
        // Clear buffer after processing
        bufferRef.current = ''
        lastKeypressRef.current = 0
        return
      }

      // Ignore special keys (Shift, Ctrl, Alt, etc.)
      if (event.key.length > 1) {
        return
      }

      // If this is the first character or input is rapid (scanner-like)
      if (lastKeypressRef.current === 0 || timeSinceLastKeypress < minInputSpeed) {
        // Add character to buffer
        bufferRef.current += event.key
        lastKeypressRef.current = now

        // Set idle timer to clear buffer if no more input
        idleTimerRef.current = setTimeout(() => {
          bufferRef.current = ''
          lastKeypressRef.current = 0
        }, idleTimeout)
      } else {
        // Input is too slow, likely manual typing - reset buffer
        bufferRef.current = event.key
        lastKeypressRef.current = now

        // Set idle timer
        idleTimerRef.current = setTimeout(() => {
          bufferRef.current = ''
          lastKeypressRef.current = 0
        }, idleTimeout)
      }
    }

    // Add global event listener
    window.addEventListener('keypress', handleKeyPress)

    // Cleanup
    return () => {
      window.removeEventListener('keypress', handleKeyPress)
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [enabled, onScan, minInputSpeed, idleTimeout])
}

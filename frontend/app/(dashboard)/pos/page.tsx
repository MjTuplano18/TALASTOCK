'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart } from 'lucide-react'
import { ProductSearch } from '@/components/pos/ProductSearch'
import { POSCart } from '@/components/pos/POSCart'
import { ReceiptView } from '@/components/pos/ReceiptView'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { completePOSSale, getProductBySKU } from '@/lib/pos-api'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Product, CartItem, Sale } from '@/types'

const CART_STORAGE_KEY = 'talastock_pos_cart'

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user
  useEffect(() => {
    async function getCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getCurrentUser()
  }, [])

  // Load cart from session storage on mount
  useEffect(() => {
    const savedCart = sessionStorage.getItem(CART_STORAGE_KEY)
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error('Failed to load cart from session storage:', error)
      }
    }
  }, [])

  // Save cart to session storage whenever it changes
  useEffect(() => {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  // Offline detection
  useEffect(() => {
    function handleOnline() {
      setIsOffline(false)
      toast.success('Connection restored')
    }
    
    function handleOffline() {
      setIsOffline(true)
      toast.error('You are offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Add product to cart
  const addToCart = useCallback((product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id)
      
      if (existingItem) {
        // Increment quantity if product already in cart
        return prevCart.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
                stockWarning: (item.quantity + 1) > (product.inventory?.quantity ?? 0),
              }
            : item
        )
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          product,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
          stockWarning: 1 > (product.inventory?.quantity ?? 0),
        }
        return [...prevCart, newItem]
      }
    })
    
    toast.success(`Added ${product.name} to cart`)
  }, [])

  // Update item quantity
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unitPrice,
              stockWarning: quantity > (item.product.inventory?.quantity ?? 0),
            }
          : item
      )
    )
  }, [])

  // Remove item from cart
  const removeItem = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId))
  }, [])

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCart([])
    sessionStorage.removeItem(CART_STORAGE_KEY)
  }, [])

  // Handle barcode scan
  const handleBarcodeScan = useCallback(async (sku: string) => {
    try {
      const product = await getProductBySKU(sku)

      if (!product) {
        toast.error(`Product not found: ${sku}`)
        return
      }

      addToCart(product)
    } catch (error) {
      console.error('Barcode scan error:', error)
      toast.error('Failed to process barcode')
    }
  }, [addToCart])

  // Enable barcode scanner
  useBarcodeScanner({
    enabled: !isProcessing && !completedSale,
    onScan: handleBarcodeScan,
  })

  // Complete sale
  const completeSale = useCallback(async () => {
    if (!userId) {
      toast.error('User not authenticated')
      return
    }

    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    setIsProcessing(true)
    try {
      const result = await completePOSSale({
        items: cart,
        userId,
      })

      if (result.success) {
        toast.success('Sale completed successfully!')
        setCompletedSale(result.sale)
        clearCart()
      } else {
        toast.error(result.error || 'Failed to complete sale')
      }
    } catch (error) {
      console.error('Sale completion error:', error)
      toast.error('Failed to complete sale')
    } finally {
      setIsProcessing(false)
    }
  }, [cart, userId, clearCart])

  // Start new sale (clear receipt)
  const startNewSale = useCallback(() => {
    setCompletedSale(null)
  }, [])

  // If showing receipt, display receipt view
  if (completedSale) {
    return (
      <div>
        <div className="mb-4">
          <h1 className="text-lg font-medium text-[#7A3E2E]">Point of Sale</h1>
        </div>
        <ReceiptView sale={completedSale} onNewSale={startNewSale} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-medium text-[#7A3E2E]">Point of Sale</h1>
      </div>

      {/* Offline Banner */}
      {isOffline && (
        <div className="mb-4 p-3 rounded-lg bg-[#FDECEA] border border-[#F2C4B0]">
          <p className="text-sm text-[#C05050] font-medium">
            You are offline. Complete sale is disabled.
          </p>
        </div>
      )}

      {/* Split Layout: Search Left, Cart Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product Search */}
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-4 h-[calc(100vh-200px)] lg:h-[600px]">
          <ProductSearch
            onProductSelect={addToCart}
            disabled={isProcessing}
          />
        </div>

        {/* Cart */}
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-4 h-[calc(100vh-200px)] lg:h-[600px]">
          <POSCart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onCompleteSale={completeSale}
            onClearCart={clearCart}
            isProcessing={isProcessing}
            offlineMode={isOffline}
          />
        </div>
      </div>
    </div>
  )
}

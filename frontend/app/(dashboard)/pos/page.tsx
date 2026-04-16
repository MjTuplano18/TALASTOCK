'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart } from 'lucide-react'
import { ProductSearch } from '@/components/pos/ProductSearch'
import { POSCart } from '@/components/pos/POSCart'
import { ReceiptView } from '@/components/pos/ReceiptView'
import { PaymentMethodSelector } from '@/components/pos/PaymentMethodSelector'
import { CashCalculator } from '@/components/pos/CashCalculator'
import { DiscountModal } from '@/components/pos/DiscountModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { completePOSSale, getProductBySKU } from '@/lib/pos-api'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import type { Product, CartItem, Sale, PaymentMethod, DiscountType } from '@/types'

const CART_STORAGE_KEY = 'talastock_pos_cart'

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [cashReceived, setCashReceived] = useState(0)
  const [changeGiven, setChangeGiven] = useState(0)

  // Discount state
  const [discount, setDiscount] = useState<{
    type: DiscountType
    value: number
    amount: number
  }>({
    type: 'none',
    value: 0,
    amount: 0,
  })
  const [showDiscountModal, setShowDiscountModal] = useState(false)

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

  // Open discount modal
  const openDiscountModal = useCallback(() => {
    setShowDiscountModal(true)
  }, [])

  // Apply discount
  const applyDiscount = useCallback((discountType: DiscountType, discountValue: number, discountAmount: number) => {
    setDiscount({
      type: discountType,
      value: discountValue,
      amount: discountAmount,
    })
    toast.success('Discount applied')
  }, [])

  // Remove discount
  const removeDiscount = useCallback(() => {
    setDiscount({
      type: 'none',
      value: 0,
      amount: 0,
    })
    toast.success('Discount removed')
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
    enabled: !isProcessing && !completedSale && !showPaymentModal && !showDiscountModal,
    onScan: handleBarcodeScan,
  })

  // Calculate cart subtotal and total
  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const cartTotal = cartSubtotal - discount.amount

  // Open payment modal
  const openPaymentModal = useCallback(() => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }
    
    // Reset payment state
    setPaymentMethod('cash')
    setCashReceived(0)
    setChangeGiven(0)
    setShowPaymentModal(true)
  }, [cart])

  // Close payment modal
  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false)
  }, [])

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

    // Validate payment data
    if (paymentMethod === 'cash') {
      if (cashReceived < cartTotal) {
        toast.error('Cash received must be greater than or equal to total amount')
        return
      }
      // Calculate change
      const change = cashReceived - cartTotal
      setChangeGiven(change)
    }

    setIsProcessing(true)
    try {
      const result = await completePOSSale({
        items: cart,
        userId,
        payment_method: paymentMethod,
        cash_received: paymentMethod === 'cash' ? cashReceived : undefined,
        change_given: paymentMethod === 'cash' ? (cashReceived - cartTotal) : undefined,
        discount_type: discount.type,
        discount_value: discount.value,
        discount_amount: discount.amount,
      })

      if (result.success) {
        toast.success('Sale completed successfully!')
        setCompletedSale(result.sale)
        clearCart()
        closePaymentModal()
        // Clear discount when starting new sale
        setDiscount({
          type: 'none',
          value: 0,
          amount: 0,
        })
      } else {
        toast.error(result.error || 'Failed to complete sale')
      }
    } catch (error) {
      console.error('Sale completion error:', error)
      toast.error('Failed to complete sale')
    } finally {
      setIsProcessing(false)
    }
  }, [cart, userId, paymentMethod, cashReceived, cartTotal, discount, clearCart, closePaymentModal])

  // Start new sale (clear receipt)
  const startNewSale = useCallback(() => {
    setCompletedSale(null)
    // Clear discount when starting new sale
    setDiscount({
      type: 'none',
      value: 0,
      amount: 0,
    })
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
            onCompleteSale={openPaymentModal}
            onClearCart={clearCart}
            isProcessing={isProcessing}
            offlineMode={isOffline}
            discount={discount}
            onOpenDiscountModal={openDiscountModal}
            onRemoveDiscount={removeDiscount}
          />
        </div>
      </div>

      {/* Discount Modal */}
      <DiscountModal
        open={showDiscountModal}
        onOpenChange={setShowDiscountModal}
        totalAmount={cartSubtotal}
        onApplyDiscount={applyDiscount}
        currentDiscount={discount.type !== 'none' ? discount : undefined}
      />

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="border-[#F2C4B0] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#7A3E2E]">Complete Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Total Amount Display */}
            <div className="p-4 rounded-lg bg-[#FDF6F0] border border-[#F2C4B0]">
              <p className="text-xs text-[#B89080] mb-1">Total Amount</p>
              <p className="text-2xl font-medium text-[#7A3E2E]">
                {formatCurrency(cartTotal)}
              </p>
            </div>

            {/* Payment Method Selector */}
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
              disabled={isProcessing}
            />

            {/* Cash Calculator (only for cash payments) */}
            {paymentMethod === 'cash' && (
              <CashCalculator
                totalAmount={cartTotal}
                cashReceived={cashReceived}
                onChange={setCashReceived}
              />
            )}

            {/* Non-Cash Payment Confirmation */}
            {paymentMethod !== 'cash' && (
              <div className="p-4 rounded-lg bg-[#FDE8DF] border border-[#F2C4B0]">
                <p className="text-sm text-[#7A3E2E] text-center">
                  Please confirm that payment of <span className="font-medium">{formatCurrency(cartTotal)}</span> has been received via{' '}
                  <span className="font-medium capitalize">{paymentMethod.replace('_', ' ')}</span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={closePaymentModal}
              disabled={isProcessing}
              className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
            >
              Cancel
            </Button>
            <Button
              onClick={completeSale}
              disabled={isProcessing || (paymentMethod === 'cash' && cashReceived < cartTotal)}
              className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
            >
              {isProcessing ? 'Processing...' : 'Complete Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

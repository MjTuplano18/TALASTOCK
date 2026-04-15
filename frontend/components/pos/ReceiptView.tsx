'use client'

import { useEffect, useState } from 'react'
import { Receipt, Printer, ShoppingCart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Sale, SaleItem } from '@/types'

interface ReceiptViewProps {
  sale: Sale
  onNewSale: () => void
}

export function ReceiptView({ sale, onNewSale }: ReceiptViewProps) {
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch sale items with product details
  useEffect(() => {
    async function fetchSaleItems() {
      try {
        const { data, error } = await supabase
          .from('sale_items')
          .select('*, products(name, sku)')
          .eq('sale_id', sale.id)

        if (error) throw error
        setSaleItems(data || [])
      } catch (error) {
        console.error('Failed to fetch sale items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSaleItems()
  }, [sale.id])

  function handlePrint() {
    window.print()
  }

  const saleDate = new Date(sale.created_at)
  const formattedDate = saleDate.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const formattedTime = saleDate.toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="max-w-2xl mx-auto">
      {/* Receipt Card */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-6 print:border-0 print:shadow-none">
        {/* Receipt Header */}
        <div className="text-center mb-6 pb-4 border-b border-[#F2C4B0]">
          <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-6 h-6 text-[#E8896A]" />
          </div>
          <h2 className="text-lg font-medium text-[#7A3E2E] mb-1">Sale Receipt</h2>
          <p className="text-xs text-[#B89080]">Thank you for your purchase!</p>
        </div>

        {/* Sale Info */}
        <div className="mb-6 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#B89080]">Receipt #</span>
            <span className="text-[#7A3E2E] font-mono">{sale.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#B89080]">Date</span>
            <span className="text-[#7A3E2E]">{formattedDate}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#B89080]">Time</span>
            <span className="text-[#7A3E2E]">{formattedTime}</span>
          </div>
        </div>

        {/* Items */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[#7A3E2E] mb-3">Items</h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#E8896A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {saleItems.map((item) => (
                <div key={item.id} className="flex justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#7A3E2E] truncate">{item.products?.name}</p>
                    <p className="text-xs text-[#B89080] font-mono">{item.products?.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-[#7A3E2E]">
                      {item.quantity} × {formatCurrency(item.unit_price)}
                    </p>
                    <p className="text-sm font-medium text-[#7A3E2E]">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="pt-4 border-t border-[#F2C4B0]">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-[#7A3E2E]">Total</span>
            <span className="text-xl font-medium text-[#7A3E2E]">
              {formatCurrency(sale.total_amount)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#F2C4B0] text-center">
          <p className="text-xs text-[#B89080]">Powered by Talastock</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex-1 h-11 rounded-lg border border-[#F2C4B0] text-sm text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
        <button
          onClick={onNewSale}
          className="flex-1 h-11 rounded-lg bg-[#E8896A] hover:bg-[#C1614A] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          New Sale
        </button>
      </div>
    </div>
  )
}

'use client'

import { X, Printer, Download } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { exportSingleTransactionPDF } from '@/lib/export-transactions'
import type { Sale } from '@/types'

interface TransactionDetailsDrawerProps {
  sale: Sale | null
  open: boolean
  onClose: () => void
}

export function TransactionDetailsDrawer({ sale, open, onClose }: TransactionDetailsDrawerProps) {
  if (!sale) return null

  const itemCount = sale.sale_items?.length ?? 0
  const subtotal = sale.total_amount // For now, same as total (no tax/discount yet)

  function handlePrint() {
    exportSingleTransactionPDF(sale)
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#F2C4B0]">
            <div>
              <h2 className="text-base font-medium text-[#7A3E2E]">Transaction Details</h2>
              <p className="text-xs text-[#B89080] mt-0.5">
                #{sale.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#FDE8DF] transition-colors"
            >
              <X className="w-5 h-5 text-[#7A3E2E]" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Transaction Info */}
            <div className="bg-[#FDF6F0] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#B89080]">Date</span>
                <span className="text-[#7A3E2E] font-medium">
                  {new Date(sale.created_at).toLocaleDateString('en-PH', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#B89080]">Time</span>
                <span className="text-[#7A3E2E] font-medium">
                  {new Date(sale.created_at).toLocaleTimeString('en-PH', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#B89080]">Transaction ID</span>
                <span className="text-[#7A3E2E] font-medium font-mono">
                  {sale.id}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#B89080]">Items</span>
                <span className="text-[#7A3E2E] font-medium">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h3 className="text-sm font-medium text-[#7A3E2E] mb-3">Items Purchased</h3>
              <div className="space-y-2">
                {sale.sale_items?.map((item) => {
                  const product = item.products
                  const itemTotal = item.quantity * item.unit_price
                  
                  return (
                    <div key={item.id} className="bg-white border border-[#F2C4B0] rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#7A3E2E]">
                            {product?.name ?? 'Unknown Product'}
                          </p>
                          <p className="text-xs text-[#B89080] mt-0.5">
                            SKU: {product?.sku ?? 'N/A'}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-[#7A3E2E]">
                          {formatCurrency(itemTotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#B89080]">
                        <span>Qty: {item.quantity}</span>
                        <span>@ {formatCurrency(item.unit_price)} each</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Notes */}
            {sale.notes && (
              <div>
                <h3 className="text-sm font-medium text-[#7A3E2E] mb-2">Notes</h3>
                <div className="bg-[#FDF6F0] rounded-lg p-3">
                  <p className="text-xs text-[#7A3E2E]">{sale.notes}</p>
                </div>
              </div>
            )}

            {/* Total Summary */}
            <div className="bg-[#FDF6F0] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#B89080]">Subtotal</span>
                <span className="text-[#7A3E2E]">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#B89080]">Tax</span>
                <span className="text-[#7A3E2E]">₱0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#B89080]">Discount</span>
                <span className="text-[#7A3E2E]">₱0.00</span>
              </div>
              <div className="pt-2 border-t border-[#F2C4B0]">
                <div className="flex justify-between">
                  <span className="text-base font-medium text-[#7A3E2E]">Total</span>
                  <span className="text-lg font-medium text-[#E8896A]">
                    {formatCurrency(sale.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[#F2C4B0] space-y-2">
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-[#E8896A] hover:bg-[#C1614A] text-white text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Receipt (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="w-full h-9 px-4 rounded-lg border border-[#F2C4B0] text-sm text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

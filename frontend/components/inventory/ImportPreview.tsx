'use client'

import { Check, X, AlertTriangle } from 'lucide-react'
import type { ParsedRow } from '@/lib/import-parser'
import type { MatchResult } from '@/lib/product-matcher'
import type { ValidationError } from '@/lib/import-validator'

interface PreviewRow {
  row: ParsedRow
  match: MatchResult
  currentQuantity: number
  currentThreshold: number
  currentPrice: number
  currentCostPrice: number
  newQuantity: number | null
  newThreshold: number | null
  newPrice: number | null
  newCostPrice: number | null
  quantityChange: number
  hasError: boolean
}

interface ImportPreviewProps {
  previewRows: PreviewRow[]
  mode: 'replace' | 'add'
  errors: ValidationError[]
}

export function ImportPreview({ previewRows, mode, errors }: ImportPreviewProps) {
  const validRows = previewRows.filter(r => !r.hasError)
  const errorRows = previewRows.filter(r => r.hasError)

  function getRowError(rowNumber: number): string | undefined {
    return errors.find(e => e.rowNumber === rowNumber)?.message
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-[#FDF6F0] rounded-xl border border-[#F2C4B0]">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-[#B89080]">Total Rows</p>
            <p className="text-lg font-medium text-[#7A3E2E]">{previewRows.length}</p>
          </div>
          <div>
            <p className="text-xs text-[#B89080]">Valid</p>
            <p className="text-lg font-medium text-[#7A3E2E]">{validRows.length}</p>
          </div>
          <div>
            <p className="text-xs text-[#B89080]">Errors</p>
            <p className="text-lg font-medium text-[#C05050]">{errorRows.length}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#B89080]">Import Mode</p>
          <p className="text-sm font-medium text-[#7A3E2E] capitalize">{mode}</p>
        </div>
      </div>

      {/* Preview Table */}
      <div className="border border-[#F2C4B0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white border-b border-[#F2C4B0]">
              <tr>
                <th className="text-left py-2 px-3 text-[#B89080] font-medium">Row</th>
                <th className="text-left py-2 px-3 text-[#B89080] font-medium">SKU</th>
                <th className="text-left py-2 px-3 text-[#B89080] font-medium">Product</th>
                <th className="text-left py-2 px-3 text-[#B89080] font-medium">Category</th>
                <th className="text-right py-2 px-3 text-[#B89080] font-medium">Current Qty</th>
                <th className="text-right py-2 px-3 text-[#B89080] font-medium">New Qty</th>
                <th className="text-right py-2 px-3 text-[#B89080] font-medium">Change</th>
                <th className="text-right py-2 px-3 text-[#B89080] font-medium">Threshold</th>
                <th className="text-right py-2 px-3 text-[#B89080] font-medium">Price</th>
                <th className="text-right py-2 px-3 text-[#B89080] font-medium">Cost Price</th>
                <th className="text-center py-2 px-3 text-[#B89080] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((preview, index) => {
                const error = getRowError(preview.row.rowNumber)
                return (
                  <tr
                    key={index}
                    className={`border-b border-[#FDE8DF] ${
                      preview.hasError ? 'bg-[#FDECEA]' : 'hover:bg-[#FDF6F0]'
                    }`}
                  >
                    <td className="py-2 px-3 text-[#B89080]">{preview.row.rowNumber}</td>
                    <td className="py-2 px-3 font-mono text-[#7A3E2E]">
                      {preview.row.sku || '—'}
                    </td>
                    <td className="py-2 px-3 text-[#7A3E2E]">
                      {preview.match.product?.name || preview.row.productName}
                      {error && (
                        <p className="text-[#C05050] text-xs mt-0.5">{error}</p>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[#7A3E2E]">
                      {preview.match.product?.categories?.name || preview.row.category || '—'}
                    </td>
                    <td className="py-2 px-3 text-right text-[#B89080]">
                      {preview.currentQuantity}
                    </td>
                    <td className="py-2 px-3 text-right text-[#7A3E2E] font-medium">
                      {preview.newQuantity !== null ? preview.newQuantity : '—'}
                    </td>
                    <td className={`py-2 px-3 text-right font-medium ${
                      preview.quantityChange > 0 ? 'text-green-600' :
                      preview.quantityChange < 0 ? 'text-[#C05050]' :
                      'text-[#B89080]'
                    }`}>
                      {preview.quantityChange > 0 && '+'}
                      {preview.quantityChange !== 0 ? preview.quantityChange : '—'}
                    </td>
                    <td className="py-2 px-3 text-right text-[#B89080]">
                      {preview.newThreshold !== null ? (
                        <span>
                          {preview.currentThreshold !== preview.newThreshold && (
                            <span className="text-[#7A3E2E] font-medium">
                              {preview.newThreshold}
                            </span>
                          )}
                          {preview.currentThreshold === preview.newThreshold && preview.newThreshold}
                        </span>
                      ) : (
                        preview.currentThreshold
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-[#B89080]">
                      {preview.newPrice !== null && preview.currentPrice !== preview.newPrice ? (
                        <span className="text-[#7A3E2E] font-medium">
                          ₱{preview.newPrice.toLocaleString()}
                        </span>
                      ) : (
                        `₱${preview.currentPrice.toLocaleString()}`
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-[#B89080]">
                      {preview.newCostPrice !== null && preview.currentCostPrice !== preview.newCostPrice ? (
                        <span className="text-[#7A3E2E] font-medium">
                          ₱{preview.newCostPrice.toLocaleString()}
                        </span>
                      ) : (
                        `₱${preview.currentCostPrice.toLocaleString()}`
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {preview.hasError ? (
                        <X className="w-4 h-4 text-[#C05050] mx-auto" />
                      ) : preview.match.matchedBy === 'name' ? (
                        <AlertTriangle className="w-4 h-4 text-[#E8896A] mx-auto" title="Matched by name" />
                      ) : (
                        <Check className="w-4 h-4 text-green-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

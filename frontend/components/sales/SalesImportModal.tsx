'use client'

import { useState } from 'react'
import { X, Upload, Download, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseSalesFile, type ParsedSaleItem, type SalesParseResult } from '@/lib/import-sales-parser'
import { generateSalesTemplate } from '@/lib/generate-sales-template'
import { toast } from 'sonner'
import type { Product } from '@/types'

interface SalesImportModalProps {
  open: boolean
  onClose: () => void
  onImport: (sales: ParsedSaleItem[]) => Promise<void>
  products: Product[]
}

export function SalesImportModal({ open, onClose, onImport, products }: SalesImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<SalesParseResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [step, setStep] = useState<'upload' | 'preview'>('upload')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]

    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV file')
      return
    }

    setFile(selectedFile)
    parseFile(selectedFile)
  }

  async function parseFile(file: File) {
    try {
      const result = await parseSalesFile(file)
      setParseResult(result)
      
      if (result.errors.length === 0 && result.sales.length > 0) {
        setStep('preview')
      } else if (result.errors.length > 0) {
        toast.error(`Found ${result.errors.length} error${result.errors.length > 1 ? 's' : ''} in the file`)
      }
    } catch (error) {
      toast.error('Failed to parse file')
      console.error(error)
    }
  }

  async function handleImport() {
    if (!parseResult || parseResult.sales.length === 0) return

    setImporting(true)
    try {
      await onImport(parseResult.sales)
      toast.success(`${parseResult.sales.length} sale${parseResult.sales.length > 1 ? 's' : ''} imported successfully`)
      handleClose()
    } catch (error) {
      toast.error('Failed to import sales')
      console.error(error)
    } finally {
      setImporting(false)
    }
  }

  function handleClose() {
    setFile(null)
    setParseResult(null)
    setStep('upload')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl border border-[#F2C4B0] w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2C4B0]">
          <div>
            <h2 className="text-sm font-medium text-[#7A3E2E]">Import</h2>
            <p className="text-xs text-[#B89080] mt-0.5">
              Import past sales data for analytics and reporting
            </p>
          </div>
          <button onClick={handleClose} className="text-[#B89080] hover:text-[#7A3E2E]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'upload' ? (
            <div className="space-y-4">
              {/* Download Template */}
              <div className="bg-[#FDF6F0] rounded-xl p-4 border border-[#F2C4B0]">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-[#E8896A] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-[#7A3E2E] mb-1">
                      Download Template First
                    </h3>
                    <p className="text-xs text-[#B89080] mb-3">
                      Use our template to ensure your data is formatted correctly. 
                      The template includes instructions and sample data.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateSalesTemplate}
                      className="border-[#E8896A] text-[#E8896A] hover:bg-[#FDE8DF]"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div>
                <label className="block text-xs font-medium text-[#7A3E2E] mb-2">
                  Upload Sales Data
                </label>
                <div className="border-2 border-dashed border-[#F2C4B0] rounded-xl p-8 text-center hover:border-[#E8896A] transition-colors">
                  <Upload className="w-8 h-8 text-[#E8896A] mx-auto mb-3" />
                  <p className="text-sm text-[#7A3E2E] mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-[#B89080] mb-3">
                    Excel (.xlsx, .xls) or CSV files
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="sales-file-input"
                  />
                  <label htmlFor="sales-file-input">
                    <Button size="sm" className="bg-[#E8896A] hover:bg-[#C1614A] text-white" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* Errors */}
              {parseResult && parseResult.errors.length > 0 && (
                <div className="bg-[#FDECEA] rounded-xl p-4 border border-[#F2C4B0]">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-[#C05050] shrink-0 mt-0.5" />
                    <h4 className="text-sm font-medium text-[#C05050]">
                      {parseResult.errors.length} Error{parseResult.errors.length > 1 ? 's' : ''} Found
                    </h4>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {parseResult.errors.slice(0, 10).map((error, i) => (
                      <p key={i} className="text-xs text-[#C05050]">
                        Row {error.row}: {error.field} - {error.message}
                      </p>
                    ))}
                    {parseResult.errors.length > 10 && (
                      <p className="text-xs text-[#C05050] font-medium">
                        +{parseResult.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#FDF6F0] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#B89080] mb-1">Total Sales</p>
                  <p className="text-lg font-medium text-[#7A3E2E]">
                    {parseResult?.sales.length || 0}
                  </p>
                </div>
                <div className="bg-[#FDF6F0] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#B89080] mb-1">Warnings</p>
                  <p className="text-lg font-medium text-[#E8896A]">
                    {parseResult?.warnings.length || 0}
                  </p>
                </div>
                <div className="bg-[#FDF6F0] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#B89080] mb-1">Errors</p>
                  <p className="text-lg font-medium text-[#C05050]">
                    {parseResult?.errors.length || 0}
                  </p>
                </div>
              </div>

              {/* Warnings */}
              {parseResult && parseResult.warnings.length > 0 && (
                <div className="bg-[#FFF3E0] rounded-xl p-4 border border-[#F2C4B0]">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-[#E65100] shrink-0 mt-0.5" />
                    <h4 className="text-sm font-medium text-[#E65100]">
                      {parseResult.warnings.length} Warning{parseResult.warnings.length > 1 ? 's' : ''}
                    </h4>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {parseResult.warnings.map((warning, i) => (
                      <p key={i} className="text-xs text-[#E65100]">
                        Row {warning.row}: {warning.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div>
                <h4 className="text-xs font-medium text-[#7A3E2E] mb-2">
                  Preview (first 5 sales)
                </h4>
                <div className="border border-[#F2C4B0] rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#FDF6F0] border-b border-[#F2C4B0]">
                          <th className="text-left py-2 px-3 text-[#B89080] font-medium">Date</th>
                          <th className="text-left py-2 px-3 text-[#B89080] font-medium">Product</th>
                          <th className="text-right py-2 px-3 text-[#B89080] font-medium">Qty</th>
                          <th className="text-right py-2 px-3 text-[#B89080] font-medium">Price</th>
                          <th className="text-right py-2 px-3 text-[#B89080] font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseResult?.sales.slice(0, 5).map((sale, i) => (
                          <tr key={i} className="border-b border-[#FDE8DF]">
                            <td className="py-2 px-3 text-[#7A3E2E]">
                              {sale.date} {sale.time && <span className="text-[#B89080]">{sale.time}</span>}
                            </td>
                            <td className="py-2 px-3 text-[#7A3E2E]">
                              {sale.productName || sale.sku}
                            </td>
                            <td className="py-2 px-3 text-[#7A3E2E] text-right">{sale.quantity}</td>
                            <td className="py-2 px-3 text-[#7A3E2E] text-right">₱{sale.unitPrice.toFixed(2)}</td>
                            <td className="py-2 px-3 text-[#7A3E2E] font-medium text-right">₱{sale.totalAmount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parseResult && parseResult.sales.length > 5 && (
                    <div className="bg-[#FDF6F0] py-2 px-3 text-center">
                      <p className="text-xs text-[#B89080]">
                        +{parseResult.sales.length - 5} more sales
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-[#FDE8DF] rounded-xl p-4 border border-[#F2C4B0]">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#C1614A] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-[#C1614A] mb-1">Important</h4>
                    <p className="text-xs text-[#7A3E2E]">
                      This import is for historical data only. Inventory levels will NOT be adjusted. 
                      Products must already exist in your inventory.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[#F2C4B0]">
          <Button
            variant="outline"
            onClick={step === 'preview' ? () => setStep('upload') : handleClose}
            className="border-[#F2C4B0] text-[#7A3E2E]"
          >
            {step === 'preview' ? 'Back' : 'Cancel'}
          </Button>
          {step === 'preview' && (
            <Button
              onClick={handleImport}
              disabled={importing || !parseResult || parseResult.sales.length === 0}
              className="bg-[#E8896A] hover:bg-[#C1614A] text-white"
            >
              {importing ? 'Importing...' : `Import ${parseResult?.sales.length || 0} Sales`}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

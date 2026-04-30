'use client'

import { useState, useRef } from 'react'
import { CheckCircle, AlertCircle, Download, FileSpreadsheet } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { parseImportFile, type ImportRow, type ParseResult } from '@/lib/excel'
import type { ProductCreateWithInventory } from '@/components/forms/ProductForm'

import { generateProductsTemplate } from '@/lib/generate-products-template'

function downloadTemplate() {
  generateProductsTemplate()
}

interface CsvImportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (products: ProductCreateWithInventory[], categoryNames: string[], fileName?: string) => Promise<{ success: number; failed: number }>
}

export function CsvImport({ open, onOpenChange, onImport }: CsvImportProps) {
  const [parsed, setParsed] = useState<ParseResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setParseError(null)
    setFileName(file.name)
    try {
      const result = await parseImportFile(file)
      setParsed(result)
      setDone(false)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse file')
    }
  }

  async function handleImport() {
    if (!parsed?.rows.length) return
    setImporting(true)
    try {
      const products: ProductCreateWithInventory[] = parsed.rows.map(row => ({
        name: row.name,
        sku: row.sku,
        price: row.price,
        cost_price: row.cost_price,
        category_id: null, // will be resolved by parent after category creation
        image_url: row.image_url ?? null,
        initial_quantity: row.initial_quantity,
        low_stock_threshold: row.low_stock_threshold,
        _categoryName: row.categoryName, // pass raw name for parent to resolve
      } as ProductCreateWithInventory & { _categoryName?: string }))

      const result = await onImport(products, parsed.categoryNames, fileName)
      setImportResult(result)
      setDone(true)
      setParsed(null)
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setParsed(null)
    setDone(false)
    setImportResult(null)
    setParseError(null)
    setFileName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={open => { onOpenChange(open); if (!open) reset() }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-[#F2C4B0]">
        <DialogHeader>
          <div>
            <DialogTitle className="text-sm font-medium text-[#7A3E2E]">Import</DialogTitle>
            <p className="text-xs text-[#B89080] mt-0.5">
              Import products with inventory quantities
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Template download */}
          <div className="bg-[#FDF6F0] rounded-xl p-4 border border-[#F2C4B0]">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-[#E8896A] shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-[#7A3E2E] mb-1">
                  Download Template First
                </h3>
                <p className="text-xs text-[#B89080] mb-3">
                  Use our template to ensure your data is formatted correctly. 
                  The template includes instructions and sample data.
                </p>
                <button onClick={downloadTemplate}
                  className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#E8896A] text-xs text-[#E8896A] hover:bg-[#FDE8DF] transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Download Template
                </button>
              </div>
            </div>
          </div>

          {/* Drop zone */}
          {!parsed && !done && (
            <div>
              <label className="block text-xs font-medium text-[#7A3E2E] mb-2">
                Upload Products Data
              </label>
              <label
                className="flex flex-col items-center justify-center border-2 border-dashed border-[#F2C4B0] rounded-xl p-8 cursor-pointer hover:border-[#E8896A] hover:bg-[#FDF6F0] transition-colors"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              >
                <FileSpreadsheet className="w-8 h-8 text-[#E8896A] mb-3" />
                <p className="text-sm text-[#7A3E2E] mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-[#B89080] mb-3">Excel (.xlsx, .xls) or CSV files</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <span className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-[#E8896A] hover:bg-[#C1614A] text-white text-xs transition-colors">
                  Choose File
                </span>
              </label>
            </div>
          )}

          {parseError && (
            <div className="bg-[#FDECEA] rounded-xl p-4 border border-[#F2C4B0]">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#C05050] shrink-0 mt-0.5" />
                <span className="text-xs text-[#C05050]">{parseError}</span>
              </div>
            </div>
          )}

          {/* Parse results */}
          {parsed && !done && (
            <div className="flex flex-col gap-3">
              {parsed.rows.length > 0 && (
                <div className="bg-[#FDE8DF] rounded-xl p-4 border border-[#F2C4B0]">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#C1614A] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-xs text-[#7A3E2E]">
                        <span className="font-medium">{parsed.rows.length} products</span> ready to import
                      </span>
                      {parsed.categoryNames.length > 0 && (
                        <p className="text-xs text-[#B89080] mt-1">
                          {parsed.categoryNames.length} new {parsed.categoryNames.length === 1 ? 'category' : 'categories'} will be created:{' '}
                          <span className="text-[#7A3E2E]">{parsed.categoryNames.join(', ')}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {parsed.errors.length > 0 && (
                <div className="bg-[#FDECEA] rounded-xl p-4 border border-[#F2C4B0]">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-[#C05050] shrink-0 mt-0.5" />
                    <span className="text-xs text-[#C05050] font-medium">{parsed.errors.length} rows skipped</span>
                  </div>
                  <ul className="text-xs text-[#C05050] space-y-1 ml-6">
                    {parsed.errors.slice(0, 5).map((e, i) => (
                      <li key={i}>Row {e.row}: {e.message}</li>
                    ))}
                    {parsed.errors.length > 5 && <li>…and {parsed.errors.length - 5} more</li>}
                  </ul>
                </div>
              )}

              {/* Preview table */}
              {parsed.rows.length > 0 && (
                <div className="border border-[#F2C4B0] rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#F2C4B0] bg-[#FDF6F0]">
                        <th className="text-left py-2 px-3 text-[#B89080]">Name</th>
                        <th className="text-left py-2 px-3 text-[#B89080]">SKU</th>
                        <th className="text-left py-2 px-3 text-[#B89080]">Category</th>
                        <th className="text-left py-2 px-3 text-[#B89080]">Price</th>
                        <th className="text-left py-2 px-3 text-[#B89080]">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-[#FDE8DF]">
                          <td className="py-2 px-3 text-[#7A3E2E]">{row.name}</td>
                          <td className="py-2 px-3 text-[#B89080] font-mono">{row.sku}</td>
                          <td className="py-2 px-3 text-[#7A3E2E]">{row.categoryName ?? '—'}</td>
                          <td className="py-2 px-3 text-[#7A3E2E]">₱{row.price}</td>
                          <td className="py-2 px-3 text-[#7A3E2E]">{row.initial_quantity}</td>
                        </tr>
                      ))}
                      {parsed.rows.length > 5 && (
                        <tr>
                          <td colSpan={5} className="py-2 px-3 text-[#B89080] text-center">
                            +{parsed.rows.length - 5} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={reset}
                  className="flex-1 h-8 px-2.5 text-xs border border-[#F2C4B0] text-[#7A3E2E] rounded-lg hover:bg-[#FDE8DF] transition-colors">
                  Choose different file
                </button>
                {parsed.rows.length > 0 && (
                  <button onClick={handleImport} disabled={importing}
                    className="flex-1 h-8 px-2.5 text-xs bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors disabled:opacity-50">
                    {importing ? 'Importing…' : `Import ${parsed.rows.length} products`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success */}
          {done && importResult && (
            <div className="flex flex-col items-center py-8 gap-3">
              {importResult.failed === 0 ? (
                <>
                  <CheckCircle className="w-10 h-10 text-[#C1614A]" />
                  <p className="text-sm font-medium text-[#7A3E2E]">Import complete!</p>
                  <p className="text-xs text-[#B89080]">
                    {importResult.success} product{importResult.success !== 1 ? 's' : ''} imported successfully
                  </p>
                </>
              ) : importResult.success > 0 ? (
                <>
                  <AlertCircle className="w-10 h-10 text-[#E8896A]" />
                  <p className="text-sm font-medium text-[#7A3E2E]">Partial import</p>
                  <p className="text-xs text-[#B89080]">
                    {importResult.success} succeeded, {importResult.failed} failed
                  </p>
                  <p className="text-xs text-[#C05050]">
                    Failed products may have duplicate SKUs or invalid data
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-10 h-10 text-[#C05050]" />
                  <p className="text-sm font-medium text-[#C05050]">Import failed</p>
                  <p className="text-xs text-[#B89080]">
                    All {importResult.failed} products failed to import
                  </p>
                  <p className="text-xs text-[#C05050]">
                    Check for duplicate SKUs or invalid data
                  </p>
                </>
              )}
              <button onClick={() => onOpenChange(false)}
                className="h-8 px-3 text-xs bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

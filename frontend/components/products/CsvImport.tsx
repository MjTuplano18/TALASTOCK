'use client'

import { useState, useRef } from 'react'
import { CheckCircle, AlertCircle, Download, FileSpreadsheet } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { parseImportFile, type ImportRow, type ParseResult } from '@/lib/excel'
import type { ProductCreateWithInventory } from '@/components/forms/ProductForm'

function downloadTemplate() {
  // Dynamic import to avoid SSR issues
  import('xlsx').then(XLSX => {
    const rows = [
      {
        name: 'Sample Product',
        sku: 'PROD-001',
        price: 100,
        cost_price: 75,
        category: 'Electronics',
        initial_quantity: 50,
        low_stock_threshold: 10,
        image_url: '',
      },
      {
        name: 'Another Product',
        sku: 'PROD-002',
        price: 250,
        cost_price: 180,
        category: 'Chocolates',
        initial_quantity: 100,
        low_stock_threshold: 20,
        image_url: '',
      },
    ]
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 16 }, { wch: 18 }, { wch: 30 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Products')
    XLSX.writeFile(wb, 'talastock-import-template.xlsx')
  })
}

interface CsvImportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (products: ProductCreateWithInventory[], categoryNames: string[]) => Promise<void>
}

export function CsvImport({ open, onOpenChange, onImport }: CsvImportProps) {
  const [parsed, setParsed] = useState<ParseResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setParseError(null)
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

      await onImport(products, parsed.categoryNames)
      setDone(true)
      setParsed(null)
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setParsed(null)
    setDone(false)
    setParseError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={open => { onOpenChange(open); if (!open) reset() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#7A3E2E]">Import Products</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Template download */}
          <button onClick={downloadTemplate}
            className="flex items-center gap-2 text-xs text-[#E8896A] hover:text-[#C1614A] transition-colors w-fit">
            <Download className="w-3.5 h-3.5" />
            Download Excel template (.xlsx)
          </button>

          {/* Drop zone */}
          {!parsed && !done && (
            <label
              className="flex flex-col items-center justify-center border-2 border-dashed border-[#F2C4B0] rounded-xl p-8 cursor-pointer hover:border-[#E8896A] hover:bg-[#FDF6F0] transition-colors"
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            >
              <FileSpreadsheet className="w-8 h-8 text-[#E8896A] mb-2" />
              <p className="text-sm text-[#7A3E2E] font-medium">Click or drag to upload</p>
              <p className="text-xs text-[#B89080] mt-1">Supports .xlsx, .xls, .csv</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
          )}

          {parseError && (
            <div className="flex items-center gap-2 bg-[#FDECEA] rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 text-[#C05050] shrink-0" />
              <span className="text-sm text-[#C05050]">{parseError}</span>
            </div>
          )}

          {/* Parse results */}
          {parsed && !done && (
            <div className="flex flex-col gap-3">
              {parsed.rows.length > 0 && (
                <div className="flex flex-col gap-1 bg-[#FDE8DF] rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#C1614A] shrink-0" />
                    <span className="text-sm text-[#7A3E2E]">
                      <span className="font-medium">{parsed.rows.length} products</span> ready to import
                    </span>
                  </div>
                  {parsed.categoryNames.length > 0 && (
                    <p className="text-xs text-[#B89080] ml-6">
                      {parsed.categoryNames.length} new {parsed.categoryNames.length === 1 ? 'category' : 'categories'} will be created:{' '}
                      <span className="text-[#7A3E2E]">{parsed.categoryNames.join(', ')}</span>
                    </p>
                  )}
                </div>
              )}

              {parsed.errors.length > 0 && (
                <div className="bg-[#FDECEA] rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-[#C05050] shrink-0" />
                    <span className="text-sm text-[#C05050] font-medium">{parsed.errors.length} rows skipped</span>
                  </div>
                  <ul className="text-xs text-[#C05050] space-y-0.5 ml-6">
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
                  className="flex-1 py-2 text-sm border border-[#F2C4B0] text-[#7A3E2E] rounded-lg hover:bg-[#FDE8DF] transition-colors">
                  Choose different file
                </button>
                {parsed.rows.length > 0 && (
                  <button onClick={handleImport} disabled={importing}
                    className="flex-1 py-2 text-sm bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors disabled:opacity-50">
                    {importing ? 'Importing…' : `Import ${parsed.rows.length} products`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success */}
          {done && (
            <div className="flex flex-col items-center py-6 gap-3">
              <CheckCircle className="w-10 h-10 text-[#C1614A]" />
              <p className="text-sm font-medium text-[#7A3E2E]">Import complete!</p>
              <button onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

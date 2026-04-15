'use client'

import { useState, useEffect } from 'react'
import { X, Download, Loader2, CheckCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileUploader } from './FileUploader'
import { ImportPreview } from './ImportPreview'
import { ValidationErrors } from './ValidationErrors'
import { parseImportFile, type ParsedRow } from '@/lib/import-parser'
import { matchAllProducts, type MatchResult } from '@/lib/product-matcher'
import { validateImportData, type ValidationResult } from '@/lib/import-validator'
import { generateImportTemplate } from '@/lib/generate-import-template'
import { toast } from 'sonner'
import type { Product, InventoryItem } from '@/types'

interface ImportModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  products: Product[]
  inventory: InventoryItem[]
  onImport: (updates: Array<{
    productId: string
    quantity: number | null
    threshold: number | null
    price: number | null
    costPrice: number | null
    change: number
  }>, mode: 'replace' | 'add', filename: string) => Promise<{ imported: number; skipped: number }>
}

type ImportStep = 'upload' | 'parsing' | 'preview' | 'executing' | 'complete'

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

export function ImportModal({ open, onClose, onSuccess, products, inventory, onImport }: ImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'replace' | 'add'>('replace')
  const [dryRun, setDryRun] = useState(false)
  const [partialImport, setPartialImport] = useState(false)
  
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('upload')
        setFile(null)
        setMode('replace')
        setDryRun(false)
        setPartialImport(false)
        setParsedRows([])
        setMatches([])
        setValidation(null)
        setPreviewRows([])
        setImportResult(null)
        setError(null)
      }, 300)
    }
  }, [open])

  async function handleFileSelect(selectedFile: File) {
    setFile(selectedFile)
    setStep('parsing')
    setError(null)

    try {
      // Parse file
      const rows = await parseImportFile(selectedFile)
      
      if (rows.length === 0) {
        throw new Error('No data found in file')
      }
      
      if (rows.length > 1000) {
        throw new Error('File contains more than 1000 rows. Please split into smaller files.')
      }
      
      setParsedRows(rows)
      
      // Match products
      const productMatches = matchAllProducts(rows, products)
      setMatches(productMatches)
      
      // Validate
      const validationResult = validateImportData(rows, productMatches)
      setValidation(validationResult)
      
      // Create preview
      const preview = rows.map((row, index) => {
        const match = productMatches[index]
        const inventoryItem = match.product 
          ? inventory.find(inv => inv.product_id === match.product?.id)
          : null
        
        const currentQty = inventoryItem?.quantity || 0
        const currentThreshold = inventoryItem?.low_stock_threshold || 10
        const currentPrice = match.product?.price || 0
        const currentCostPrice = match.product?.cost_price || 0
        
        let newQty = currentQty
        if (row.quantity !== null) {
          newQty = mode === 'replace' ? row.quantity : currentQty + row.quantity
        }
        
        const newThreshold = row.threshold !== null ? row.threshold : currentThreshold
        const newPrice = row.price !== null ? row.price : currentPrice
        const newCostPrice = row.costPrice !== null ? row.costPrice : currentCostPrice
        
        const hasError = validationResult.errors.some(e => e.rowNumber === row.rowNumber)
        
        return {
          row,
          match,
          currentQuantity: currentQty,
          currentThreshold,
          currentPrice,
          currentCostPrice,
          newQuantity: row.quantity !== null ? newQty : null,
          newThreshold: row.threshold !== null ? newThreshold : null,
          newPrice: row.price !== null ? newPrice : null,
          newCostPrice: row.costPrice !== null ? newCostPrice : null,
          quantityChange: row.quantity !== null ? newQty - currentQty : 0,
          hasError,
        }
      })
      
      setPreviewRows(preview)
      setStep('preview')
      
    } catch (err: any) {
      console.error('Parse error:', err)
      setError(err.message || 'Failed to parse file')
      setStep('upload')
      toast.error(err.message || 'Failed to parse file')
    }
  }

  // Recalculate preview when mode changes
  useEffect(() => {
    if (parsedRows.length > 0 && matches.length > 0) {
      const preview = parsedRows.map((row, index) => {
        const match = matches[index]
        const inventoryItem = match.product 
          ? inventory.find(inv => inv.product_id === match.product?.id)
          : null
        
        const currentQty = inventoryItem?.quantity || 0
        const currentThreshold = inventoryItem?.low_stock_threshold || 10
        const currentPrice = match.product?.price || 0
        const currentCostPrice = match.product?.cost_price || 0
        
        let newQty = currentQty
        if (row.quantity !== null) {
          newQty = mode === 'replace' ? row.quantity : currentQty + row.quantity
        }
        
        const newThreshold = row.threshold !== null ? row.threshold : currentThreshold
        const newPrice = row.price !== null ? row.price : currentPrice
        const newCostPrice = row.costPrice !== null ? row.costPrice : currentCostPrice
        
        const hasError = validation?.errors.some(e => e.rowNumber === row.rowNumber) || false
        
        return {
          row,
          match,
          currentQuantity: currentQty,
          currentThreshold,
          currentPrice,
          currentCostPrice,
          newQuantity: row.quantity !== null ? newQty : null,
          newThreshold: row.threshold !== null ? newThreshold : null,
          newPrice: row.price !== null ? newPrice : null,
          newCostPrice: row.costPrice !== null ? newCostPrice : null,
          quantityChange: row.quantity !== null ? newQty - currentQty : 0,
          hasError,
        }
      })
      
      setPreviewRows(preview)
    }
  }, [mode, parsedRows, matches, inventory, validation])

  async function handleConfirmImport() {
    if (!validation?.valid && !partialImport) {
      toast.error('Please fix all errors before importing')
      return
    }

    setStep('executing')

    try {
      // Filter rows to import
      const rowsToImport = partialImport 
        ? previewRows.filter(r => !r.hasError)
        : previewRows

      if (dryRun) {
        // Dry run - just show success without saving
        await new Promise(resolve => setTimeout(resolve, 1000))
        setImportResult({ imported: rowsToImport.length, skipped: previewRows.length - rowsToImport.length })
        setStep('complete')
        toast.success(`Dry run complete. ${rowsToImport.length} rows would be imported.`)
        return
      }

      // Actual import - call the import function
      const result = await executeImport(rowsToImport, mode)
      
      setImportResult(result)
      setStep('complete')
      toast.success(`Successfully imported ${result.imported} items${result.skipped > 0 ? `, skipped ${result.skipped}` : ''}`)
      
      // Refresh inventory
      setTimeout(() => {
        onSuccess()
      }, 1500)
      
    } catch (err: any) {
      console.error('Import error:', err)
      setError(err.message || 'Import failed')
      setStep('preview')
      toast.error(err.message || 'Import failed. Please try again.')
    }
  }

  async function executeImport(rows: PreviewRow[], importMode: 'replace' | 'add') {
    const updates = rows
      .filter(r => r.match.product) // Only import rows with matched products
      .map(r => ({
        productId: r.match.product!.id,
        quantity: r.newQuantity,
        threshold: r.newThreshold,
        price: r.newPrice,
        costPrice: r.newCostPrice,
        change: r.quantityChange,
      }))

    return await onImport(updates, importMode, file?.name || 'import.xlsx')
  }

  function handleDownloadTemplate() {
    generateImportTemplate()
    toast.success('Template downloaded')
  }

  const canConfirm = validation?.valid || (partialImport && previewRows.some(r => !r.hasError))

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-[#7A3E2E]">
            {step === 'upload' && 'Import Inventory'}
            {step === 'parsing' && 'Parsing File...'}
            {step === 'preview' && 'Preview Import'}
            {step === 'executing' && 'Importing...'}
            {step === 'complete' && 'Import Complete'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-4">
              <FileUploader onFileSelect={handleFileSelect} />
              
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#F2C4B0]">
                <div>
                  <label className="text-sm font-medium text-[#7A3E2E] mb-2 block">
                    Import Mode
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="replace"
                        checked={mode === 'replace'}
                        onChange={(e) => setMode(e.target.value as 'replace' | 'add')}
                        className="text-[#E8896A]"
                      />
                      <span className="text-sm text-[#7A3E2E]">Replace (set to value)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="add"
                        checked={mode === 'add'}
                        onChange={(e) => setMode(e.target.value as 'replace' | 'add')}
                        className="text-[#E8896A]"
                      />
                      <span className="text-sm text-[#7A3E2E]">Add (add to current)</span>
                    </label>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    className="rounded text-[#E8896A]"
                  />
                  <span className="text-sm text-[#7A3E2E]">Dry Run (preview only, don't save)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={partialImport}
                    onChange={(e) => setPartialImport(e.target.checked)}
                    className="rounded text-[#E8896A]"
                  />
                  <span className="text-sm text-[#7A3E2E]">Partial Import (skip errors, import valid rows)</span>
                </label>
              </div>
            </div>
          )}

          {/* Parsing Step */}
          {step === 'parsing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#E8896A] animate-spin mb-4" />
              <p className="text-sm text-[#7A3E2E]">Parsing and validating file...</p>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && validation && (
            <div className="space-y-4">
              {dryRun && (
                <div className="bg-[#FFF9E6] border border-[#E8896A] rounded-xl p-3 flex items-center gap-2">
                  <span className="text-sm font-medium text-[#7A3E2E]">
                    🔍 DRY RUN MODE - No changes will be saved
                  </span>
                </div>
              )}
              
              <ValidationErrors errors={validation.errors} warnings={validation.warnings} />
              
              <ImportPreview 
                previewRows={previewRows}
                mode={mode}
                errors={validation.errors}
              />
            </div>
          )}

          {/* Executing Step */}
          {step === 'executing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#E8896A] animate-spin mb-4" />
              <p className="text-sm text-[#7A3E2E]">
                {dryRun ? 'Running dry run...' : 'Importing inventory...'}
              </p>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && importResult && (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-lg font-medium text-[#7A3E2E] mb-2">
                {dryRun ? 'Dry Run Complete' : 'Import Complete'}
              </h3>
              <p className="text-sm text-[#B89080] mb-4">
                {importResult.imported} rows {dryRun ? 'would be' : 'were'} imported
                {importResult.skipped > 0 && `, ${importResult.skipped} skipped`}
              </p>
              {!dryRun && (
                <p className="text-xs text-[#B89080]">
                  Inventory will refresh automatically...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#F2C4B0]">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={step === 'parsing' || step === 'executing'}
            className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
          >
            {step === 'complete' ? 'Close' : 'Cancel'}
          </Button>

          {step === 'preview' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('upload')}
                className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={!canConfirm}
                className="bg-[#E8896A] hover:bg-[#C1614A] text-white"
              >
                {dryRun ? 'Run Dry Run' : 'Confirm Import'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

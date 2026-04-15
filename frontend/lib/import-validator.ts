import type { ParsedRow } from './import-parser'
import type { MatchResult } from './product-matcher'

export interface ValidationError {
  rowNumber: number
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

export function validateImportData(
  rows: ParsedRow[],
  matches: MatchResult[]
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  
  // Check for duplicates within file
  const seen = new Map<string, number>()
  rows.forEach(row => {
    const key = (row.sku || row.productName).toLowerCase().trim()
    if (key && seen.has(key)) {
      errors.push({
        rowNumber: row.rowNumber,
        field: 'sku/name',
        message: `Duplicate entry (also appears in row ${seen.get(key)})`,
        severity: 'error',
      })
    }
    if (key) seen.set(key, row.rowNumber)
  })
  
  // Validate each row
  rows.forEach((row, index) => {
    const match = matches[index]
    
    // Required fields
    if (!row.sku && !row.productName) {
      errors.push({
        rowNumber: row.rowNumber,
        field: 'sku/name',
        message: 'Either SKU or Product Name is required',
        severity: 'error',
      })
      return
    }
    
    // Product matching
    if (match.matchedBy === 'none') {
      errors.push({
        rowNumber: row.rowNumber,
        field: 'product',
        message: 'Product not found in database',
        severity: 'error',
      })
    } else if (match.matchedBy === 'ambiguous') {
      errors.push({
        rowNumber: row.rowNumber,
        field: 'product',
        message: 'Multiple products match this name. Please use SKU for unique identification.',
        severity: 'error',
      })
    }
    
    // Validate quantity
    if (row.quantity !== null) {
      if (row.quantity < 0) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'quantity',
          message: 'Quantity cannot be negative',
          severity: 'error',
        })
      }
      if (!Number.isInteger(row.quantity)) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'quantity',
          message: 'Quantity must be a whole number',
          severity: 'error',
        })
      }
    } else {
      // No quantity provided
      if (row.threshold === null) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'quantity/threshold',
          message: 'At least one of Quantity or Threshold must be provided',
          severity: 'error',
        })
      }
    }
    
    // Validate threshold
    if (row.threshold !== null) {
      if (row.threshold < 0) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'threshold',
          message: 'Threshold cannot be negative',
          severity: 'error',
        })
      }
      if (!Number.isInteger(row.threshold)) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'threshold',
          message: 'Threshold must be a whole number',
          severity: 'error',
        })
      }
    }
    
    // Category mismatch warning
    if (match.product && row.category && match.product.categories?.name) {
      if (match.product.categories.name.toLowerCase() !== row.category.toLowerCase()) {
        warnings.push({
          rowNumber: row.rowNumber,
          field: 'category',
          message: `Category mismatch: expected "${match.product.categories.name}", got "${row.category}"`,
          severity: 'warning',
        })
      }
    }
  })
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function groupErrorsByType(errors: ValidationError[]): Record<string, ValidationError[]> {
  const grouped: Record<string, ValidationError[]> = {}
  
  errors.forEach(error => {
    const key = error.field
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(error)
  })
  
  return grouped
}

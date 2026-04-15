import type { ParsedRow } from './import-parser'
import type { Product } from '@/types'

export interface MatchResult {
  product: Product | null
  matchedBy: 'sku' | 'name' | 'none' | 'ambiguous'
}

export function matchProduct(row: ParsedRow, products: Product[]): MatchResult {
  // Strategy 1: Exact SKU match (case-insensitive)
  if (row.sku) {
    const skuMatch = products.find(
      p => p.sku.toLowerCase().trim() === row.sku.toLowerCase().trim()
    )
    if (skuMatch) {
      return { product: skuMatch, matchedBy: 'sku' }
    }
  }
  
  // Strategy 2: Exact product name match (case-insensitive)
  if (row.productName) {
    const nameMatches = products.filter(
      p => p.name.toLowerCase().trim() === row.productName.toLowerCase().trim()
    )
    
    // If exactly one match, use it
    if (nameMatches.length === 1) {
      return { product: nameMatches[0], matchedBy: 'name' }
    }
    
    // If multiple matches, return ambiguous
    if (nameMatches.length > 1) {
      return { product: null, matchedBy: 'ambiguous' }
    }
  }
  
  return { product: null, matchedBy: 'none' }
}

export function matchAllProducts(rows: ParsedRow[], products: Product[]): MatchResult[] {
  return rows.map(row => matchProduct(row, products))
}

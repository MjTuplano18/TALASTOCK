/**
 * Import History & ETL API Client
 * Handles all import history, templates, and rollback operations
 */

import { supabase } from './supabase'
import type {
  ImportHistory,
  ImportStatistics,
  ImportTemplate,
  ImportTemplateCreate,
  ImportTemplateUpdate,
  RollbackRequest,
} from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Get authentication token from session
 */
async function getAuthToken(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ''
  } catch (error) {
    console.error('Failed to get auth token:', error)
    return ''
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken()
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed', message: 'Request failed' }))
    // FastAPI returns errors in 'detail' field, but also support 'message'
    const errorMessage = error.detail || error.message || `HTTP ${response.status}`
    throw new Error(errorMessage)
  }

  const data = await response.json()
  return data.data
}

// ============================================================================
// Import History API
// ============================================================================

export interface GetImportHistoryParams {
  entity_type?: string
  status?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

export async function getImportHistory(
  params: GetImportHistoryParams = {}
): Promise<{
  imports: ImportHistory[]
  total: number
  limit: number
  offset: number
}> {
  const queryParams = new URLSearchParams()
  
  if (params.entity_type) queryParams.append('entity_type', params.entity_type)
  if (params.status) queryParams.append('status', params.status)
  if (params.start_date) queryParams.append('start_date', params.start_date)
  if (params.end_date) queryParams.append('end_date', params.end_date)
  if (params.limit) queryParams.append('limit', params.limit.toString())
  if (params.offset) queryParams.append('offset', params.offset.toString())
  
  const query = queryParams.toString()
  return apiRequest(`/api/v1/imports/history${query ? `?${query}` : ''}`)
}

export async function getImportDetails(importId: string): Promise<ImportHistory> {
  return apiRequest(`/api/v1/imports/history/${importId}`)
}

export async function createImportHistory(data: {
  file_name: string
  entity_type: string
  status: string
  total_rows: number
  successful_rows: number
  failed_rows: number
  errors?: any[]
  warnings?: any[]
  processing_time_ms?: number
}): Promise<ImportHistory> {
  return apiRequest('/api/v1/imports/history', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getImportStatistics(
  days: number = 30
): Promise<{
  statistics: ImportStatistics
  period_days: number
  start_date: string
  end_date: string
}> {
  return apiRequest(`/api/v1/imports/statistics?days=${days}`)
}

// ============================================================================
// Rollback API
// ============================================================================

export async function rollbackImport(
  request: RollbackRequest
): Promise<{
  import_id: string
  rollback_count: number
  errors: any[]
}> {
  return apiRequest('/api/v1/imports/rollback', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// ============================================================================
// Import Templates API
// ============================================================================

export async function getImportTemplates(
  entityType?: string
): Promise<ImportTemplate[]> {
  const query = entityType ? `?entity_type=${entityType}` : ''
  return apiRequest(`/api/v1/imports/templates${query}`)
}

export async function createImportTemplate(
  data: ImportTemplateCreate
): Promise<ImportTemplate> {
  return apiRequest('/api/v1/imports/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateImportTemplate(
  templateId: string,
  data: ImportTemplateUpdate
): Promise<ImportTemplate> {
  return apiRequest(`/api/v1/imports/templates/${templateId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteImportTemplate(templateId: string): Promise<void> {
  return apiRequest(`/api/v1/imports/templates/${templateId}`, {
    method: 'DELETE',
  })
}

// ============================================================================
// Data Snapshot API
// ============================================================================

export async function createDataSnapshot(data: {
  import_id: string
  entity_type: string
  entity_id: string
  operation: 'insert' | 'update' | 'delete'
  old_data?: any
  new_data?: any
}): Promise<void> {
  return apiRequest('/api/v1/imports/snapshots', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

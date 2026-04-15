'use client'

import { AlertTriangle, AlertCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ValidationError } from '@/lib/import-validator'
import { groupErrorsByType } from '@/lib/import-validator'

interface ValidationErrorsProps {
  errors: ValidationError[]
  warnings: ValidationError[]
}

export function ValidationErrors({ errors, warnings }: ValidationErrorsProps) {
  if (errors.length === 0 && warnings.length === 0) return null

  const groupedErrors = groupErrorsByType(errors)
  const groupedWarnings = groupErrorsByType(warnings)

  function downloadErrorReport() {
    const allIssues = [...errors, ...warnings]
    const csv = [
      ['Row', 'Field', 'Severity', 'Message'].join(','),
      ...allIssues.map(issue => 
        [issue.rowNumber, issue.field, issue.severity, `"${issue.message}"`].join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `import-errors-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <div className="bg-[#FDECEA] border border-[#F2C4B0] rounded-xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-[#C05050] shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-[#C05050] mb-2">
                {errors.length} {errors.length === 1 ? 'Error' : 'Errors'} Found
              </h4>
              <p className="text-xs text-[#C05050] mb-3">
                Please fix these errors before importing.
              </p>
              
              <div className="space-y-2">
                {Object.entries(groupedErrors).map(([field, fieldErrors]) => (
                  <div key={field} className="text-xs">
                    <p className="font-medium text-[#7A3E2E] mb-1 capitalize">
                      {field.replace(/_/g, ' ')}:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[#C05050]">
                      {fieldErrors.slice(0, 5).map((error, i) => (
                        <li key={i}>
                          Row {error.rowNumber}: {error.message}
                        </li>
                      ))}
                      {fieldErrors.length > 5 && (
                        <li className="text-[#B89080]">
                          ...and {fieldErrors.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {errors.length > 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadErrorReport}
              className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-white"
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              Download Error Report
            </Button>
          )}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-[#FFF9E6] border border-[#F2C4B0] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#E8896A] shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-[#7A3E2E] mb-2">
                {warnings.length} {warnings.length === 1 ? 'Warning' : 'Warnings'}
              </h4>
              <div className="space-y-2">
                {Object.entries(groupedWarnings).map(([field, fieldWarnings]) => (
                  <div key={field} className="text-xs">
                    <p className="font-medium text-[#7A3E2E] mb-1 capitalize">
                      {field.replace(/_/g, ' ')}:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[#B89080]">
                      {fieldWarnings.slice(0, 3).map((warning, i) => (
                        <li key={i}>
                          Row {warning.rowNumber}: {warning.message}
                        </li>
                      ))}
                      {fieldWarnings.length > 3 && (
                        <li>...and {fieldWarnings.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

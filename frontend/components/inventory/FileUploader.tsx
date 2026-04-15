'use client'

import { useCallback } from 'react'
import { Upload, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
}

export function FileUploader({ onFileSelect, disabled }: FileUploaderProps) {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (disabled) return
    
    const file = e.dataTransfer.files[0]
    if (file) {
      validateAndSelectFile(file)
    }
  }, [disabled])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSelectFile(file)
    }
  }, [])

  function validateAndSelectFile(file: File) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
      alert('Invalid file type. Please upload .xlsx or .csv files only.')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum file size is 5MB.')
      return
    }
    
    onFileSelect(file)
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
        disabled 
          ? "border-[#F2C4B0] bg-[#FDF6F0] cursor-not-allowed opacity-50"
          : "border-[#F2C4B0] hover:border-[#E8896A] hover:bg-[#FDE8DF] cursor-pointer"
      )}
    >
      <input
        type="file"
        id="file-upload"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileInput}
        disabled={disabled}
        className="hidden"
      />
      <label
        htmlFor="file-upload"
        className={cn(
          "flex flex-col items-center gap-3",
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center">
          <FileSpreadsheet className="w-6 h-6 text-[#E8896A]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#7A3E2E] mb-1">
            Drag & drop file here
          </p>
          <p className="text-xs text-[#B89080]">
            or click to browse
          </p>
        </div>
        <p className="text-xs text-[#B89080]">
          Supported: .xlsx, .csv (max 5MB, 1000 rows)
        </p>
      </label>
    </div>
  )
}

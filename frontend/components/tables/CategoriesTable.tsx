'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CategoryForm } from '@/components/forms/CategoryForm'
import { HighlightText } from '@/components/shared/HighlightText'
import { RelativeTime } from '@/components/shared/RelativeTime'
import type { Category } from '@/types'

interface CategoriesTableProps {
  categories: Category[]
  searchQuery?: string
  onUpdate: (id: string, name: string) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export function CategoriesTable({ categories, searchQuery = '', onUpdate, onDelete }: CategoriesTableProps) {
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  async function handleUpdate(name: string) {
    if (!editTarget) return
    setActionLoading(true)
    await onUpdate(editTarget.id, name)
    setActionLoading(false)
    setEditTarget(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setActionLoading(true)
    await onDelete(deleteTarget.id)
    setActionLoading(false)
    setDeleteTarget(null)
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-[#B89080]">No categories yet.</p>
      </div>
    )
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#F2C4B0]">
            <th className="text-left py-3 px-4 text-[#B89080] font-medium">Name</th>
            <th className="text-left py-3 px-4 text-[#B89080] font-medium">Created</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody>
          {categories.map(category => (
            <tr key={category.id} className="border-b border-[#FDE8DF] hover:bg-[#FDF6F0]">
              <td className="py-3 px-4 text-[#7A3E2E]">
                <HighlightText text={category.name} highlight={searchQuery} />
              </td>
              <td className="py-3 px-4 text-[#B89080]">
                <RelativeTime date={category.created_at} />
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2.5 text-[#7A3E2E] hover:text-[#E8896A] hover:bg-[#FDE8DF] transition-colors"
                    onClick={() => setEditTarget(category)}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    <span className="text-xs">Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2.5 text-[#B89080] hover:text-[#C05050] hover:bg-[#FDECEA] transition-colors"
                    onClick={() => setDeleteTarget(category)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    <span className="text-xs">Delete</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <CategoryForm
        open={!!editTarget}
        onOpenChange={open => { if (!open) setEditTarget(null) }}
        category={editTarget}
        onSubmit={handleUpdate}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}
        title="Delete category"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={actionLoading}
        danger
      />
    </>
  )
}

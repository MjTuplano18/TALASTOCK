'use client'

import { useState } from 'react'
import { Pencil, Trash2, MoreVertical, Tag } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CategoryForm } from '@/components/forms/CategoryForm'
import { RelativeTime } from '@/components/shared/RelativeTime'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Category } from '@/types'

interface CategoriesTableMobileProps {
  categories: Category[]
  searchQuery?: string
  onUpdate: (id: string, name: string) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export function CategoriesTableMobile({ 
  categories, 
  searchQuery = '', 
  onUpdate, 
  onDelete 
}: CategoriesTableMobileProps) {
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

  return (
    <>
      <div className="flex flex-col gap-2 p-3">
        {categories.map(category => {
          const initials = category.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

          return (
            <div
              key={category.id}
              className="bg-white border border-[#F2C4B0] rounded-lg p-3 active:bg-[#FDF6F0] transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-[#FDE8DF] border border-[#F2C4B0] flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-[#C1614A]">{initials}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-medium text-[#7A3E2E] truncate">
                      {category.name}
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="h-8 w-8 p-0 rounded-md text-[#B89080] hover:text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors shrink-0 flex items-center justify-center border border-[#F2C4B0] bg-white shadow-sm cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-[#F2C4B0] bg-white shadow-lg">
                        <DropdownMenuItem
                          onClick={() => setEditTarget(category)}
                          className="text-[#7A3E2E] hover:bg-[#FDE8DF] focus:bg-[#FDE8DF]"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(category)}
                          className="text-[#C05050] hover:bg-[#FDECEA] focus:bg-[#FDECEA]"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-xs text-[#B89080]">
                    Created <RelativeTime date={category.created_at} />
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit form */}
      <CategoryForm
        open={!!editTarget}
        onOpenChange={open => { if (!open) setEditTarget(null) }}
        category={editTarget}
        onSubmit={handleUpdate}
        loading={actionLoading}
      />

      {/* Delete confirmation */}
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
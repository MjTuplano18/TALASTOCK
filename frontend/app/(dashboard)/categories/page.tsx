'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoriesTable } from '@/components/tables/CategoriesTable'
import { CategoryForm } from '@/components/forms/CategoryForm'
import { EmptyState } from '@/components/shared/EmptyState'
import { useCategories } from '@/hooks/useCategories'

export default function CategoriesPage() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories()
  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  async function handleCreate(name: string) {
    setFormLoading(true)
    await createCategory(name)
    setFormLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-medium text-[#7A3E2E]">Categories</h1>
          <p className="text-xs text-[#B89080] mt-0.5">Organize your products into categories</p>
        </div>
        <Button
          className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
          onClick={() => setFormOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Category
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#B89080]">Loading categories…</div>
        ) : categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Create categories to organize your products."
            action={
              <Button
                className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
                onClick={() => setFormOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Category
              </Button>
            }
          />
        ) : (
          <CategoriesTable
            categories={categories}
            onUpdate={updateCategory}
            onDelete={deleteCategory}
          />
        )}
      </div>

      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        loading={formLoading}
      />
    </div>
  )
}

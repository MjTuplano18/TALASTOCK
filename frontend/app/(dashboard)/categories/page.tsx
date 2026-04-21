'use client'

import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoriesTable } from '@/components/tables/CategoriesTable'
import { CategoryForm } from '@/components/forms/CategoryForm'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { Pagination } from '@/components/shared/Pagination'
import { useCategories } from '@/hooks/useCategories'

const PAGE_SIZE = 15

export default function CategoriesPage() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories()
  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    setPage(1)
    if (!search) return categories
    return categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  }, [categories, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleCreate(name: string) {
    setFormLoading(true)
    await createCategory(name)
    setFormLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h1 className="text-lg font-medium text-[#7A3E2E]">Categories</h1>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search categories…" />
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[#B89080]">{filtered.length} categories</span>
          <button onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#E8896A] hover:bg-[#C1614A] text-white text-xs transition-colors whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" />
            Add Category
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#B89080]">Loading categories…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'No categories match your search' : 'No categories yet'}
            description={search ? 'Try a different search term.' : 'Create categories to organize your products.'}
            action={!search ? (
              <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#E8896A] hover:bg-[#C1614A] text-white text-xs transition-colors"
                onClick={() => setFormOpen(true)}>
                <Plus className="w-3.5 h-3.5" />Add Category
              </button>
            ) : undefined}
          />
        ) : (
          <>
            <CategoriesTable categories={paginated} searchQuery={search} onUpdate={updateCategory} onDelete={deleteCategory} />
            <Pagination page={page} totalPages={totalPages} totalItems={filtered.length}
              pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </div>

      <CategoryForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} loading={formLoading} />
    </div>
  )
}

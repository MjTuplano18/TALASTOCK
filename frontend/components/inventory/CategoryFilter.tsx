import { FilterSelect } from '@/components/shared/FilterSelect'
import type { Category } from '@/types'

interface CategoryFilterProps {
  value: string
  onChange: (categoryId: string) => void
  categories: Category[]
}

export function CategoryFilter({ value, onChange, categories }: CategoryFilterProps) {
  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      placeholder="All Categories"
      options={categories.map(c => ({ label: c.name, value: c.id }))}
    />
  )
}

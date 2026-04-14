'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Category } from '@/types'

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSubmit: (name: string) => Promise<unknown>
  loading?: boolean
}

export function CategoryForm({
  open,
  onOpenChange,
  category,
  onSubmit,
  loading = false,
}: CategoryFormProps) {
  const isEdit = !!category

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ name: category?.name ?? '' })
    }
  }, [open, category, reset])

  async function onFormSubmit(values: CategoryFormValues) {
    await onSubmit(values.name)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#F2C4B0] max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#7A3E2E]">
            {isEdit ? 'Edit Category' : 'New Category'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4 mt-2">
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">Name</label>
            <Input
              placeholder="e.g. Electronics"
              className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-[#C05050] mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
            >
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

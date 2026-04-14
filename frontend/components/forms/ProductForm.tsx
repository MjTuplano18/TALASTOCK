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
import { SelectNative } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCategories } from '@/hooks/useCategories'
import type { Product, ProductCreate, ProductUpdate } from '@/types'

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  cost_price: z.coerce.number().min(0, 'Cost price must be 0 or greater'),
  category_id: z.string().uuid().nullable().optional(),
  image_url: z.string()
    .url('Enter a valid URL')
    .refine(
      (url) => {
        if (!url) return true // Allow empty
        try {
          const parsed = new URL(url)
          // Only allow HTTPS and common image hosting domains
          const allowedDomains = [
            'imgur.com', 'i.imgur.com',
            'cloudinary.com', 'res.cloudinary.com',
            'supabase.co', 'supabase.in',
            'amazonaws.com', 's3.amazonaws.com',
            'googleusercontent.com',
            'unsplash.com', 'images.unsplash.com',
          ]
          return parsed.protocol === 'https:' && 
                 allowedDomains.some(domain => parsed.hostname.includes(domain))
        } catch {
          return false
        }
      },
      { message: 'Image URL must be HTTPS and from a trusted domain (Imgur, Cloudinary, Supabase, etc.)' }
    )
    .nullable()
    .optional()
    .or(z.literal('')),
  // Inventory fields — only used on create
  initial_quantity: z.coerce.number().int().min(0, 'Quantity must be 0 or greater').optional(),
  low_stock_threshold: z.coerce.number().int().min(0, 'Threshold must be 0 or greater').optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

export interface ProductCreateWithInventory extends ProductCreate {
  initial_quantity?: number
  low_stock_threshold?: number
}

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSubmit: (data: ProductCreateWithInventory | ProductUpdate) => Promise<unknown>
  loading?: boolean
}

export function ProductForm({
  open,
  onOpenChange,
  product,
  onSubmit,
  loading = false,
}: ProductFormProps) {
  const isEdit = !!product
  const { categories } = useCategories()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      cost_price: 0,
      category_id: null,
      image_url: '',
      initial_quantity: 0,
      low_stock_threshold: 10,
    },
  })

  const categoryId = watch('category_id')

  useEffect(() => {
    if (open) {
      reset({
        name: product?.name ?? '',
        sku: product?.sku ?? '',
        price: product?.price ?? 0,
        cost_price: product?.cost_price ?? 0,
        category_id: product?.category_id ?? null,
        image_url: product?.image_url ?? '',
        initial_quantity: product?.inventory?.quantity ?? 0,
        low_stock_threshold: product?.inventory?.low_stock_threshold ?? 10,
      })
    }
  }, [open, product, reset])

  async function onFormSubmit(values: ProductFormValues) {
    const payload: ProductCreateWithInventory | ProductUpdate = {
      name: values.name,
      sku: values.sku,
      price: values.price,
      cost_price: values.cost_price,
      category_id: values.category_id ?? null,
      image_url: values.image_url || null,
      ...(!isEdit && {
        initial_quantity: values.initial_quantity ?? 0,
        low_stock_threshold: values.low_stock_threshold ?? 10,
      }),
    }
    await onSubmit(payload)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#F2C4B0] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#7A3E2E]">
            {isEdit ? 'Edit Product' : 'New Product'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-3 mt-2">
          {/* Name */}
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">Product Name</label>
            <Input
              placeholder="e.g. Wireless Keyboard"
              className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-[#C05050] mt-1">{errors.name.message}</p>}
          </div>

          {/* SKU */}
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">SKU</label>
            <Input
              placeholder="e.g. WK-001"
              className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E] font-mono"
              {...register('sku')}
            />
            {errors.sku && <p className="text-xs text-[#C05050] mt-1">{errors.sku.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">Category</label>
            <SelectNative
              value={categoryId ?? ''}
              onValueChange={val => setValue('category_id', val === '' ? null : val)}
            >
              <option value="">No category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </SelectNative>
          </div>

          {/* Price + Cost Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#B89080] mb-1 block">Price (₱)</label>
              <Input type="text" inputMode="decimal" placeholder="0.00"
                className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
                {...register('price')} />
              {errors.price && <p className="text-xs text-[#C05050] mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="text-xs text-[#B89080] mb-1 block">Cost Price (₱)</label>
              <Input type="text" inputMode="decimal" placeholder="0.00"
                className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
                {...register('cost_price')} />
              {errors.cost_price && <p className="text-xs text-[#C05050] mt-1">{errors.cost_price.message}</p>}
            </div>
          </div>

          {/* Inventory — only on create */}
          {!isEdit && (
            <>
              <div className="border-t border-[#F2C4B0] pt-3">
                <p className="text-xs text-[#B89080] mb-2">Initial Inventory</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#B89080] mb-1 block">Starting Quantity</label>
                    <Input type="text" inputMode="numeric" placeholder="0"
                      className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
                      {...register('initial_quantity')} />
                    {errors.initial_quantity && (
                      <p className="text-xs text-[#C05050] mt-1">{errors.initial_quantity.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-[#B89080] mb-1 block">Low Stock Alert</label>
                    <Input type="text" inputMode="numeric" placeholder="10"
                      className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
                      {...register('low_stock_threshold')} />
                    {errors.low_stock_threshold && (
                      <p className="text-xs text-[#C05050] mt-1">{errors.low_stock_threshold.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Image URL */}
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">
              Image URL <span className="text-[#B89080]">(optional)</span>
            </label>
            <Input type="url" placeholder="https://..."
              className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
              {...register('image_url')} />
            {errors.image_url && <p className="text-xs text-[#C05050] mt-1">{errors.image_url.message}</p>}
          </div>

          <div className="flex justify-end gap-2 mt-1">
            <Button type="button" variant="outline"
              className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
              onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}
              className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0">
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

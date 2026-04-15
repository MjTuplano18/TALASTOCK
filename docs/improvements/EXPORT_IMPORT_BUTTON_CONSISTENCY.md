# Export/Import Button Consistency

## Overview
Standardized the export and import button design across all pages (Products, Inventory, Transactions) for a consistent user experience.

## Changes Made

### 1. Created Reusable Components

#### ExportDropdown Component
**Location:** `frontend/components/shared/ExportDropdown.tsx`

**Features:**
- Dropdown menu with Excel and CSV export options
- Consistent styling with Talastock design system
- Shows item count when filtered: "Export (25)"
- Disabled state when no items to export
- Loading state during export
- Auto-closes on click outside

**Props:**
```typescript
interface ExportDropdownProps {
  onExportExcel: () => void | Promise<void>
  onExportCSV: () => void | Promise<void>
  disabled?: boolean
  itemCount?: number
  isFiltered?: boolean
}
```

#### ImportButton Component
**Location:** `frontend/components/shared/ImportButton.tsx`

**Features:**
- Consistent styling matching export button
- Same height (h-9) and padding
- Upload icon with "Import" label
- Disabled state support
- Responsive (hides label on mobile)

**Props:**
```typescript
interface ImportButtonProps {
  onClick: () => void
  disabled?: boolean
  className?: string
}
```

### 2. Updated Pages

#### Products Page
**File:** `frontend/app/(dashboard)/products/page.tsx`

**Changes:**
- ✅ Using ExportDropdown component
- ✅ Using ImportButton component
- ✅ Consistent button height (h-9)
- ✅ Excel/CSV export options

#### Inventory Page
**File:** `frontend/app/(dashboard)/inventory/page.tsx`

**Changes:**
- ✅ Using ExportDropdown component
- ✅ Using ImportButton component
- ✅ Consistent button height (h-9)
- ✅ Excel/CSV export options
- ✅ Shows filtered item count

#### Transactions Page
**File:** `frontend/app/(dashboard)/transactions/page.tsx`

**Changes:**
- ✅ Using ExportDropdown component
- ✅ Removed PDF export option (not consistent with other pages)
- ✅ Consistent button height (h-9)
- ✅ Excel/CSV export options
- ✅ Shows filtered item count
- ✅ Removed custom dropdown implementation

## Design Specifications

### Button Styling
All export/import buttons follow these specifications:

```typescript
// Common button classes
"flex items-center gap-1.5 h-9 px-3 text-xs border rounded-lg transition-colors"
"border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
"disabled:opacity-40 disabled:cursor-not-allowed"
```

### Dropdown Menu Styling
```typescript
// Dropdown container
"absolute right-0 top-full mt-1 z-50 bg-white border border-[#F2C4B0] rounded-lg shadow-lg py-1 min-w-[140px]"

// Dropdown items
"w-full flex items-center gap-2 px-3 py-2 text-xs text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors"
```

### Icons
- Export: `Download` icon (3.5x3.5)
- Import: `Upload` icon (3.5x3.5)
- Excel: `FileSpreadsheet` icon (4x4, color: #E8896A)
- CSV: `FileText` icon (4x4, color: #E8896A)

## User Experience Improvements

### Before
- **Products:** Separate Import/Export buttons with different styles
- **Inventory:** Separate Excel/CSV buttons + Import button
- **Transactions:** Export dropdown with PDF/Excel/CSV options

### After
- **All Pages:** Consistent Export dropdown (Excel/CSV) + Import button
- **All Pages:** Same button height, padding, and styling
- **All Pages:** Shows filtered item count when applicable
- **All Pages:** Responsive design (hides labels on mobile)

## Benefits

1. **Consistency:** All pages have identical button design and behavior
2. **Maintainability:** Single source of truth for export/import UI
3. **User Experience:** Predictable interface across all pages
4. **Accessibility:** Consistent keyboard navigation and focus states
5. **Mobile Friendly:** Responsive design with icon-only mode on small screens

## Testing Checklist

- [x] Products page export dropdown works
- [x] Products page import button works
- [x] Inventory page export dropdown works
- [x] Inventory page import button works
- [x] Transactions page export dropdown works
- [x] All buttons have consistent height (h-9)
- [x] All buttons have consistent styling
- [x] Dropdown closes on click outside
- [x] Filtered item count displays correctly
- [x] Mobile responsive (labels hide on small screens)
- [x] No TypeScript errors
- [x] No console errors

## Files Modified

### Created
- `frontend/components/shared/ExportDropdown.tsx`
- `frontend/components/shared/ImportButton.tsx`

### Updated
- `frontend/app/(dashboard)/products/page.tsx`
- `frontend/app/(dashboard)/inventory/page.tsx`
- `frontend/app/(dashboard)/transactions/page.tsx`

## Notes

- Removed PDF export from Transactions page to maintain consistency
- If PDF export is needed in the future, it should be added to all pages
- All export functions are async-compatible
- Dropdown uses click-outside detection for better UX

# UI Consistency - Visual Reference Guide

## Quick Reference

### All Interactive Elements: h-9 (36px height)

```
┌─────────────────────────────────────────────────────────────┐
│  🔍  Search products...                                  ✕  │  ← SearchInput
└─────────────────────────────────────────────────────────────┘
     ↑                                                      ↑
   Icon (3.5x3.5)                                    Clear button
   Left: 2.5 (10px)                                  Right: 2 (8px)

┌─────────────────────────────────────────────────────────────┐
│  📅  Last 30 days                                        ›  │  ← DateRangeFilter
└─────────────────────────────────────────────────────────────┘
     ↑                                                      ↑
   Icon (3.5x3.5)                                    Chevron (3x3)
   
┌─────────────────────────────────────────────────────────────┐
│  📅  Filter by date                                      ›  │  ← DateRangePicker
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⬇  Export                                               ▼  │  ← ExportDropdown
└─────────────────────────────────────────────────────────────┘
     ↑                                                      ↑
   Download icon                                      Dropdown indicator

┌─────────────────────────────────────────────────────────────┐
│  ⬆  Import                                                  │  ← ImportButton
└─────────────────────────────────────────────────────────────┘
     ↑
   Upload icon

┌─────────────────────────────────────────────────────────────┐
│  All Categories                                          ▼  │  ← FilterSelect
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  +  Add Product                                             │  ← Primary Button
└─────────────────────────────────────────────────────────────┘
```

## Height Comparison

### Before (Inconsistent)
```
SearchInput:      ████████████████████████████████████████  (38px)
DateRangePicker:  ████████████████████████████████████████  (38px)
DateRangeFilter:  ██████████████████████████████████████    (36px)
ExportDropdown:   ██████████████████████████████████████    (36px)
ImportButton:     ████████████████████████████████████████  (40px)
```

### After (Consistent) ✅
```
SearchInput:      ██████████████████████████████████████    (36px)
DateRangePicker:  ██████████████████████████████████████    (36px)
DateRangeFilter:  ██████████████████████████████████████    (36px)
ExportDropdown:   ██████████████████████████████████████    (36px)
ImportButton:     ██████████████████████████████████████    (36px)
```

## Font Size Comparison

### Before (Inconsistent)
```
SearchInput:      text-sm (14px)
DateRangePicker:  text-sm (14px)
DateRangeFilter:  text-xs (12px)
ExportDropdown:   text-xs (12px)
ImportButton:     text-xs (12px)
```

### After (Consistent) ✅
```
SearchInput:      text-xs (12px)
DateRangePicker:  text-xs (12px)
DateRangeFilter:  text-xs (12px)
ExportDropdown:   text-xs (12px)
ImportButton:     text-xs (12px)
```

## Color Palette

### Borders
```css
Default:  #F2C4B0  ┌──────────┐
                   │          │  Soft peach border
                   └──────────┘

Active:   #E8896A  ┌──────────┐
                   │          │  Accent peach border
                   └──────────┘
```

### Text
```css
Primary:  #7A3E2E  ■  Dark brown text
Muted:    #B89080  ■  Light brown text
```

### Backgrounds
```css
Default:  #FFFFFF  ■  White
Hover:    #FDE8DF  ■  Very light peach
Page:     #FDF6F0  ■  Cream background
```

## Icon Sizes

### Standard Icons (in buttons/inputs)
```
Size: 3.5 x 3.5 (14px)

Examples:
🔍 Search
📅 Calendar
⬇ Download
⬆ Upload
```

### Action Icons (in dropdowns)
```
Size: 4 x 4 (16px)

Examples:
📊 FileSpreadsheet
📄 FileText
```

### Clear/Close Icons
```
Size: 3 x 3 (12px)

Examples:
✕ X
› ChevronRight
```

## Spacing System

### Padding
```
px-3      = 12px horizontal
pl-3      = 12px left
pr-2.5    = 10px right
pl-8      = 32px left (with icon)
pr-7      = 28px right (with clear button)
```

### Gaps
```
gap-2     = 8px   (between filter elements)
gap-1.5   = 6px   (between icon and text)
```

### Margins
```
mt-1      = 4px   (dropdown offset from button)
mb-3      = 12px  (section spacing)
```

## Layout Patterns

### Products Page
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Products                                                               │
│                                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  ┌──────┐ ┌──────┐│
│  │ 🔍 Search... │ │ All Categories│ │ All Status   │  │Import│ │Export││
│  └──────────────┘ └──────────────┘ └──────────────┘  └──────┘ └──────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        Product Table                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Inventory Page
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Inventory                                                              │
│                                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  ┌──────┐ ┌──────┐│
│  │ 🔍 Search... │ │ All Status   │ │ All Categories│  │Import│ │Export││
│  └──────────────┘ └──────────────┘ └──────────────┘  └──────┘ └──────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       Inventory Table                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Transactions Page
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Transactions                                                           │
│                                                                         │
│  ┌────────────────────────────────────────────┐  ┌──────────┐ ┌──────┐ │
│  │ 🔍 Search by transaction ID, product...   │  │📅 Last 30│ │Export│ │
│  └────────────────────────────────────────────┘  └──────────┘ └──────┘ │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Transactions Table                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Dropdown Menus

### Export Dropdown (Expanded)
```
┌─────────────────────────────────────┐
│  ⬇  Export                       ▼  │  ← Button
└─────────────────────────────────────┘
    ┌─────────────────────────────────┐
    │  📊  Export Excel               │  ← Option 1
    ├─────────────────────────────────┤
    │  📄  Export CSV                 │  ← Option 2
    └─────────────────────────────────┘
```

### Date Filter (Expanded)
```
┌─────────────────────────────────────┐
│  📅  Last 30 days                ✕  │  ← Button
└─────────────────────────────────────┘
    ┌─────────────────────────────────────────────────┐
    │  [Today] [Yesterday] [Last 7 days] [Last 30 days]│  ← Presets
    ├─────────────────────────────────────────────────┤
    │              April 2026                          │  ← Month
    │  Su  Mo  Tu  We  Th  Fr  Sa                     │
    │   6   7   8   9  10  11  12                     │  ← Calendar
    │  13  14  15  16  17  18  19                     │
    │  20  21  22  23  24  25  26                     │
    │  27  28  29  30                                  │
    └─────────────────────────────────────────────────┘
```

## States

### Default State
```
┌─────────────────────────────────────┐
│  🔍  Search...                      │  border-[#F2C4B0]
└─────────────────────────────────────┘  text-[#B89080]
```

### Focused State
```
┌═════════════════════════════════════┐
│  🔍  Search...                      │  border-[#E8896A]
└═════════════════════════════════════┘  ring-2 ring-[#E8896A]/50
```

### Active State (with value)
```
┌─────────────────────────────────────┐
│  🔍  Product name              ✕    │  border-[#E8896A]
└─────────────────────────────────────┘  text-[#7A3E2E]
```

### Hover State
```
┌─────────────────────────────────────┐
│  📅  Last 30 days                ›  │  bg-[#FDE8DF]
└─────────────────────────────────────┘  border-[#E8896A]
```

### Disabled State
```
┌─────────────────────────────────────┐
│  ⬇  Export                       ▼  │  opacity-40
└─────────────────────────────────────┘  cursor-not-allowed
```

## Responsive Behavior

### Desktop (≥768px)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐  ┌──────┐ ┌──────┐
│ 🔍 Search... │ │ All Categories│ │ All Status   │  │Import│ │Export│
└──────────────┘ └──────────────┘ └──────────────┘  └──────┘ └──────┘
```

### Mobile (<768px)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐  ┌──┐ ┌──┐
│ 🔍 Search... │ │ All Categories│ │ All Status   │  │⬆│ │⬇│
└──────────────┘ └──────────────┘ └──────────────┘  └──┘ └──┘
                                                      Icons only
```

## Component Composition

### Filter Row Pattern
```typescript
<div className="flex flex-col sm:flex-row gap-2 sm:items-center">
  {/* Left side - Search */}
  <div className="flex-1">
    <SearchInput value={search} onChange={setSearch} />
  </div>
  
  {/* Right side - Filters and Actions */}
  <div className="flex items-center gap-2 shrink-0">
    <DateRangeFilter />
    <ExportDropdown />
    <ImportButton />
  </div>
</div>
```

## Accessibility

### Keyboard Navigation
```
Tab       → Move to next element
Shift+Tab → Move to previous element
Enter     → Activate button/open dropdown
Escape    → Close dropdown/clear search
Space     → Toggle dropdown
```

### Focus Indicators
```
All interactive elements show focus ring:
focus:ring-2 focus:ring-[#E8896A]/50
```

### ARIA Labels
```typescript
// SearchInput
aria-label={placeholder}
role="search"

// Clear button
aria-label="Clear search"

// Icons
aria-hidden="true"
```

## Summary

✅ All elements: **36px height** (h-9)
✅ All text: **12px font** (text-xs)
✅ All icons: **14px size** (w-3.5 h-3.5)
✅ All borders: **#F2C4B0** default, **#E8896A** active
✅ All spacing: **Consistent gaps and padding**
✅ All states: **Consistent hover, focus, disabled**
✅ All responsive: **Hide labels on mobile**

**Result:** Professional, cohesive UI across entire application

# Import History UI States - Visual Guide

**Date**: 2026-04-29  
**Purpose**: Visual reference for all UI states in Import History

---

## Import Details Modal - Footer States

### State 1: Can Rollback ✅
**Conditions**:
- `entity_type === 'inventory'`
- `can_rollback === true`
- `has_conflicts === false`
- `rolled_back_at === null`

**UI**:
```
┌─────────────────────────────────────────────────────────────┐
│ Imported on Apr 29, 2026 • Processed in 1234ms             │
│                                                             │
│                                    [🔄 Rollback Import]  [Close] │
└─────────────────────────────────────────────────────────────┘
```

---

### State 2: Has Conflicts ⚠️
**Conditions**:
- `entity_type === 'inventory'`
- `has_conflicts === true`
- `rolled_back_at === null`

**UI**:
```
┌─────────────────────────────────────────────────────────────┐
│ Imported on Apr 29, 2026 • Processed in 1234ms             │
│                                                             │
│  ⚠️ Cannot rollback - products have been modified    [Close] │
└─────────────────────────────────────────────────────────────┘
```

---

### State 3: No Snapshots ℹ️ (NEW)
**Conditions**:
- `entity_type === 'inventory'`
- `can_rollback === false`
- `has_conflicts === false`
- `rolled_back_at === null`

**UI**:
```
┌─────────────────────────────────────────────────────────────┐
│ Imported on Apr 20, 2026 • Processed in 1234ms             │
│                                                             │
│  ℹ️ Rollback not available - no snapshots found      [Close] │
└─────────────────────────────────────────────────────────────┘
```

---

### State 4: Already Rolled Back 🔄
**Conditions**:
- `entity_type === 'inventory'`
- `rolled_back_at !== null`

**UI**:
```
┌─────────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ⚠️ This import has been rolled back                   │   │
│ │ Rolled back on Apr 29, 2026 at 3:45 PM               │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ Imported on Apr 29, 2026 • Processed in 1234ms             │
│                                                             │
│                                                      [Close] │
└─────────────────────────────────────────────────────────────┘
```

---

### State 5: Products Import 📦
**Conditions**:
- `entity_type === 'products'`

**UI**:
```
┌─────────────────────────────────────────────────────────────┐
│ Imported on Apr 29, 2026 • Processed in 1234ms             │
│                                                             │
│  Product imports cannot be rolled back              [Close] │
└─────────────────────────────────────────────────────────────┘
```

---

## Import History Table - Status Column

### Success Import
```
┌──────────────────────────────────────┐
│ Status                               │
├──────────────────────────────────────┤
│ [Success]                            │
└──────────────────────────────────────┘
```

### Failed Import
```
┌──────────────────────────────────────┐
│ Status                               │
├──────────────────────────────────────┤
│ [Failed]                             │
└──────────────────────────────────────┘
```

### Partial Import
```
┌──────────────────────────────────────┐
│ Status                               │
├──────────────────────────────────────┤
│ [Partial]                            │
└──────────────────────────────────────┘
```

### Rolled Back Import
```
┌──────────────────────────────────────┐
│ Status                               │
├──────────────────────────────────────┤
│ [Success]                            │
│ [Rolled Back]                        │
└──────────────────────────────────────┘
```

### Import with Conflicts
```
┌──────────────────────────────────────┐
│ Status                               │
├──────────────────────────────────────┤
│ [Success]                            │
│ [⚠️ Conflicts]                       │
└──────────────────────────────────────┘
```

---

## Import History Table - Actions Column

### Can Rollback
```
┌──────────────────────────────────────┐
│ Actions                              │
├──────────────────────────────────────┤
│ [👁️] [🔄]                            │
└──────────────────────────────────────┘
```

### Cannot Rollback (No Snapshots or Conflicts)
```
┌──────────────────────────────────────┐
│ Actions                              │
├──────────────────────────────────────┤
│ [👁️]                                 │
└──────────────────────────────────────┘
```

### Already Rolled Back
```
┌──────────────────────────────────────┐
│ Actions                              │
├──────────────────────────────────────┤
│ [👁️]                                 │
└──────────────────────────────────────┘
```

---

## Error Toast Messages

### No Snapshots Error
```
┌─────────────────────────────────────────────────────────────┐
│ ❌ Cannot rollback: No snapshots available                  │
│                                                             │
│ This import was created before the rollback feature was     │
│ implemented. Only imports created after April 29, 2026      │
│ can be rolled back.                                         │
│                                                             │
│                                                      [Dismiss] │
└─────────────────────────────────────────────────────────────┘
Duration: 7 seconds
```

### Conflicts Error
```
┌─────────────────────────────────────────────────────────────┐
│ ❌ Cannot rollback: Products have been modified             │
│                                                             │
│ This import cannot be rolled back because the products      │
│ have been changed by newer operations. Rolling back would   │
│ overwrite recent data.                                      │
│                                                             │
│                                                      [Dismiss] │
└─────────────────────────────────────────────────────────────┘
Duration: 6 seconds
```

### Already Rolled Back Error
```
┌─────────────────────────────────────────────────────────────┐
│ ❌ This import has already been rolled back                 │
│                                                             │
│                                                      [Dismiss] │
└─────────────────────────────────────────────────────────────┘
Duration: 4 seconds
```

### Success Message
```
┌─────────────────────────────────────────────────────────────┐
│ ✅ Successfully rolled back 15 changes                      │
│                                                             │
│                                                      [Dismiss] │
└─────────────────────────────────────────────────────────────┘
Duration: 4 seconds

┌─────────────────────────────────────────────────────────────┐
│ ℹ️ Go to Inventory page to see the restored quantities     │
│                                                             │
│                                                      [Dismiss] │
└─────────────────────────────────────────────────────────────┘
Duration: 5 seconds
```

---

## Color Palette

### Status Badges
- **Success**: `bg-green-50 text-green-700`
- **Failed**: `bg-red-50 text-red-700`
- **Partial**: `bg-yellow-50 text-yellow-700`
- **Rolled Back**: `bg-[#FDECEA] text-[#C05050]`
- **Conflicts**: `bg-yellow-50 text-yellow-700`

### Buttons
- **Rollback**: `border-[#F2C4B0] text-[#C05050] hover:bg-[#FDECEA]`
- **Close**: `bg-[#E8896A] text-white hover:bg-[#C1614A]`
- **Confirm Rollback**: `bg-[#C05050] text-white hover:bg-[#A03030]`
- **Cancel**: `border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]`

### Icons
- **Eye (View)**: `text-[#E8896A] hover:text-[#C1614A]`
- **Rollback**: `text-[#C05050] hover:bg-[#FDECEA]`
- **Warning**: `text-yellow-600`
- **Info**: `text-[#B89080]`
- **Error**: `text-[#C05050]`

---

## Decision Tree

```
Is entity_type === 'inventory'?
├─ NO → Show "Product imports cannot be rolled back"
└─ YES → Is rolled_back_at !== null?
    ├─ YES → Show rolled back status (no button)
    └─ NO → Has conflicts?
        ├─ YES → Show "Cannot rollback - products have been modified"
        └─ NO → Can rollback?
            ├─ NO → Show "Rollback not available - no snapshots found"
            └─ YES → Show [Rollback Import] button
```

---

## Accessibility

### ARIA Labels
- Rollback button: `aria-label="Rollback this import"`
- View details button: `aria-label="View import details"`
- Close button: `aria-label="Close modal"`

### Keyboard Navigation
- Tab through buttons
- Enter/Space to activate
- Escape to close modal

### Screen Reader Announcements
- "Import has conflicts, rollback not available"
- "Import has no snapshots, rollback not available"
- "Rollback button available"

---

## Responsive Behavior

### Desktop (≥768px)
- Full button text: "Rollback Import"
- Full message text visible
- Icons + text

### Mobile (<768px)
- Abbreviated text: "Rollback"
- Truncated messages with ellipsis
- Icons only (with tooltips)

---

## Animation & Transitions

### Button Hover
```css
transition: all 0.2s ease-in-out
hover:bg-[#FDECEA]
```

### Toast Slide In
```css
animation: slide-in-right 0.3s ease-out
```

### Loading State
```css
opacity: 0.5
cursor: not-allowed
```

---

## Conclusion

This visual guide provides a complete reference for all UI states in the Import History feature. Use this as a reference when implementing or testing the UI.


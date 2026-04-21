# Button Text Color Guide

## Question
"Why do some buttons have dark text and others have lighter text?"

## Answer
The text color changes based on the **button's state** and **purpose**. This is an intentional design pattern that provides visual feedback to users.

---

## Color Palette

### Text Colors Used
```css
text-[#7A3E2E]  /* Dark brown - Primary text (active/selected state) */
text-[#B89080]  /* Light brown - Muted text (inactive/default state) */
text-white      /* White - For colored backgrounds */
text-[#E8896A]  /* Accent peach - For emphasis/highlights */
```

---

## Pattern 1: State-Based Color (Filter Buttons)

### DateRangeFilter Example

**Default State (No filter applied):**
```typescript
// When showing default "Last 30 days"
className="text-[#B89080]"  // Light brown (muted)
```
Visual: The button appears **lighter/muted** to indicate it's in default state

**Active State (Filter applied):**
```typescript
// When user selects "Today", "Yesterday", or custom range
className="text-[#7A3E2E]"  // Dark brown (active)
```
Visual: The button appears **darker/bolder** to indicate it's actively filtering

**Code Example:**
```typescript
<button
  className={cn(
    'flex items-center gap-2 h-9 pl-3 pr-2.5 text-xs border rounded-lg',
    hasValue 
      ? 'border-[#E8896A] text-[#7A3E2E]'  // Active: dark text
      : 'border-[#F2C4B0] text-[#B89080]'  // Default: light text
  )}
>
```

---

## Pattern 2: Consistent Color (Action Buttons)

### ExportDropdown & ImportButton Example

**Always Dark:**
```typescript
// These buttons always use dark text
className="text-[#7A3E2E]"  // Dark brown
```

**Why?** These are action buttons, not filters. They don't have an "active" vs "inactive" state - they're always ready to be clicked.

**Code Example:**
```typescript
<button
  className="flex items-center gap-1.5 h-9 px-3 text-xs border rounded-lg text-[#7A3E2E]"
>
  <Download className="w-3.5 h-3.5" />
  <span>Export</span>
</button>
```

---

## Pattern 3: Background-Based Color (Primary Buttons)

### Primary Action Buttons

**Colored Background = White Text:**
```typescript
// Primary buttons with colored backgrounds
className="bg-[#E8896A] hover:bg-[#C1614A] text-white"
```

**Why?** White text provides proper contrast against the colored background.

**Example:**
```typescript
<button className="bg-[#E8896A] hover:bg-[#C1614A] text-white">
  <Plus className="w-4 h-4" />
  Add Product
</button>
```

---

## Visual Comparison

### Filter Button States

```
┌─────────────────────────────────┐
│  📅  Last 30 days            ›  │  ← Default state
└─────────────────────────────────┘    text-[#B89080] (light)
     Lighter text = Not actively filtering

┌─────────────────────────────────┐
│  📅  Today                    ✕  │  ← Active state
└─────────────────────────────────┘    text-[#7A3E2E] (dark)
     Darker text = Actively filtering
```

### Action Buttons (Always Same)

```
┌─────────────────────────────────┐
│  ⬇  Export                   ▼  │  ← Always dark
└─────────────────────────────────┘    text-[#7A3E2E]

┌─────────────────────────────────┐
│  ⬆  Import                      │  ← Always dark
└─────────────────────────────────┘    text-[#7A3E2E]
```

### Primary Buttons (Colored Background)

```
┌─────────────────────────────────┐
│  +  Add Product                 │  ← White text on color
└─────────────────────────────────┘    bg-[#E8896A] text-white
```

---

## Complete Button Type Reference

### 1. Filter Buttons (State-Based Color)
**Examples:** DateRangeFilter, DateRangePicker, FilterSelect

**Default State:**
- Text: `text-[#B89080]` (light brown)
- Border: `border-[#F2C4B0]` (light peach)
- Meaning: "I'm showing the default value"

**Active State:**
- Text: `text-[#7A3E2E]` (dark brown)
- Border: `border-[#E8896A]` (accent peach)
- Meaning: "I'm actively filtering the data"

### 2. Action Buttons (Consistent Color)
**Examples:** ExportDropdown, ImportButton, Edit, Delete

**Always:**
- Text: `text-[#7A3E2E]` (dark brown)
- Border: `border-[#F2C4B0]` (light peach)
- Meaning: "I'm ready to perform an action"

### 3. Primary Buttons (White Text)
**Examples:** Add Product, Save, Submit, Confirm

**Always:**
- Text: `text-white`
- Background: `bg-[#E8896A]` (accent peach)
- Hover: `bg-[#C1614A]` (darker peach)
- Meaning: "I'm the main action on this page"

### 4. Secondary Buttons (Dark Text)
**Examples:** Cancel, Close, Back

**Always:**
- Text: `text-[#7A3E2E]` (dark brown)
- Border: `border-[#F2C4B0]` (light peach)
- Background: `bg-white`
- Meaning: "I'm a secondary action"

### 5. Danger Buttons (Red Text)
**Examples:** Delete (destructive actions)

**Always:**
- Text: `text-[#C05050]` (red)
- Border: `border-[#FDECEA]` (light red)
- Hover: `bg-[#FDECEA]` (light red background)
- Meaning: "I'm a destructive action - be careful!"

---

## Why This Pattern?

### 1. Visual Feedback
Users can instantly see which filters are active:
- **Light text** = Default/inactive
- **Dark text** = Active/selected

### 2. Hierarchy
Different text colors create visual hierarchy:
- **White on color** = Primary action (most important)
- **Dark brown** = Secondary actions and active filters
- **Light brown** = Inactive/default state
- **Red** = Destructive actions (warning)

### 3. Accessibility
The color changes are paired with other visual cues:
- Border color changes
- Background color changes
- Icons appear/disappear (X vs chevron)

### 4. Consistency
Once you learn the pattern, it applies everywhere:
- All filter buttons work the same way
- All action buttons work the same way
- All primary buttons work the same way

---

## Code Pattern

### Filter Button Template
```typescript
<button
  className={cn(
    'flex items-center gap-2 h-9 px-3 text-xs border rounded-lg',
    isActive 
      ? 'border-[#E8896A] text-[#7A3E2E]'  // Active: dark text, accent border
      : 'border-[#F2C4B0] text-[#B89080]'  // Default: light text, light border
  )}
>
  {label}
</button>
```

### Action Button Template
```typescript
<button
  className="flex items-center gap-1.5 h-9 px-3 text-xs border border-[#F2C4B0] rounded-lg text-[#7A3E2E] hover:bg-[#FDE8DF]"
>
  <Icon className="w-3.5 h-3.5" />
  <span>{label}</span>
</button>
```

### Primary Button Template
```typescript
<button
  className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#E8896A] hover:bg-[#C1614A] text-white"
>
  <Icon className="w-4 h-4" />
  <span>{label}</span>
</button>
```

---

## Real-World Examples

### Transactions Page

```typescript
// Search input - always dark (action)
<SearchInput />  // text-[#7A3E2E]

// Date filter - changes based on state
<DateRangeFilter />  
// Default: text-[#B89080]
// Active: text-[#7A3E2E]

// Export button - always dark (action)
<ExportDropdown />  // text-[#7A3E2E]
```

### Products Page

```typescript
// Search input - always dark (action)
<SearchInput />  // text-[#7A3E2E]

// Category filter - changes based on state
<FilterSelect />
// Default: text-[#B89080]
// Active: text-[#7A3E2E]

// Import button - always dark (action)
<ImportButton />  // text-[#7A3E2E]

// Export button - always dark (action)
<ExportDropdown />  // text-[#7A3E2E]

// Add Product - white text (primary)
<Button />  // text-white on bg-[#E8896A]
```

---

## Summary

**The text color tells you the button's purpose:**

1. **Light brown (`text-[#B89080]`)** = "I'm a filter in default state"
2. **Dark brown (`text-[#7A3E2E]`)** = "I'm active" or "I'm an action button"
3. **White (`text-white`)** = "I'm the primary action"
4. **Red (`text-[#C05050]`)** = "I'm dangerous - think before clicking"

This creates a **visual language** that helps users understand the interface without reading every label. Once you learn the pattern, you can navigate faster and more confidently!

---

## Quick Reference Table

| Button Type | Default Text Color | Active Text Color | Background | Use Case |
|-------------|-------------------|-------------------|------------|----------|
| Filter | `text-[#B89080]` | `text-[#7A3E2E]` | `bg-white` | Date filters, dropdowns |
| Action | `text-[#7A3E2E]` | `text-[#7A3E2E]` | `bg-white` | Export, Import, Edit |
| Primary | `text-white` | `text-white` | `bg-[#E8896A]` | Add, Save, Submit |
| Secondary | `text-[#7A3E2E]` | `text-[#7A3E2E]` | `bg-white` | Cancel, Close |
| Danger | `text-[#C05050]` | `text-[#C05050]` | `bg-white` | Delete, Remove |
| Selected | `text-white` | `text-white` | `bg-[#E8896A]` | Active preset pills |

---

## Related Documentation

- `docs/improvements/UI_CONSISTENCY_COMPLETE.md` - Overall UI consistency
- `docs/improvements/UI_CONSISTENCY_VISUAL_GUIDE.md` - Visual reference guide
- `.kiro/steering/ui-components.md` - UI component standards

# CashCalculator Component

## Overview
The `CashCalculator` component is used in the POS system when the user selects "Cash" as the payment method. It helps cashiers calculate change quickly and accurately.

## Features
- ✅ Display total amount due prominently
- ✅ Input field for cash received with validation
- ✅ Auto-calculate change as user types
- ✅ Show change prominently with accent color
- ✅ Show error if cash received < total amount
- ✅ Quick amount buttons (₱100, ₱200, ₱500, ₱1000)
- ✅ Suggested amount button (rounded up to nearest ₱100)
- ✅ Exact amount notice when cash received equals total
- ✅ Uses Talastock design system colors

## Props

```typescript
interface CashCalculatorProps {
  totalAmount: number      // The sale total amount
  cashReceived: number     // Amount entered by user
  onChange: (amount: number) => void  // Callback when cash received changes
}
```

## Usage Example

```tsx
import { CashCalculator } from '@/components/pos/CashCalculator'

function PaymentFlow() {
  const [cashReceived, setCashReceived] = useState(0)
  const totalAmount = 1250.00

  return (
    <CashCalculator
      totalAmount={totalAmount}
      cashReceived={cashReceived}
      onChange={setCashReceived}
    />
  )
}
```

## Integration with POS

The component should be shown when:
1. User has items in cart
2. User clicks "Complete Sale"
3. User selects "Cash" as payment method

The component uses the `calculateChange()` helper function from `@/types/index.ts`:

```typescript
export function calculateChange(cashReceived: number, totalAmount: number): number {
  return Math.max(0, cashReceived - totalAmount)
}
```

## Validation

The component validates:
- Cash received must be >= 0 (no negative values)
- Shows error message if cash received < total amount
- Disables sale completion if validation fails

## Design System Compliance

Colors used:
- Background: `#FDE8DF` (ts-soft)
- Border: `#F2C4B0` (ts-border)
- Accent: `#E8896A` (ts-accent)
- Accent Dark: `#C1614A` (ts-accent-dark)
- Text: `#7A3E2E` (ts-text)
- Muted: `#B89080` (ts-muted)
- Error Background: `#FDECEA` (ts-danger-soft)
- Error Text: `#C05050` (ts-danger)

## Accessibility

- ✅ Proper label for input field
- ✅ Auto-focus on cash received input
- ✅ Clear error messages
- ✅ Keyboard accessible (tab navigation)
- ✅ Touch-friendly button sizes (44px minimum)

## Requirements Satisfied

This component satisfies the following requirements from the Pre-Launch Essentials spec:

- **Requirement 2.2**: Cash Payment Flow
  - User selects "Cash"
  - System shows cash calculator
  - User enters amount received from customer
  - System calculates and displays change
  - Change amount shown prominently
  - User confirms to complete sale

## Next Steps

To integrate this component into the POS flow:

1. Update `frontend/app/(dashboard)/pos/page.tsx` to add payment method state
2. Show `PaymentMethodSelector` before completing sale
3. Show `CashCalculator` when Cash is selected
4. Pass cash received data to `completePOSSale` function
5. Update POS API to save payment data
6. Update receipt to show payment information

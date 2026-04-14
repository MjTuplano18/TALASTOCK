# Talastock Frontend

Next.js 14 application with TypeScript, Tailwind CSS, and shadcn/ui.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS with Talastock custom color palette
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: lucide-react

## Talastock Color Palette

```css
--ts-bg:           #FDF6F0   /* page background */
--ts-surface:      #FFFFFF   /* cards, sidebar */
--ts-soft:         #FDE8DF   /* icon bg, active states */
--ts-border:       #F2C4B0   /* all borders */
--ts-accent:       #E8896A   /* primary buttons, highlights */
--ts-accent-dark:  #C1614A   /* hover states, headings */
--ts-text:         #7A3E2E   /* primary text */
--ts-muted:        #B89080   /* labels, secondary text */
--ts-danger-soft:  #FDECEA   /* low stock bg */
--ts-danger:       #C05050   /* low stock, error text */
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── charts/            # Chart components
│   ├── tables/            # Data table components
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   └── shared/            # Shared components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
└── styles/                # Global styles
```

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Available Scripts

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Adding shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

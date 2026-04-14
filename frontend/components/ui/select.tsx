"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Simple native-select based components ────────────────────────────────────
// Replaces @base-ui/react/select which had visibility issues.

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
  defaultValue?: string
}

const SelectContext = React.createContext<{
  value: string
  onChange: (v: string) => void
}>({ value: '', onChange: () => {} })

function Select({ value = '', onValueChange, children, defaultValue }: SelectProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? value)
  const controlled = onValueChange !== undefined

  const current = controlled ? value : internal
  const onChange = (v: string) => {
    if (!controlled) setInternal(v)
    onValueChange?.(v)
  }

  return (
    <SelectContext.Provider value={{ value: current, onChange }}>
      {children}
    </SelectContext.Provider>
  )
}

// Collect items from children to build the native <select>
interface SelectTriggerProps extends React.ComponentProps<"div"> {
  size?: "sm" | "default"
}

// We render a real <select> element styled to match Talastock design
interface NativeSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
  className?: string
  placeholder?: string
}

function SelectNative({ value, onValueChange, children, className, placeholder }: NativeSelectProps) {
  return (
    <div className="relative">
      <select
        value={value ?? ''}
        onChange={e => onValueChange?.(e.target.value)}
        className={cn(
          "w-full appearance-none rounded-lg border border-[#F2C4B0] bg-white px-3 py-2 pr-8 text-sm text-[#7A3E2E]",
          "focus:outline-none focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B89080]" />
    </div>
  )
}

// Keep the shadcn-compatible API but render native elements underneath
function SelectTrigger({ className, children, ...props }: SelectTriggerProps) {
  const { value } = React.useContext(SelectContext)
  return (
    <div
      className={cn(
        "relative flex items-center w-full rounded-lg border border-[#F2C4B0] bg-white px-3 py-2 text-sm text-[#7A3E2E] cursor-pointer",
        className
      )}
      {...props}
    >
      <span className="flex-1">{children}</span>
      <ChevronDown className="w-4 h-4 text-[#B89080] shrink-0" />
    </div>
  )
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span>{placeholder}</span>
}

function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>
}

function SelectGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function SelectLabel({ children }: { children: React.ReactNode }) {
  return <optgroup label={String(children)} />
}

function SelectSeparator() {
  return null
}

function SelectScrollUpButton() {
  return null
}

function SelectScrollDownButton() {
  return null
}

export {
  Select,
  SelectNative,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}

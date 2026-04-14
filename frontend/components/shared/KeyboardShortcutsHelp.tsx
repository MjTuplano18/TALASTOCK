'use client'

import { Keyboard } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Shortcut {
  keys: string[]
  description: string
}

interface KeyboardShortcutsHelpProps {
  shortcuts: Shortcut[]
}

export function KeyboardShortcutsHelp({ shortcuts }: KeyboardShortcutsHelpProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#B89080] hover:text-[#7A3E2E] hover:bg-[#FDE8DF] rounded-lg transition-colors"
          title="Keyboard shortcuts"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Shortcuts</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 border-[#F2C4B0]" align="end">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[#7A3E2E]">Keyboard Shortcuts</h3>
          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-[#B89080]">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, i) => (
                    <kbd
                      key={i}
                      className="px-1.5 py-0.5 bg-[#FDE8DF] border border-[#F2C4B0] rounded text-[#7A3E2E] font-mono text-[10px]"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

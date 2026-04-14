interface HeaderProps {
  title: string
  children?: React.ReactNode
}

export function Header({ title, children }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-lg font-medium text-[#7A3E2E]">{title}</h1>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}

import type { ReactNode } from 'react'

export function StatusMessage({
  children,
  action,
  tone = 'info',
}: {
  children: ReactNode
  action?: ReactNode
  tone?: 'info' | 'error'
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className="flex flex-col items-center gap-4 py-16 text-center"
    >
      <p className={tone === 'error' ? 'text-red-700' : 'text-slate-600'}>{children}</p>
      {action}
    </div>
  )
}

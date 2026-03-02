import clsx from 'clsx'

export default function Input({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={clsx(
          'border rounded-lg px-3 py-2 text-sm outline-none transition-colors',
          error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-primary-500',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

export function Select({ label, error, className, children, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        className={clsx(
          'border rounded-lg px-3 py-2 text-sm outline-none bg-white transition-colors',
          error ? 'border-red-400' : 'border-gray-300 focus:border-primary-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

import React, { forwardRef } from 'react'
import { ROLE_OPTIONS } from '../constants'
import type { TypeTheme } from '../constants'

interface RolesGridProps {
  theme: TypeTheme
  selectedRoles: string[]
  onToggleRole: (role: string) => void
  rolesLabel: string
  error?: string
}

export const RolesGrid = forwardRef<HTMLDivElement, RolesGridProps>(
  function RolesGrid({ theme, selectedRoles, onToggleRole, rolesLabel, error }, ref) {
    return (
      <div ref={ref}>
        <h3 className="text-[10px] font-medium text-txt-tertiary mb-2">
          {rolesLabel}
        </h3>
        <div className={`grid grid-cols-3 gap-1.5 ${error ? 'ring-1 ring-status-danger-text/30' : ''}`}>
          {ROLE_OPTIONS.map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onToggleRole(value)}
              className={`flex flex-col items-center justify-center aspect-square border transition-colors ${
                selectedRoles.includes(value)
                  ? theme.roleOn
                  : 'bg-surface-sunken text-txt-secondary border-border-subtle hover:bg-accent-secondary hover:border-border'
              }`}
            >
              <Icon size={18} className={selectedRoles.includes(value) ? `${theme.roleIconOn} mb-1.5` : 'text-txt-disabled mb-1.5'} />
              <span className="text-xs font-medium">{value}</span>
            </button>
          ))}
        </div>
        {error && (
          <p className="text-status-danger-text text-xs mt-1">{error}</p>
        )}
      </div>
    )
  }
)

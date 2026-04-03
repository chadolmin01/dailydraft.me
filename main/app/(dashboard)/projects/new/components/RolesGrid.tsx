import React, { forwardRef, useState, useCallback } from 'react'
import { ROLE_OPTIONS } from '../constants'
import type { TypeTheme } from '../constants'

interface RolesGridProps {
  theme: TypeTheme
  selectedRoles: string[]
  onToggleRole: (role: string) => void
  rolesLabel: string
  error?: string
}

function RoleButton({ label, icon: Icon, selected, themeRoleOn, themeRoleIconOn, onToggle }: {
  label: string
  icon: React.ElementType
  selected: boolean
  themeRoleOn: string
  themeRoleIconOn: string
  onToggle: () => void
}) {
  const [bouncing, setBouncing] = useState(false)
  const handleClick = useCallback(() => {
    onToggle()
    setBouncing(true)
  }, [onToggle])

  return (
    <button
      type="button"
      onClick={handleClick}
      onAnimationEnd={() => setBouncing(false)}
      className={`relative flex flex-col items-center justify-center aspect-square border rounded-xl transition-all active:scale-[0.93] ${bouncing ? 'chip-bounce' : ''} ${
        selected
          ? themeRoleOn
          : 'bg-surface-sunken text-txt-secondary border-border-subtle hover:bg-accent-secondary hover:border-border'
      }`}
    >
      <Icon size={18} className={selected ? `${themeRoleIconOn} mb-1.5` : 'text-txt-disabled mb-1.5'} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

export const RolesGrid = forwardRef<HTMLDivElement, RolesGridProps>(
  function RolesGrid({ theme, selectedRoles, onToggleRole, rolesLabel, error }, ref) {
    return (
      <div ref={ref}>
        <h3 className="text-[10px] font-medium text-txt-tertiary mb-2">
          {rolesLabel}
        </h3>
        <div className={`grid grid-cols-3 gap-1.5 ${error ? 'ring-1 ring-status-danger-text/30 rounded-xl' : ''}`}>
          {ROLE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <RoleButton
              key={value}
              label={label}
              icon={Icon}
              selected={selectedRoles.includes(value)}
              themeRoleOn={theme.roleOn}
              themeRoleIconOn={theme.roleIconOn}
              onToggle={() => onToggleRole(value)}
            />
          ))}
        </div>
        {error && (
          <p className="text-status-danger-text text-xs mt-1">{error}</p>
        )}
      </div>
    )
  }
)

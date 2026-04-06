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

function RoleChip({ label, icon: Icon, selected, themeRoleOn, themeRoleIconOn, onToggle }: {
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
      className={`flex items-center gap-1.5 h-9 px-3 rounded-xl transition-all active:scale-[0.95] ${bouncing ? 'chip-bounce' : ''} ${
        selected
          ? themeRoleOn
          : 'bg-[#F7F8F9] dark:bg-[#1C1C1E] text-txt-secondary hover:bg-[#EDF0F3] dark:hover:bg-[#252527]'
      }`}
    >
      <Icon size={14} className={selected ? themeRoleIconOn : 'text-txt-disabled'} />
      <span className="text-[13px] font-medium">{label}</span>
    </button>
  )
}

export const RolesGrid = forwardRef<HTMLDivElement, RolesGridProps>(
  function RolesGrid({ theme, selectedRoles, onToggleRole, rolesLabel, error }, ref) {
    return (
      <div ref={ref}>
        <h3 className="text-[13px] font-semibold text-txt-secondary mb-2">
          {rolesLabel}
        </h3>
        <div className={`flex flex-wrap gap-2 ${error ? 'ring-1 ring-status-danger-text/30 rounded-xl p-2' : ''}`}>
          {ROLE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <RoleChip
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

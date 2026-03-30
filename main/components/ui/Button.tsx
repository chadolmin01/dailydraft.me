'use client'

import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'blue' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  children: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-surface-inverse text-txt-inverse hover:bg-surface-inverse/90 hover:opacity-90 active:scale-[0.97]',
  secondary: 'bg-surface-card border border-border-strong text-black hover:bg-black hover:text-white',
  ghost: 'text-black hover:bg-surface-sunken',
  blue: 'bg-brand text-white hover:bg-brand-hover hover:opacity-90 active:scale-[0.97]',
  danger: 'bg-status-danger-text text-white hover:bg-status-danger-text/90 hover:opacity-90 active:scale-[0.97]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'font-bold rounded-sm transition-all flex items-center justify-center gap-2'
  const isDisabled = disabled || loading

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

// Icon-only button variant
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const iconSizeStyles: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
}

export const IconButton: React.FC<IconButtonProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-sm transition-colors flex items-center justify-center'
  const variantStyle = variant === 'ghost'
    ? 'text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken'
    : 'bg-surface-card border border-border-strong text-txt-secondary hover:bg-black hover:text-white'

  return (
    <button
      className={`${baseStyles} ${variantStyle} ${iconSizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

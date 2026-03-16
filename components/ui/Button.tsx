'use client'

import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'blue' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  children: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-black text-white hover:bg-[#333] shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]',
  secondary: 'bg-surface-card border border-border-strong text-black hover:bg-black hover:text-white',
  ghost: 'text-black hover:bg-surface-sunken',
  blue: 'bg-[#4F46E5] text-white hover:bg-[#4338CA] shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'font-bold rounded-sm transition-all flex items-center justify-center gap-2'

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
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

'use client'

import React from 'react'
import { Check, Circle } from 'lucide-react'
import { WIZARD_STEPS, WizardStep } from '../../src/types/business-plan'

interface StepWizardProps {
  currentStep: number
  completedSteps: number[]
  onStepClick?: (step: number) => void
}

export const StepWizard: React.FC<StepWizardProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-sm p-4">
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <StepItem
              step={step}
              isActive={currentStep === step.id}
              isCompleted={completedSteps.includes(step.id)}
              isClickable={completedSteps.includes(step.id) || step.id <= currentStep}
              onClick={() => onStepClick?.(step.id)}
            />
            {index < WIZARD_STEPS.length - 1 && (
              <StepConnector
                isCompleted={completedSteps.includes(step.id)}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

interface StepItemProps {
  step: WizardStep
  isActive: boolean
  isCompleted: boolean
  isClickable: boolean
  onClick: () => void
}

const StepItem: React.FC<StepItemProps> = ({
  step,
  isActive,
  isCompleted,
  isClickable,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`
        flex flex-col items-center gap-2 transition-all
        ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
      `}
    >
      {/* Step indicator */}
      <div
        className={`
          w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
          transition-all duration-200
          ${isCompleted
            ? 'bg-black text-white'
            : isActive
              ? 'bg-blue-600 text-white ring-4 ring-blue-100'
              : 'bg-gray-100 text-gray-400 border border-gray-200'
          }
        `}
      >
        {isCompleted ? (
          <Check size={18} strokeWidth={3} />
        ) : (
          step.id
        )}
      </div>

      {/* Step label */}
      <div className="text-center">
        <div
          className={`
            text-xs font-bold
            ${isActive ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}
          `}
        >
          {step.title}
        </div>
        <div className="text-[10px] text-gray-400 hidden md:block max-w-[100px]">
          {step.description}
        </div>
      </div>
    </button>
  )
}

interface StepConnectorProps {
  isCompleted: boolean
}

const StepConnector: React.FC<StepConnectorProps> = ({ isCompleted }) => {
  return (
    <div className="flex-1 mx-2 h-0.5 relative">
      <div className="absolute inset-0 bg-gray-200 rounded-full" />
      <div
        className={`
          absolute inset-0 bg-black rounded-full transition-all duration-500
          ${isCompleted ? 'w-full' : 'w-0'}
        `}
      />
    </div>
  )
}

// Compact version for sidebar
export const StepWizardCompact: React.FC<StepWizardProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
}) => {
  return (
    <div className="space-y-2">
      {WIZARD_STEPS.map((step) => {
        const isActive = currentStep === step.id
        const isCompleted = completedSteps.includes(step.id)
        const isClickable = completedSteps.includes(step.id) || step.id <= currentStep

        return (
          <button
            key={step.id}
            onClick={() => isClickable && onStepClick?.(step.id)}
            disabled={!isClickable}
            className={`
              w-full flex items-center gap-3 p-3 rounded-sm transition-all
              ${isActive
                ? 'bg-blue-50 border border-blue-200'
                : 'border border-transparent hover:bg-gray-50'
              }
              ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
            `}
          >
            {/* Step indicator */}
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                ${isCompleted
                  ? 'bg-black text-white'
                  : isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                }
              `}
            >
              {isCompleted ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                step.id
              )}
            </div>

            {/* Step info */}
            <div className="flex-1 text-left">
              <div
                className={`
                  text-sm font-medium
                  ${isActive ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}
                `}
              >
                {step.title}
              </div>
            </div>

            {/* Progress indicator */}
            {isCompleted && (
              <span className="text-[10px] font-mono text-green-600 bg-green-50 px-2 py-0.5 rounded-sm">
                DONE
              </span>
            )}
            {isActive && !isCompleted && (
              <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm animate-pulse">
                IN PROGRESS
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default StepWizard

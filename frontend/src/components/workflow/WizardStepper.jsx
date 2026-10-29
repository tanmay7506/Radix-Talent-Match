import { Check } from 'lucide-react'
import './WizardStepper.css'

const STEPS = [
  { id: 1, label: 'Resume', short: 'Resume' },
  { id: 2, label: 'Profile Review', short: 'Profile' },
  { id: 3, label: 'Job Description', short: 'JD' },
  { id: 4, label: 'JD Analysis', short: 'Analysis' },
  { id: 5, label: 'Skill Match', short: 'Matching' },
  { id: 6, label: 'Talent Check', short: 'Talent' },
  { id: 7, label: 'Results', short: 'Results' },
]

export function WizardStepper({
  currentStep,
  maxStepReached,
  onStepClick,
  isProcessing = false,
  steps = STEPS,
}) {
  return (
    <nav className="wizard-stepper" aria-label="Talent Match workflow progress">
      <ol className="wizard-stepper-list">
        {steps.map((step) => {
          const isCurrent = currentStep === step.id
          const isCompleted = currentStep > step.id
          const isAccessible = step.id <= maxStepReached && !isProcessing

          let statusClass = 'pending'
          if (isCurrent) statusClass = 'current'
          else if (isCompleted) statusClass = 'completed'

          return (
            <li
              key={step.id}
              className={`wizard-step-item wizard-step-${statusClass}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <button
                type="button"
                className="wizard-step-btn"
                onClick={() => isAccessible && onStepClick(step.id)}
                disabled={!isAccessible}
                aria-label={`Step ${step.id}: ${step.label}${isCompleted ? ' (Completed)' : isCurrent ? ' (Current)' : ''}`}
              >
                <span className="wizard-step-indicator" aria-hidden="true">
                  {isCompleted ? <Check size={14} strokeWidth={2.5} /> : step.id}
                </span>
                <span className="wizard-step-label-group">
                  <span className="wizard-step-num">Step {step.id}</span>
                  <span className="wizard-step-title">{step.label}</span>
                </span>
              </button>

              {step.id < steps.length && (
                <div
                  className={`wizard-step-connector ${isCompleted ? 'connector-completed' : ''}`}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

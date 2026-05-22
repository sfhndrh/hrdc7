import { Fragment } from "react";

import { cn } from "@/components/ui/button";

type RegisterStepperProps = {
  steps: readonly string[];
  currentStep: number;
  /** Highest step index the user may jump to (inclusive). */
  maxReachableStep: number;
  onStepClick?: (index: number) => void;
};

export function RegisterStepper({
  steps,
  currentStep,
  maxReachableStep,
  onStepClick,
}: RegisterStepperProps) {
  return (
    <div
      className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-4 shadow-sm sm:px-5"
      aria-label="Registration progress"
    >
      <div className="flex w-full items-start">
        {steps.map((label, index) => {
          const isLast = index === steps.length - 1;
          const isActive = index === currentStep;
          const isComplete = index < currentStep;
          const canNavigate = index <= maxReachableStep && onStepClick != null;

          return (
            <Fragment key={label}>
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <button
                  type="button"
                  disabled={!canNavigate}
                  onClick={() => canNavigate && onStepClick(index)}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    isActive || isComplete
                      ? "bg-sky-600 text-white"
                      : "bg-gray-200 text-gray-600",
                    canNavigate && "cursor-pointer hover:ring-2 hover:ring-sky-200",
                    !canNavigate && "cursor-default",
                  )}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`Step ${index + 1}: ${label}`}
                >
                  {index + 1}
                </button>
                <span
                  className={cn(
                    "w-full px-0.5 text-center text-[10px] leading-tight sm:text-xs",
                    isActive ? "font-medium text-[color:var(--text)]" : "text-[color:var(--text-muted)]",
                  )}
                >
                  {label}
                </span>
              </div>
              {!isLast ? (
                <div
                  className={cn(
                    "mx-1 mt-[18px] h-px min-w-[8px] flex-1 sm:mx-2",
                    isComplete ? "bg-sky-300" : "bg-gray-200",
                  )}
                  aria-hidden
                />
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

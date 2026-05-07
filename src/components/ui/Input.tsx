"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightElement, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/40">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              "h-11 w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-sm text-white placeholder:text-white/25 transition-colors",
              "focus:border-white/20 focus:ring-1 focus:ring-white/10 focus:outline-none",
              leftIcon && "pl-10",
              rightElement && "pr-10",
              error && "border-red-500/50",
              className,
            )}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;

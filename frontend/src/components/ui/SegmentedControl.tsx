"use client";
import React from "react";
import { motion } from "framer-motion";

interface Option {
  id: string;
  label: string;
}

interface SegmentedControlProps {
  options: Option[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  disabled?: boolean;
}

export function SegmentedControl({ options, activeId, onChange, className = "", disabled = false }: SegmentedControlProps) {
  return (
    <div className={`relative flex items-center p-1.5 rounded-[16px] bg-surface-elevated border border-border-strong shadow-inner overflow-hidden ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {options.map((option) => {
        const isActive = activeId === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`relative flex-1 px-4 py-2.5 rounded-[12px] text-[13px] font-bold outline-none transition-colors z-10 ${
              isActive ? "text-white" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={`segment-${options.map(o => o.id).join("-")}`}
                className="absolute inset-0 bg-accent-grad rounded-[12px] shadow-[0_4px_16px_-4px_var(--accent-1)] -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

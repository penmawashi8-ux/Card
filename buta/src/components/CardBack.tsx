'use client';

import React from 'react';

interface CardBackProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  disabled?: boolean;
  highlighted?: boolean;
  className?: string;
  label?: string;
}

const SIZE_CLASSES = {
  sm: 'w-10 h-14',
  md: 'w-14 h-20',
  lg: 'w-16 h-24',
  xl: 'w-20 h-28',
} as const;

export default function CardBack({
  size = 'md',
  onClick,
  disabled = false,
  highlighted = false,
  className = '',
  label,
}: CardBackProps) {
  const sizeClass = SIZE_CLASSES[size];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={[
        'relative rounded-lg select-none transition-all duration-150',
        'border-2 shadow-md overflow-hidden',
        highlighted
          ? 'border-yellow-400 shadow-yellow-400/50 shadow-lg ring-2 ring-yellow-400'
          : 'border-blue-900/80',
        onClick && !disabled
          ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg active:scale-95'
          : 'cursor-default',
        disabled ? 'opacity-40' : '',
        sizeClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        background:
          'repeating-linear-gradient(45deg, #1e3a8a 0px, #1e3a8a 8px, #1d4ed8 8px, #1d4ed8 16px)',
      }}
    >
      {/* Inner border decoration */}
      <span
        className="absolute inset-1 rounded border border-blue-400/30 pointer-events-none"
        aria-hidden
      />
      {label && (
        <span className="absolute inset-0 flex items-center justify-center text-white/70 text-xs font-bold">
          {label}
        </span>
      )}
    </button>
  );
}

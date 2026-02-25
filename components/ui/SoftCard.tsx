
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SoftCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const SoftCard: React.FC<SoftCardProps> = ({ children, className, noPadding }) => {
  return (
    <div className={cn(
      "bg-surface rounded-[20px] border border-border-subtle shadow-soft overflow-hidden",
      !noPadding && "p-6",
      className
    )}>
      {children}
    </div>
  );
};


import React from 'react';
import { Inbox, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center text-text-secondary mb-6 shadow-sm">
        {icon || <Inbox className="w-10 h-10" />}
      </div>
      
      <h3 className="text-xl font-medium text-text-primary mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-text-secondary max-w-xs mx-auto mb-8 leading-relaxed">
        {description}
      </p>
      
      <div className="flex justify-center">
        {action}
      </div>
    </div>
  );
};

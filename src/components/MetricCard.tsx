import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  foot?: string;
  trend?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, foot, trend }) => {
  return (
    <div className="card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl hover:border-[rgba(26,26,24,0.2)] transition-colors flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <span className="label">
          {label}
        </span>
        {trend && (
          <span className="badge">
            {trend}
          </span>
        )}
      </div>
      <div className="my-2.5 font-mono text-2xl md:text-3xl font-medium text-[#1a1a18] tabular-nums tracking-tight">
        {value}
      </div>
      {foot && (
        <div className="text-xs font-mono text-[#1a1a18]/50 leading-snug border-t border-[rgba(26,26,24,0.08)] pt-2.5 mt-auto">
          {foot}
        </div>
      )}
    </div>
  );
};


import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  foot?: string;
  trend?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, foot, trend }) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {trend && (
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
            {trend}
          </span>
        )}
      </div>
      <div className="my-2.5 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-sans tabular-nums">
        {value}
      </div>
      {foot && <div className="text-xs text-slate-500 leading-snug">{foot}</div>}
    </div>
  );
};

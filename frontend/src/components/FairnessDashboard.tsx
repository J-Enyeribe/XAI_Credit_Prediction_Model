import React from 'react';
import type { FullFairnessReport, FairnessAttributeResult } from '../api/types';
 
interface FairnessDashboardProps {
  report: FullFairnessReport;
}
 
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    FAIR: { color: 'bg-pacific_blue-600 text-white', label: 'Fair' },
    WARNING: { color: 'bg-mustard-500 text-white', label: 'Warning' },
    BIASED: { color: 'bg-tomato-500 text-white', label: 'Biased' },
    CRITICAL: { color: 'bg-tomato-600 text-white', label: 'Critical' },
    ERROR: { color: 'bg-slate-600 text-white', label: 'Error' },
  };
  const { color, label } = config[status as keyof typeof config] || config.ERROR;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${color}`}>{label}</span>;
};
 
const FairnessDashboard: React.FC<FairnessDashboardProps> = ({ report }) => {
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-[var(--text-muted)] italic text-sm">
        Fairness data is currently unavailable.
      </div>
    );
  }

  return (
    <div className="space-y-[var(--space-base)]">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-[var(--text-main)]">Fairness Audit</h3>
          <p className="text-[var(--text-muted)] text-xs">Model discrimination analysis across protected attributes</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-1">Overall Status</div>
          <StatusBadge status={report.overall_status} />
        </div>
      </div>
 
      <div className="p-4 bg-[var(--bg-card)]/40 rounded-lg border [border:var(--border-thin)]">
        <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3">Audit Legend</h4>
        <div className="grid grid-cols-1 gap-y-2 text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pacific_blue-500" />
            <span>Fair: No significant bias detected.</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-mustard-500" />
            <span>Warning: Mild disparity detected.</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-tomato-500" />
            <span>Biased: Fails the 80% rule.</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-tomato-600" />
            <span>Critical: Severe discrimination.</span>
          </div>
        </div>
      </div>
 
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Overall Metrics</h4>
        <div className="grid grid-cols-2 gap-[var(--space-tight)]">
          {[
            { label: 'Mean Disparate Impact', value: report.summary?.mean_disparate_impact, desc: 'Ratio of approval rates. 1.0 is perfect equality.' },
            { label: 'Min Disparate Impact', value: report.summary?.min_disparate_impact, desc: 'The lowest approval ratio found across groups.' },
            { label: 'Max Stat. Parity Diff', value: report.summary?.max_abs_statistical_parity, desc: 'Difference in approval rates between groups.' },
            { label: 'Max Equal Opp. Diff', value: report.summary?.max_abs_equal_opportunity, desc: 'Difference in accuracy for qualified applicants.' },
          ].map((stat, i) => (
            <div key={i} className="p-3 bg-[var(--bg-card)]/30 rounded-xl border [border:var(--border-thin)] group hover:bg-[var(--bg-card)]/50 transition-all">
              <div className="flex justify-between items-start mb-1">
                <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold">{stat.label}</div>
              </div>
              <div className="text-lg font-mono font-bold text-[var(--text-main)]">{stat.value ?? 'N/A'}</div>
              <p className="text-[9px] text-[var(--text-muted)] mt-1 leading-tight opacity-70 group-hover:opacity-100 transition-opacity">
                {stat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
 
      <div className="space-y-[var(--space-tight)]">
        <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Attribute Analysis</h4>
        <div className="space-y-3">
          {report.results?.map((res, i) => (
            <div key={i} className="p-3 bg-[var(--bg-card)]/20 rounded-xl border [border:var(--border-thin)] group hover:bg-[var(--bg-card)]/40 transition-all">
              <div className="flex justify-between items-center mb-3">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[var(--text-main)]">{res.attribute}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Privileged: {res.privileged_value}</span>
                </div>
                <StatusBadge status={res.status} />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--accent)]/10">
                <div className="flex flex-col">
                  <span className="text-[9px] text-[var(--text-muted)] uppercase font-bold" title="Disparate Impact">DI</span>
                  <span className="text-xs font-mono text-[var(--text-main)]">{res.metrics?.disparate_impact ?? 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-[var(--text-muted)] uppercase font-bold" title="Statistical Parity Difference">SPD</span>
                  <span className="text-xs font-mono text-[var(--text-main)]">{res.metrics?.statistical_parity_difference ?? 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-[var(--text-muted)] uppercase font-bold" title="Equal Opportunity Difference">EOD</span>
                  <span className="text-xs font-mono text-[var(--text-main)]">{res.metrics?.equal_opportunity_difference ?? 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
 
export default FairnessDashboard;

import React from 'react';
import type { ModelInfo } from '../api/client';

interface ModelHUDProps {
  modelInfo: ModelInfo | null;
  className?: string;
}

const ModelHUD: React.FC<ModelHUDProps> = ({ modelInfo, className }) => {
  return (
    <div className={`w-full p-6 bg-[var(--bg-card)]/80 backdrop-blur-md border [border:var(--border-thin)] font-mono text-sm text-[var(--text-main)] shadow-lg rounded-xl ${className || ''}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-2.5 h-2.5 rounded-full bg-pacific_blue-500 animate-pulse shadow-[0_0_8px_#009fb7]" />
        <span className="uppercase tracking-widest text-[var(--text-muted)] font-bold text-[10px]">System Active</span>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="text-[var(--text-muted)] uppercase text-[10px] font-bold mb-1">Champion Model</div>
          <div className="text-pacific_blue-500 font-bold text-xs">{modelInfo?.model || 'Logistic Regression'}</div>
        </div>
        
        <div>
          <div className="text-[var(--text-muted)] uppercase text-[10px] font-bold mb-1">Performance Metrics</div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]/60">AUC:</span>
              <span className="text-[var(--text-main)] font-semibold">{modelInfo?.auc || '0.76'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]/60">Recall:</span>
              <span className="text-[var(--text-main)] font-semibold">{modelInfo?.recall || '0.70'}</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t [border-color:var(--accent)]/10">
          <div className="text-[var(--text-muted)] uppercase text-[10px] font-bold mb-2">Model Rationale</div>
          <div className="text-[10px] leading-relaxed text-[var(--text-muted)] italic h-20 overflow-y-auto custom-scrollbar pr-2">
            {modelInfo?.rationale || 'Loading model rationale...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelHUD;

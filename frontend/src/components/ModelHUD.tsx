import React from 'react';
import type { ModelInfo } from '../api/client';

interface ModelHUDProps {
  modelInfo: ModelInfo | null;
  className?: string;
}

const ModelHUD: React.FC<ModelHUDProps> = ({ modelInfo, className }) => {
  return (
    <div className={`w-full p-6 bg-black/60 backdrop-blur-lg border border-[#E25D30]/30 font-mono text-sm text-[#FDE8DC] shadow-2xl rounded-lg ${className || ''}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
        <span className="uppercase tracking-widest text-[#B38A7C] font-bold">System Active</span>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="text-slate-500 uppercase text-[10px] font-bold mb-1">Champion Model</div>
          <div className="text-[#FB923C] font-bold text-xs">{modelInfo?.model || 'Logistic Regression'}</div>
        </div>
        
        <div>
          <div className="text-slate-500 uppercase text-[10px] font-bold mb-1">Performance Metrics</div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-400">AUC:</span>
              <span className="text-[#FDE8DC]">{modelInfo?.auc || '0.76'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Recall:</span>
              <span className="text-[#FDE8DC]">{modelInfo?.recall || '0.70'}</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10">
          <div className="text-slate-500 uppercase text-[10px] font-bold mb-2">Model Rationale</div>
          <div className="text-[10px] leading-relaxed text-slate-400 italic h-20 overflow-y-auto custom-scrollbar pr-2">
            {modelInfo?.rationale || 'Loading model rationale...'}
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="scanline w-full h-full" />
      </div>
    </div>
  );
};

export default ModelHUD;

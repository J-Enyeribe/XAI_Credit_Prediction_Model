import React from 'react';
import type { ModelInfoResponse } from '../api/client';

interface ModelHUDProps {
  modelInfo: ModelInfoResponse | null;
}

const ModelHUD: React.FC<ModelHUDProps> = ({ modelInfo }) => {
  return (
    <div className="absolute top-6 right-6 w-64 p-5 bg-black/60 backdrop-blur-lg border-l-4 border-[#E25D30] font-mono text-sm text-[#FDE8DC] shadow-2xl rounded-r-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
        <span className="uppercase tracking-widest text-[#B38A7C] font-bold">System Active</span>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="text-slate-500 uppercase text-[10px] font-bold mb-1">Model Configuration</div>
          <div className="truncate opacity-90 text-xs">{modelInfo?.model_path || 'Searching...'}</div>
        </div>
        
        <div>
          <div className="text-slate-500 uppercase text-[10px] font-bold mb-1">Status</div>
          <div className="text-green-400 font-bold">OPTIMIZED_CORE_V4</div>
        </div>

        <div className="pt-3 border-t border-white/10">
          <div className="text-slate-500 uppercase text-[10px] font-bold mb-2">Diagnostic Log</div>
          <div className="text-xs leading-relaxed text-slate-400 italic h-16 overflow-hidden relative">
            &gt; Initializing Weights...<br/>
            &gt; Processing SHAP...<br/>
            &gt; Analysis Complete.<br/>
            &gt; Nucleus Stabilized.
          </div>
          <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-black to-transparent" />
        </div>
      </div>
      
      {/* Scanline effect element */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="scanline w-full h-full" />
      </div>
    </div>
  );
};

export default ModelHUD;

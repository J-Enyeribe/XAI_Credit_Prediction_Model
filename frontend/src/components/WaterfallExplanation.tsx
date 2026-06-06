import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { WaterfallResponse } from '../api/types';

interface WaterfallExplanationProps {
  data: WaterfallResponse;
}

const WaterfallExplanation: React.FC<WaterfallExplanationProps> = ({ data }) => {
  const { base_value, final_value, steps } = data;
  
  // Respect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-[#1A0A06]/60 rounded-2xl backdrop-blur-xl border border-[#E25D30]/30 shadow-2xl">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-[#FDE8DC] mb-2">Decision Path</h3>
        <p className="text-[#B38A7C] text-sm">How each feature shifted the risk probability</p>
      </div>
      
      <div className="flex flex-col gap-3 w-full max-w-lg">
        <div className="flex justify-between items-center p-3 bg-[#431407]/40 rounded-lg text-sm text-[#B38A7C] border border-[#E25D30]/10">
          <span className="font-medium">Base Probability (Average)</span>
          <span className="font-mono font-bold text-[#FDE8DC]">{base_value.toFixed(4)}</span>
        </div>

        <div className="space-y-2">
          {steps.map((step, index) => {
            const isPositive = step.shap_value > 0;
            return (
              <motion.div
                key={step.feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: index * 0.08,
                  ease: prefersReducedMotion ? "linear" : [0.34, 1.56, 0.64, 1] 
                }}
                className={`flex justify-between items-center p-3 rounded-lg text-sm transition-all group ${
                  isPositive 
                    ? 'bg-[#E25D30]/10 text-[#FB923C] border border-[#E25D30]/20' 
                    : 'bg-[#B38A7C]/10 text-[#FDE8DC] border border-[#B38A7C]/20'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`shrink-0 ${isPositive ? 'text-[#FB923C]' : 'text-[#FDE8DC]'}`}>
                    {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  </div>
                  <span className="truncate font-medium">{step.raw_feature}</span>
                </div>
                <span className="font-mono font-bold ml-4">
                  {isPositive ? `+${step.shap_value.toFixed(4)}` : step.shap_value.toFixed(4)}
                </span>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-between items-center p-4 bg-[#E25D30] rounded-lg text-sm text-[#FDE8DC] font-bold mt-6 shadow-lg shadow-[#E25D30]/30 animate-pulse">
          <span className="uppercase tracking-wider">Final Risk Score</span>
          <span className="font-mono text-xl">{final_value.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
};

export default WaterfallExplanation;

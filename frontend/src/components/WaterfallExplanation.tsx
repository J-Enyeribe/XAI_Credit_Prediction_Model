import React from 'react';
import { motion } from 'framer-motion';

interface WaterfallExplanationProps {
  explanation: Record<string, number>;
  baseValue: number;
  finalValue: number;
}

const WaterfallExplanation: React.FC<WaterfallExplanationProps> = ({ explanation, baseValue, finalValue }) => {
  const sortedFeatures = Object.entries(explanation)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
    .slice(0, 10);

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-[#431407]/50 rounded-xl backdrop-blur-md border border-[#E25D30]/30">
      <h3 className="text-xl font-bold text-[#FDE8DC] mb-4">Decision Path</h3>
      
      <div className="flex flex-col gap-2 w-full max-w-md">
        <div className="flex justify-between items-center p-2 bg-[#1A0A06]/50 rounded text-sm text-[#B38A7C]">
          <span>Base Probability</span>
          <span className="font-mono">{baseValue.toFixed(4)}</span>
        </div>

        {sortedFeatures.map(([feature, value], index) => (
          <motion.div
            key={feature}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex justify-between items-center p-2 rounded text-sm transition-colors ${
              value > 0 ? 'bg-[#E25D30]/20 text-[#FB923C]' : 'bg-[#B38A7C]/20 text-[#FDE8DC]'
            }`}
          >
            <span className="truncate mr-4">{feature}</span>
            <span className="font-mono">{value > 0 ? `+${value.toFixed(4)}` : value.toFixed(4)}</span>
          </motion.div>
        ))}

        <div className="flex justify-between items-center p-2 bg-[#E25D30] rounded text-sm text-[#FDE8DC] font-bold mt-4 shadow-lg shadow-[#E25D30]/20">
          <span>Final Risk Score</span>
          <span className="font-mono">{finalValue.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
};

export default WaterfallExplanation;

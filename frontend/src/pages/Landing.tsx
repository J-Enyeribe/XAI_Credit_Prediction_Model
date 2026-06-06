import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getModelInfo } from '../api/client';
import type { ModelInfo } from '../api/client';
import LandingScene from '../scenes/LandingScene';
import ModelHUD from '../components/ModelHUD';

interface StatCardProps {
  label: string;
  value: string;
  subtext: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtext }) => (
  <motion.div 
    className="relative p-8 border-l border-b border-[#E25D30]/20 group hover:border-[#E25D30]/50 transition-colors duration-500"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
  >
    <div className="absolute -top-px -left-px w-2 h-2 bg-[#E25D30] opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="text-[#B38A7C] text-[10px] uppercase tracking-[0.2em] mb-4 font-medium">{label}</div>
    <div className="text-4xl font-light text-[#FDE8DC] mb-2 tracking-tighter">{value}</div>
    <div className="text-[#B38A7C] text-xs font-mono opacity-60">{subtext}</div>
  </motion.div>
);

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const info = await getModelInfo();
        setModelInfo(info);
        setStatsError(null);
      } catch (err) {
        console.error('Failed to load model info:', err);
        setStatsError('Model stats unavailable');
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#1A0A06] text-[#FDE8DC] overflow-x-hidden">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 10] }}>
          <LandingScene />
        </Canvas>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="h-screen flex flex-col items-center justify-center px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className="text-[#E25D30] uppercase tracking-[0.4em] text-[10px] mb-8 font-bold">
              BSc Final Year Project · JKUAT
            </div>
            <h1 className="text-6xl md:text-9xl font-light leading-[0.9] mb-12 tracking-tighter">
              Transparent<br />
              <span className="font-bold italic">credit decisions</span><br />
              <span className="text-[#E25D30] font-light">powered by AI</span>
            </h1>
            <p className="text-[#B38A7C] text-lg md:text-xl max-w-2xl mx-auto mb-16 leading-relaxed font-light opacity-80">
              Predicts loan default probability using ensemble ML with SHAP explanations you can actually read.
            </p>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/predict')}
              className="px-10 py-4 border border-[#E25D30] text-[#FDE8DC] font-medium rounded-none text-sm uppercase tracking-widest transition-all hover:bg-[#E25D30] hover:text-[#1A0A06]"
            >
              Launch predictor →
            </motion.button>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="py-32 px-6 bg-[#1A0A06]/40 backdrop-blur-sm border-y border-[#E25D30]/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-6">
              <div className="text-left">
                <h2 className="text-4xl font-light mb-4 tracking-tight">Model Performance</h2>
                <div className="h-px w-24 bg-[#E25D30]" />
              </div>
              <div className="text-[#B38A7C] text-xs font-mono uppercase tracking-widest opacity-60">
                Technical Specifications v1.0
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-[#E25D30]/20">
              {statsLoading ? (
                <>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-8 border-l border-b border-[#E25D30]/20">
                      <div className="h-3 w-24 bg-[#431407]/50 rounded animate-pulse mb-4" />
                      <div className="h-8 w-20 bg-[#431407]/50 rounded animate-pulse mb-3" />
                      <div className="h-3 w-16 bg-[#431407]/30 rounded animate-pulse" />
                    </div>
                  ))}
                </>
              ) : statsError ? (
                <div className="col-span-4 p-8 text-center border-r border-b border-[#E25D30]/20">
                  <p className="text-[#B38A7C] text-sm">{statsError}</p>
                </div>
              ) : (
                <>
                  <StatCard 
                    label="Model AUC" 
                    value={modelInfo?.auc?.toFixed(3) ?? '—'} 
                    subtext={modelInfo?.model ?? 'Unknown'} 
                  />
                  <StatCard 
                    label="Features" 
                    value={String(modelInfo?.features?.length ?? '—')} 
                    subtext="After Pre-Processing" 
                  />
                  <StatCard 
                    label="F1 Score" 
                    value={modelInfo?.f1?.toFixed(3) ?? '—'} 
                    subtext="Validation Set" 
                  />
                  <StatCard 
                    label="Explainability" 
                    value="SHAP" 
                    subtext="Local & Global" 
                  />
                </>
              )}
            </div>
          </div>
        </section>

        {/* Model Blueprint Section */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6"
            >
              <div className="text-left">
                <h2 className="text-4xl font-light mb-4 tracking-tight">System Blueprint</h2>
                <div className="h-px w-24 bg-[#E25D30]" />
              </div>
              <div className="text-[#B38A7C] text-xs font-mono uppercase tracking-widest opacity-60">
                Active Model Configuration
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {modelInfo ? (
                <ModelHUD modelInfo={modelInfo} className="w-full max-w-3xl mx-auto" />
              ) : (
                <div className="w-full max-w-3xl mx-auto p-6 bg-black/40 backdrop-blur-sm border border-[#E25D30]/20 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-[#431407] animate-pulse" />
                    <span className="uppercase tracking-widest text-[#B38A7C] text-xs font-bold">Loading Model Info...</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Tech Stack / How it works */}
        <section className="py-32 px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-4">
                <h2 className="text-4xl font-light mb-6 tracking-tight">Transparent AI Workflow</h2>
                <p className="text-[#B38A7C] text-sm leading-relaxed opacity-70">
                  A multi-stage pipeline designed to eliminate the "black box" nature of credit scoring.
                </p>
              </div>
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                  { step: "01", title: "Input Data", desc: "Applicant financial and personal metrics are processed." },
                  { step: "02", title: "ML Prediction", desc: "Ensemble models calculate the probability of default." },
                  { step: "03", title: "SHAP Analysis", desc: "The decision is decomposed into human-readable drivers." },
                ].map((item, i) => (
                  <div key={i} className="relative">
                    <div className="text-[#E25D30] text-xs font-mono mb-4 block">{item.step} </div>
                    <div className="font-bold mb-2 text-lg">{item.title}</div>
                    <div className="text-[#B38A7C] text-sm leading-relaxed opacity-80">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Landing;

import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { getModelInfo } from '../api/client';
import type { ModelInfo } from '../api/client';
import LandingScene from '../scenes/LandingScene';
import ModelHUD from '../components/ModelHUD';

interface StatCardProps {
  label: string;
  value: string;
  subtext: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, className }) => (
  <motion.div 
    className={`relative p-8 bg-[var(--bg-card)]/40 rounded-2xl border [border:var(--border-thin)] group hover:border-pacific_blue-500/40 transition-all duration-500 ${className}`}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-pacific_blue-500/5 rounded-full blur-3xl -mr-12 -mt-12 transition-all group-hover:bg-pacific_blue-500/10" />
    <div className="relative z-10">
      <div className="text-[var(--text-muted)] text-[10px] uppercase tracking-[0.2em] mb-4 font-bold">{label}</div>
      <div className="text-5xl font-light text-[var(--text-main)] mb-2 tracking-tighter">{value}</div>
      <div className="text-[var(--text-muted)] text-xs font-mono opacity-60">{subtext}</div>
    </div>
  </motion.div>
);

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const [showFloatingCta, setShowFloatingCta] = useState(false);

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

  // IntersectionObserver to detect when hero CTA leaves viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingCta(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const transition = prefersReducedMotion 
    ? { duration: 0 } 
    : { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

  return (
    <div className="relative min-h-screen w-full bg-[var(--bg-dark)] text-[var(--text-main)] overflow-x-hidden">
      <div className="grain-overlay" />
      
      {/* 3D Background */}
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 2, 16], fov: 60 }}>
          <LandingScene />
        </Canvas>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section - Asymmetric Layout */}
        <section className="h-screen flex items-center justify-start px-6 md:px-20">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={transition}
            className="max-w-3xl text-left"
          >
            <div className="text-pacific_blue-500 uppercase tracking-[0.4em] text-[14px] mb-8 font-bold">
              BSc Final Year Project · JKUAT
            </div>
            <h1 className="text-6xl md:text-8xl font-light leading-[1.1] mb-12 tracking-tighter">
              Transparent<br />
              <span className="font-bold italic">credit decisions</span><br />
              <span className="text-pacific_blue-500 font-light">powered by AI</span>
            </h1>
            <p className="text-[var(--text-muted)] text-lg md:text-xl max-w-xl mb-16 leading-relaxed font-light opacity-80">
              Predicts loan default probability using ensemble Machine Learning with SHAPley explanations you can actually read.
            </p>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/predict')}
              className="relative group px-10 py-6 bg-[var(--bg-card)]/40 rounded-2xl [border:var(--border-thin)] hover:border-pacific_blue-500/50 transition-all duration-500 hover:shadow-[0_0_48px_rgba(0,159,183,0.12)]"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
                style={{ background: 'radial-gradient(circle at center, rgba(0,159,183,0.08) 0%, transparent 70%)' }} 
              />

              {/* Content */}
              <div className="relative z-10 flex items-center gap-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-6 h-6 transition-all duration-500 group-hover:drop-shadow-[0_0_6px_rgba(0,159,183,0.5)]"
                >
                  <path
                    d="M12 3L4 7v5c0 5.25 3.5 10.15 8 11 4.5-.85 8-5.75 8-11V7l-8-4z"
                    fill="var(--text-muted)"
                    fillOpacity="0.15"
                    stroke="var(--text-muted)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 12l2 2 4-4"
                    className="group-hover:opacity-100 transition-opacity duration-500"
                    stroke="var(--text-muted)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.5"
                  />
                </svg>
                <span className="text-sm font-bold uppercase tracking-widest text-[var(--text-main)] group-hover:text-pacific_blue-500 transition-colors duration-500">
                  Launch predictor <span className="text-lg leading-none ml-1">→</span>
                </span>
              </div>
            </motion.button>
          </motion.div>
        </section>

        {/* Sentinel — triggers floating CTA when this point scrolls out of view */}
        <div ref={sentinelRef} className="h-0 w-full" />

        {/* Stats Section - Asymmetric Bento Grid */}
        <section className="py-32 px-6 md:px-20 bg-[var(--bg-card)]/30 backdrop-blur-sm border-y [border:var(--border-thin)]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-6">
              <div className="text-left">
                <h2 className="text-5xl font-light mb-6 tracking-tight text-[var(--text-main)]">Model Performance</h2>
                <div className="h-px w-32 bg-pacific_blue-500" />
              </div>
              <div className="text-[var(--text-muted)] text-xs font-mono uppercase tracking-widest opacity-60">
                Performance Metrics for v1.0
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {statsLoading ? (
                <>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`p-8 bg-[var(--bg-card)]/40 rounded-2xl border [border:var(--border-thin)] ${i === 0 ? 'md:col-span-2' : ''}`}>
                      <div className="h-3 w-24 bg-[var(--bg-card)] rounded animate-pulse mb-4" />
                      <div className="h-8 w-20 bg-[var(--bg-card)] rounded animate-pulse mb-3" />
                      <div className="h-3 w-16 bg-[var(--bg-card)]/70 rounded animate-pulse" />
                    </div>
                  ))}
                </>
              ) : statsError ? (
                <div className="col-span-3 p-8 text-center border [border:var(--border-thin)] rounded-2xl bg-[var(--bg-card)]/40">
                  <p className="text-[var(--text-muted)] text-sm">{statsError}</p>
                </div>
              ) : (
                <>
                  <StatCard 
                    label="Model AUC" 
                    value={modelInfo?.auc?.toFixed(3) ?? '—'} 
                    subtext={modelInfo?.model ?? 'Unknown'} 
                    className="md:col-span-2"
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

        {/* Model Blueprint Section - Offset Layout */}
        <section className="py-32 px-6 md:px-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-5 text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={transition}
              >
                <h2 className="text-5xl font-light mb-6 tracking-tight text-[var(--text-main)]">System Architecture</h2>
                <div className="h-px w-24 bg-pacific_blue-500 mb-8" />
                <p className="text-[var(--text-muted)] text-lg leading-relaxed font-light opacity-80 mb-8">
                  My architecture combines the predictive power of ensemble learning with the transparency of SHAP values, ensuring every decision is auditable.
                </p>
                <div className="text-[var(--text-muted)] text-xs font-mono uppercase tracking-widest opacity-60">
                  Active Model Configuration
                </div>
              </motion.div>
            </div>
            
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={transition}
              >
                {modelInfo ? (
                  <ModelHUD modelInfo={modelInfo} className="w-full shadow-2xl" />
                ) : (
                  <div className="w-full p-6 bg-[var(--bg-card)]/60 backdrop-blur-sm border [border:var(--border-thin)] rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--bg-card)] animate-pulse" />
                      <span className="uppercase tracking-widest text-[var(--text-muted)] text-xs font-bold">Loading Model Info...</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Tech Stack / How it works - Diagonal Flow */}
        <section className="py-32 px-6 md:px-20 bg-[var(--bg-card)]/20 border-y [border:var(--border-thin)]">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={transition}
            className="max-w-7xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
              <div className="lg:col-span-5">
                <h2 className="text-5xl font-light mb-8 tracking-tight text-[var(--text-main)]">XAI Workflow</h2>
                <p className="text-[var(--text-muted)] text-lg leading-relaxed opacity-70">
                  A multi-stage pipeline designed to eliminate the "black box" nature of credit scoring.
                </p>
              </div>
              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { step: "01", title: "Input Data", desc: "Applicant financial and personal metrics are processed.", offset: "mt-0" },
                  { step: "02", title: "ML Prediction", desc: "Ensemble models calculate the probability of default.", offset: "mt-12" },
                  { step: "03", title: "SHAP Analysis", desc: "The decision is decomposed into human-readable drivers.", offset: "mt-0" },
                ].map((item, i) => (
                  <div key={i} className={`relative p-8 bg-[var(--bg-card)]/40 rounded-2xl border [border:var(--border-thin)] hover:border-pacific_blue-500/30 transition-all duration-500 ${item.offset}`}>
                    <div className="text-pacific_blue-500 text-xs font-mono mb-4 font-bold">{item.step}</div>
                    <div className="font-bold mb-2 text-xl text-[var(--text-main)]">{item.title}</div>
                    <div className="text-[var(--text-muted)] text-sm leading-relaxed opacity-80">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      </div>

      {/* Floating CTA — appears when hero scrolls out of view */}
      <AnimatePresence>
        {showFloatingCta && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-8 right-8 z-50"
          >
            <button
              onClick={() => navigate('/predict')}
              className="relative group flex items-center gap-3 px-6 py-3.5 bg-[var(--bg-card)]/80 backdrop-blur-md rounded-xl [border:var(--border-thin)] hover:border-pacific_blue-500/50 transition-all duration-500 shadow-2xl hover:shadow-[0_0_40px_rgba(0,159,183,0.15)]"
              aria-label="Launch predictor"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
                style={{ background: 'radial-gradient(circle at center, rgba(0,159,183,0.1) 0%, transparent 70%)' }} 
              />

              {/* Content */}
              <div className="relative z-10 flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-5 h-5 transition-all duration-500 group-hover:drop-shadow-[0_0_4px_rgba(0,159,183,0.5)]"
                >
                  <path
                    d="M12 3L4 7v5c0 5.25 3.5 10.15 8 11 4.5-.85 8-5.75 8-11V7l-8-4z"
                    fill="var(--text-muted)"
                    fillOpacity="0.15"
                    stroke="var(--text-muted)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 12l2 2 4-4"
                    className="group-hover:opacity-100 transition-opacity duration-500"
                    stroke="var(--text-muted)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.5"
                  />
                </svg>
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-main)] group-hover:text-pacific_blue-500 transition-colors duration-500">
                  Launch predictor <span className="text-base leading-none ml-1">→</span>
                </span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;

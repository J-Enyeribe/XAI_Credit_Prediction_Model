import React from 'react';
import { Canvas } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LandingScene from '../scenes/LandingScene';

interface StatCardProps {
  label: string;
  value: string;
  subtext: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtext }) => (
  <motion.div 
    whileHover={{ y: -5, backgroundColor: 'rgba(67, 20, 7, 0.8)' }}
    className="p-6 rounded-xl bg-[#431407]/40 border border-[#E25D30]/30 backdrop-blur-sm"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
  >
    <div className="text-[#B38A7C] text-[10px] uppercase tracking-widest mb-2">{label}</div>
    <div className="text-3xl font-bold text-[#FDE8DC] mb-1">{value}</div>
    <div className="text-[#B38A7C] text-xs">{subtext}</div>
  </motion.div>
);

const Landing: React.FC = () => {
  const navigate = useNavigate();

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
            <div className="text-[#E25D30] uppercase tracking-[0.3em] text-xs mb-6 font-medium">
              BSc Final Year Project · JKUAT
            </div>
            <h1 className="text-5xl md:text-8xl font-bold leading-tight mb-8">
              Transparent<br />
              credit decisions<br />
              <span className="text-[#E25D30]">powered by AI</span>
            </h1>
            <p className="text-[#B38A7C] text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              Predicts loan default probability using ensemble ML with SHAP explanations you can actually read.
            </p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/predict')}
              className="px-8 py-4 bg-[#E25D30] text-[#1A0A06] font-bold rounded-full text-lg transition-colors hover:bg-[#FB923C]"
            >
              Launch predictor →
            </motion.button>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="py-24 px-6 bg-[#1A0A06]/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Model Performance</h2>
              <div className="h-1 w-20 bg-[#E25D30] mx-auto" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                label="Model AUC" 
                value="0.754" 
                subtext="XGBoost" 
              />
              <StatCard 
                label="Features" 
                value="31" 
                subtext="After Pre-Processing" 
              />
              <StatCard 
                label="Training set" 
                value="361k" 
                subtext="Loan Records" 
              />
              <StatCard 
                label="Explainability" 
                value="SHAP" 
                subtext="Local & Global" 
              />
            </div>
          </div>
        </section>

        {/* Tech Stack / How it works (simplified) */}
        <section className="py-24 px-6 text-center">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-8">Transparent AI Workflow</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div>
                <div className="text-[#E25D30] text-2xl font-bold mb-2">01</div>
                <div className="font-bold mb-2">Input Data</div>
                <div className="text-[#B38A7C] text-sm">Applicant financial and personal metrics are processed.</div>
              </div>
              <div>
                <div className="text-[#E25D30] text-2xl font-bold mb-2">02</div>
                <div className="font-bold mb-2">ML Prediction</div>
                <div className="text-[#B38A7C] text-sm">Ensemble models calculate the probability of default.</div>
              </div>
              <div>
                <div className="text-[#E25D30] text-2xl font-bold mb-2">03</div>
                <div className="font-bold mb-2">SHAP Analysis</div>
                <div className="text-[#B38A7C] text-sm">The decision is decomposed into human-readable drivers.</div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Landing;

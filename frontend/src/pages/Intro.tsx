import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import IntroScene from '../scenes/IntroScene';

const Intro: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/landing');
    }, 6000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.4,
        delayChildren: 0.5,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  return (
    <div className="relative h-screen w-full bg-[#1A0A06] overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <IntroScene />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <motion.div 
          className="text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            variants={itemVariants}
            className="text-[#B38A7C] uppercase tracking-[0.3em] text-xs mb-4 font-medium"
          >
            Explainable AI System
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl font-bold text-[#FDE8DC] leading-tight mb-6"
          >
            XAI Credit<br />
            <span className="text-[#E25D30]">Risk Prediction</span>
          </motion.h1>

          <motion.div 
            variants={itemVariants}
            className="h-px w-24 bg-[#E25D30] mx-auto mb-6"
          />

          <motion.div 
            variants={itemVariants}
            className="text-[#B38A7C] text-sm tracking-wider"
          >
            Justin Enyeribe Ndubuisi · JKUAT · 2026
          </motion.div>
        </motion.div>
      </div>

      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 h-1 bg-[#E25D30]/30 w-full">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
           transition={{ duration: 6, ease: 'linear' }}
          className="h-full bg-[#E25D30]"
        />
      </div>
    </div>
  );
};

export default Intro;

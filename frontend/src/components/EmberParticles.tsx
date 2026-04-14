import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EmberParticlesProps {
  riskScore: number;
}

const EmberParticles: React.FC<EmberParticlesProps> = ({ riskScore }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Create random positions for particles
  const particleCount = 200;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.getElapsedTime();
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        // Move particles upward
        positions[idx + 1] += 0.02 + (riskScore / 500);
        // Slight horizontal drift
        positions[idx] += Math.sin(time + i) * 0.005;
        
        // Reset particles that go too high
        if (positions[idx + 1] > 10) {
          positions[idx + 1] = -10;
          positions[idx] = (Math.random() - 0.5) * 20;
          positions[idx + 2] = (Math.random() - 0.5) * 20;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position" 
          count={particleCount} 
          array={positions} 
          itemSize={3} 
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.05} 
        color="#E25D30" 
        transparent 
        opacity={0.6} 
        blending={THREE.AdditiveBlending} 
      />
    </points>
  );
};

export default EmberParticles;

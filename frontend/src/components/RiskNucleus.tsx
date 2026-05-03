import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RiskNucleusProps {
  riskScore: number; // 0 to 100
}

const RiskNucleus: React.FC<RiskNucleusProps> = ({ riskScore }) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);
  
  const getColor = (score: number) => {
    if (score < 25) return '#22c55e'; // Low: Green
    if (score < 50) return '#eab308'; // Mid: Yellow/Amber
    return '#E25D30'; // High: Ember Coral
  };

  const getIntensity = (score: number) => {
    // Non-linear intensity: low for green, high for red
    if (score < 25) return 0.5 + (score / 50);
    if (score < 50) return 1.5 + (score / 100);
    return 3.0 + (score / 50);
  };

  const createArcShape = (fillPercentage: number) => {
    const shape = new THREE.Shape();
    const innerRadius = 2.2;
    const outerRadius = 2.5;
    const startAngle = Math.PI;
    const endAngle = Math.PI + (Math.PI * (fillPercentage / 100));

    shape.absarc(0, 0, outerRadius, startAngle, endAngle, false);
    shape.absarc(0, 0, innerRadius, endAngle, startAngle, true);
    shape.closePath();
    return shape;
  };

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Core Animation: Pulse and jitter scaled by risk
    if (coreRef.current) {
      const pulse = 1 + Math.sin(time * 2) * 0.05;
      const jitterAmt = (riskScore / 100) * 0.02;
      const jitter = (Math.random() - 0.5) * jitterAmt;
      coreRef.current.scale.set(pulse, pulse, pulse);
      coreRef.current.position.set(jitter, jitter, jitter);
    }
    
    // Ring Animation: Slow rotation around its own axis
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.002;
    }
  });

  const color = getColor(riskScore);
  const intensity = getIntensity(riskScore);

  const trackShape = useMemo(() => createArcShape(100), []);
  const fillShape = useMemo(() => createArcShape(riskScore), [riskScore]);

  return (
    <group position={[0, 0, 0]}>
      {/* The Core: Pulsing Orb */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={intensity} 
          toneMapped={false}
        />
      </mesh>

      {/* The Precision Ring: Now facing the screen (Z-axis) */}
      <group ref={ringRef}>
        {/* Background Track */}
        <mesh>
          <extrudeGeometry args={[trackShape, { depth: 0.1, bevelEnabled: false }]} />
          <meshStandardMaterial color="#2d0a05" transparent opacity={0.5} />
        </mesh>
        {/* Active Fill Arc */}
        <mesh>
          <extrudeGeometry args={[fillShape, { depth: 0.15, bevelEnabled: false }]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={intensity} 
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
};

export default RiskNucleus;

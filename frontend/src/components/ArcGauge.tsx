import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ArcGaugeProps {
  riskScore: number; // 0 to 100
}

const ArcGauge: React.FC<ArcGaugeProps> = ({ riskScore }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const getColor = (score: number) => {
    const intensity = score / 100;
    const r = Math.floor(67 + (226 - 67) * intensity);
    const g = Math.floor(20 + (93 - 20) * intensity);
    const b = Math.floor(7 + (48 - 7) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const createArcShape = (fillPercentage: number) => {
    const shape = new THREE.Shape();
    const innerRadius = 3.0; // Increased size
    const outerRadius = 3.5; // Increased size
    const startAngle = Math.PI;
    const endAngle = Math.PI + (Math.PI * (fillPercentage / 100));

    shape.absarc(0, 0, outerRadius, startAngle, endAngle, false);
    shape.absarc(0, 0, innerRadius, endAngle, startAngle, true);
    shape.closePath();
    return shape;
  };

  useFrame((state) => {
    if (meshRef.current) {
      // Stable, subtle pulse in emissive intensity rather than scale
      const time = state.clock.getElapsedTime();
      const pulse = 0.5 + Math.sin(time * 0.5) * 0.2;
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = (riskScore / 50) * pulse;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Background Track */}
      <mesh rotation={[0, 0, 0]}>
        <extrudeGeometry args={[createArcShape(100), { depth: 0.4, bevelEnabled: false }]} />
        <meshStandardMaterial color="#2d0a05" />
      </mesh>
      
      {/* Active Fill Arc */}
      <mesh ref={meshRef}>
        <extrudeGeometry args={[createArcShape(riskScore), { depth: 0.5, bevelEnabled: false }]} />
        <meshStandardMaterial 
          color={getColor(riskScore)} 
          emissive={getColor(riskScore)}
          emissiveIntensity={riskScore / 50}
        />
      </mesh>
    </group>
  );
};

export default ArcGauge;


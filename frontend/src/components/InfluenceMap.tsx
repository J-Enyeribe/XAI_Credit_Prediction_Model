import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { cleanFeatureName } from '../utils/featureMapper';

interface InfluenceMapProps {
  explanation: Record<string, number>;
}

const Satellite = ({ feature, value, index, total }: { feature: string, value: number, index: number, total: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Group>(null);
  
  const radius = 5 + Math.abs(value) * 8; 
  const speed = 0.1 + (1 / (index + 1)) * 0.1;
  const angleOffset = (index / total) * Math.PI * 2;

  const color = value > 0 ? '#FB923C' : '#FDE8DC'; 
  const size = Math.abs(value) * 0.6 + 0.15;

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    const x = Math.cos(t + angleOffset) * radius;
    const z = Math.sin(t + angleOffset) * radius;
    
    if (meshRef.current) {
      meshRef.current.position.set(x, 0, z);
    }
    if (textRef.current) {
      textRef.current.position.set(x, 0.7, z);
      textRef.current.lookAt(state.camera.position);
    }
  });

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute 
            attach="attributes-position" 
            count={2}
            array={new Float32Array([0, 0, 0, 0, 0, 0])} 
            itemSize={3} 
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.2} />
      </line>

      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={5} 
          toneMapped={false}
        />
      </mesh>

      <group ref={textRef}>
        <Text
          fontSize={0.25}
          color="#FDE8DC"
          anchorX="center"
          anchorY="middle"
        >
          {cleanFeatureName(feature)}
        </Text>
      </group>
    </group>
  );
};

const InfluenceMap: React.FC<InfluenceMapProps> = ({ explanation }) => {
  const topFeatures = useMemo(() => {
    return Object.entries(explanation)
      .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
      .slice(0, 10);
  }, [explanation]);

  return (
    <group>
      {topFeatures.map(([feature, value], index) => (
        <Satellite 
          key={feature} 
          feature={feature} 
          value={value} 
          index={index} 
          total={topFeatures.length} 
        />
      ))}
    </group>
  );
};

export default InfluenceMap;



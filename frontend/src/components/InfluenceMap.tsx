import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { cleanFeatureName } from '../utils/featureMapper';

interface InfluenceMapProps {
  explanation: Record<string, number>;
  onFeatureClick?: (feature: string, value: number) => void;
}

const Satellite = ({ feature, value, index, total, onFeatureClick }: { feature: string, value: number, index: number, total: number, onFeatureClick?: (feature: string, value: number) => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Group>(null);
  const color = value > 0 ? '#FB923C' : '#A5B4FC'; 
  const size = Math.abs(value) * 0.6 + 0.15;
  const fontSize = 0.2 + Math.abs(value) * 0.2;

  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    const material = new THREE.LineBasicMaterial({ 
      color, 
      transparent: true, 
      opacity: 0.15 
    });
    return new THREE.Line(geometry, material);
  }, [color]);
  
  const radius = Math.min(20, 6 + (index * 1.2) + Math.abs(value) * 2); 
  const speed = 0.1 + (1 / (index + 1)) * 0.1;
  const angleOffset = (index / total) * Math.PI * 2;
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    const x = Math.cos(t + angleOffset) * radius;
    const z = Math.sin(t + angleOffset) * radius;
    
    if (meshRef.current) {
      meshRef.current.position.set(x, 0, z);
    }
    if (textRef.current) {
       textRef.current.position.set(x, size + 0.4, z);
      textRef.current.lookAt(state.camera.position);
    }
    if (line) {
      const pos = line.geometry.attributes.position.array as Float32Array;
      // eslint-disable-next-line react-hooks/immutability
      pos[3] = x;
      // eslint-disable-next-line react-hooks/immutability
      pos[4] = 0;
      // eslint-disable-next-line react-hooks/immutability
      pos[5] = z;
      line.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <group>
      <primitive object={line} />

  
       <mesh 
         ref={meshRef} 
         onClick={(e) => {
           e.stopPropagation();
           onFeatureClick?.(feature, value);
         }}
       >
         <sphereGeometry args={[size, 32, 32]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={8} 
            toneMapped={false}
          />

       </mesh>
   
        <group ref={textRef}>
          <Text
            fontSize={fontSize}
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

const InfluenceMap: React.FC<InfluenceMapProps> = ({ explanation, onFeatureClick }) => {
  const topFeatures = useMemo(() => {
    if (!explanation) return [];
    return Object.entries(explanation)
      .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
      .slice(0, 10);
  }, [explanation]);
  
  if (!explanation) return null;

  return (
    <group>
      {topFeatures.map(([feature, value], index) => (
        <Satellite 
          key={feature} 
          feature={feature} 
          value={value} 
          index={index} 
          total={topFeatures.length} 
          onFeatureClick={onFeatureClick}
        />
      ))}
    </group>
  );
};

export default InfluenceMap;



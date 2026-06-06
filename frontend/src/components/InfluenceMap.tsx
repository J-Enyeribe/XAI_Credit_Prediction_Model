import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { cleanFeatureName } from '../utils/featureMapper';

interface InfluenceMapProps {
  explanation: Record<string, number> | any;
  onFeatureClick?: (feature: string, value: number) => void;
}

const Satellite = ({ feature, value, index, total, onFeatureClick }: { feature: string, value: number, index: number, total: number, onFeatureClick?: (feature: string, value: number) => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Group>(null);
  const color = value > 0 ? '#ff0000' : '#00b8d4'; 
  const size = Math.abs(value) * 0.8 + 0.4;
  const fontSize = 0.5 + Math.abs(value) * 0.35;

  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    const material = new THREE.LineBasicMaterial({ 
      color, 
      transparent: true, 
      opacity: 0.3 
    });
    return new THREE.Line(geometry, material);
  }, [color]);
  
  const radius = Math.min(16, 5 + (index * 1.2) + Math.abs(value) * 1.5); 
  const speed = 0.06;
  const angleOffset = (index / total) * Math.PI * 2;
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    const x = Math.cos(t + angleOffset) * radius;
    const z = Math.sin(t + angleOffset) * radius;
    
    if (meshRef.current) {
      meshRef.current.position.set(x, 0, z);
    }
    if (textRef.current) {
       textRef.current.position.set(x, size + 0.8, z);
       textRef.current.lookAt(state.camera.position);
    }
    if (line) {
      const pos = line.geometry.attributes.position.array as Float32Array;
      pos[3] = x;
      pos[4] = 0;
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
        <meshPhongMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={3} 
          shininess={80}
          specular={color}
          toneMapped={false}
        />
      </mesh>
      <group ref={textRef}>
        <Text
          fontSize={fontSize}
          color="#1c1c1c"
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
    // Handle both Record<string, number> and the new SHAPFeature[] format
    if (Array.isArray(explanation.top_features)) {
      return explanation.top_features.map((f: any) => [f.feature, f.shap_value]);
    }
    return Object.entries(explanation)
      .sort(([, a], [, b]) => Math.abs(b as number) - Math.abs(a as number))
      .slice(0, 10);
  }, [explanation]);
  
  if (!explanation) return null;

  return (
    <group>
      {topFeatures.map(([feature, value]: [string, number], index: number) => (
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

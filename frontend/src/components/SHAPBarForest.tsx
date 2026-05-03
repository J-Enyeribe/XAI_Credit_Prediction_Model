import React, { useState } from 'react';
import { Text, ContactShadows } from '@react-three/drei';

interface SHAPBarForestProps {
  data: [string, number][]; // Array of [FeatureName, Importance]
}

const Bar = ({ position, height, label, value }: { position: [number, number, number], height: number, label: string, value: number }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <mesh 
        position={[0, height / 2, 0]} 
        onPointerOver={() => setHovered(true)} 
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.4, height, 0.4]} />
        <meshStandardMaterial color={hovered ? '#6366f1' : '#475569'} />
      </mesh>
      {hovered && (
        <Text
          position={[0, height + 0.5, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {`${label}: ${value.toFixed(4)}`}
        </Text>
      )}
    </group>
  );
};

const SHAPBarForest: React.FC<SHAPBarForestProps> = ({ data }) => {
  const spacing = 1.2;
  const bars = data.map(([label, value], index) => ({
    label,
    value: Math.abs(value),
    position: [index * spacing - (data.length * spacing) / 2, 0, 0] as [number, number, number]
  }));

  return (
    <group>
      {bars.map((bar, i) => (
        <Bar 
          key={i} 
          position={bar.position} 
          height={bar.value * 10} // Scale for visibility
          label={bar.label} 
          value={bar.value} 
        />
      ))}
      <ContactShadows opacity={0.4} scale={10} blur={2} far={10} resolution={256} color="#000000" />
    </group>
  );
};

export default SHAPBarForest;

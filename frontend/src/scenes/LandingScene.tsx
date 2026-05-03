import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Stars } from '@react-three/drei';
import * as THREE from 'three';

const HelixStrand = ({ offset = 0, color = '#E25D30' }: { offset?: number; color?: string }) => {
  const points = 40;
  const height = 10;
  const radius = 1.5;

  return (
    <group>
      {Array.from({ length: points }).map((_, i) => {
        const t = (i / points) * height - height / 2;
        const angle = (i / points) * Math.PI * 2 + offset;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
          <Sphere key={i} args={[0.1, 16, 16]} position={[x, t, z]}>
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
          </Sphere>
        );
      })}
    </group>
  );
};

const LandingScene: React.FC = () => {
  const helixRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (helixRef.current) {
      helixRef.current.rotation.y += 0.005;
    }
  });

  return (
    <>
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
      
      <group ref={helixRef}>
        <HelixStrand offset={0} color="#E25D30" />
        <HelixStrand offset={Math.PI} color="#B38A7C" />
      </group>

      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#FDE8DC" />
      <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#E25D30" />
    </>
  );
};

export default LandingScene;

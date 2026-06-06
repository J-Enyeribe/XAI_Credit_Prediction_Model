import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Float, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const IntroScene: React.FC = () => {
  const orbRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (orbRef.current) {
      const time = state.clock.getElapsedTime();
      // Pulsing effect: scale between 0.9 and 1.1
      const scale = 1 + Math.sin(time * 2) * 0.1;
      orbRef.current.scale.set(scale, scale, scale);
      
      // Subtle floating motion
      orbRef.current.position.y = Math.sin(time * 0.5) * 0.2;
    }
  });

  return (
    <>
      {/* Star field: subtle and warm */}
      <Stars 
        radius={100} 
        depth={50} 
        count={5000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={1} 
      />

      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere ref={orbRef} args={[1, 64, 64]} position={[4, -3, -5]}>
          <meshStandardMaterial 
            color="#009fb7" 
            emissive="#009fb7" 
            emissiveIntensity={2} 
            roughness={0.1} 
            metalness={0.8} 
          />
        </Sphere>
      </Float>

      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#009fb7" />
    </>
  );
};

export default IntroScene;

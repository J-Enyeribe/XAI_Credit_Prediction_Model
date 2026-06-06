import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';

interface HelixStrandProps {
  offset?: number;
  getColor: (t: number) => THREE.Color;
}

const HelixStrand: React.FC<HelixStrandProps> = ({ offset = 0, getColor }) => {
  const points = 60;
  const height = 18;
  const radius = 3;

  const sphereData = useMemo(() => {
    return Array.from({ length: points }).map((_, i) => {
      const t = (i / points) * height - height / 2;
      const angle = (i / points) * Math.PI * 4 + offset;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const color = getColor(i / points);
      return { x, y: t, z, color };
    });
  }, [offset, getColor]);

  // Cache line geometry for the strand backbone
  const linePoints = useMemo(() => {
    return sphereData.map(p => new THREE.Vector3(p.x, p.y, p.z));
  }, [sphereData]);

  return (
    <group>
      {/* Backbone line */}
      <Line points={linePoints} color="#009fb7" lineWidth={1} opacity={0.15} transparent />
      
      {/* Spheres */}
      {sphereData.map((p, i) => (
        <Sphere key={i} args={[0.18, 16, 16]} position={[p.x, p.y, p.z]}>
          <meshStandardMaterial 
            color={p.color} 
            emissive={p.color} 
            emissiveIntensity={0.4} 
            roughness={0.2}
            metalness={0.3}
          />
        </Sphere>
      ))}
    </group>
  );
};

const LandingScene: React.FC = () => {
  const helixRef = useRef<THREE.Group>(null);

  // Risk spectrum gradient: pacific_blue → mustard → tomato
  const getGradientColor = useMemo(() => {
    const blue = new THREE.Color('#009fb7');
    const yellow = new THREE.Color('#fec620');
    const red = new THREE.Color('#ff0000');

    return (progress: number): THREE.Color => {
      // progress 0–1 along the height
      if (progress < 0.5) {
        const t = progress / 0.5;
        return blue.clone().lerp(yellow, t);
      } else {
        const t = (progress - 0.5) / 0.5;
        return yellow.clone().lerp(red, t);
      }
    };
  }, []);

  useFrame(() => {
    if (helixRef.current) {
      helixRef.current.rotation.y += 0.008;
    }
  });

  return (
    <>
      <Stars radius={120} depth={60} count={3000} factor={5} saturation={0} fade speed={1.5} />
      
      <group ref={helixRef} position={[5, 0, 0]}>
        <HelixStrand offset={0} getColor={getGradientColor} />
        <HelixStrand offset={Math.PI} getColor={(t) => getGradientColor(1 - t)} />
      </group>

      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
      <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#009fb7" />
    </>
  );
};

export default LandingScene;


import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SNOW_COUNT = 2500;

export const SnowParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities, phases } = useMemo(() => {
    const pos = new Float32Array(SNOW_COUNT * 3);
    const vel = new Float32Array(SNOW_COUNT);
    const pha = new Float32Array(SNOW_COUNT);

    for (let i = 0; i < SNOW_COUNT; i++) {
      // Wide area around the tree
      pos[i * 3 + 0] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;

      vel[i] = 0.05 + Math.random() * 0.1; // Falling speed
      pha[i] = Math.random() * Math.PI * 2; // Horizontal drift phase
    }
    return { positions: pos, velocities: vel, phases: pha };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.elapsedTime;
    const attr = pointsRef.current.geometry.attributes.position;

    for (let i = 0; i < SNOW_COUNT; i++) {
      let y = attr.getY(i);
      let x = attr.getX(i);
      let z = attr.getZ(i);

      // Vertical movement
      y -= velocities[i];
      
      // Reset if below ground
      if (y < -1) {
        y = 25;
        // Randomize horizontal pos slightly on reset for variety
        x = (Math.random() - 0.5) * 40;
        z = (Math.random() - 0.5) * 40;
      }

      // Add horizontal drift based on time and phase
      const driftX = Math.sin(time * 0.5 + phases[i]) * 0.01;
      const driftZ = Math.cos(time * 0.3 + phases[i]) * 0.01;

      attr.setXYZ(i, x + driftX, y, z + driftZ);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={SNOW_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#ffffff"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  );
};


import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FOREST_RADIUS = 500;
const TREE_COUNT = 1200; 
const PARTICLES_PER_TREE = 40;
const TOTAL_PARTICLES = TREE_COUNT * PARTICLES_PER_TREE;

export const BackgroundForest: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors, sizes, offsets } = useMemo(() => {
    const pos = new Float32Array(TOTAL_PARTICLES * 3);
    const col = new Float32Array(TOTAL_PARTICLES * 3);
    const siz = new Float32Array(TOTAL_PARTICLES);
    const off = new Float32Array(TOTAL_PARTICLES * 3);

    for (let i = 0; i < TREE_COUNT; i++) {
      const r = 40 + Math.sqrt(Math.random()) * (FOREST_RADIUS - 40);
      const theta = Math.random() * Math.PI * 2;
      const treeX = r * Math.cos(theta);
      const treeZ = r * Math.sin(theta);
      const treeScale = 1.0 + Math.random() * 4.0;

      for (let j = 0; j < PARTICLES_PER_TREE; j++) {
        const idx = (i * PARTICLES_PER_TREE + j);
        const h = Math.random(); 
        const radiusAtH = (1.0 - h) * 0.8; 
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * radiusAtH;

        const localX = dist * Math.cos(angle) * treeScale;
        const localY = h * 4.0 * treeScale - 0.6;
        const localZ = dist * Math.sin(angle) * treeScale;

        pos[idx * 3 + 0] = treeX + localX;
        pos[idx * 3 + 1] = localY;
        pos[idx * 3 + 2] = treeZ + localZ;

        const isSnow = h > 0.4 && Math.random() > 0.3;
        if (isSnow) {
          col[idx * 3 + 0] = 0.9; col[idx * 3 + 1] = 0.95; col[idx * 3 + 2] = 1.0;
          siz[idx] = 0.05 + Math.random() * 0.1;
        } else {
          col[idx * 3 + 0] = 0.01; col[idx * 3 + 1] = 0.1; col[idx * 3 + 2] = 0.05;
          siz[idx] = 0.03 + Math.random() * 0.06;
        }

        off[idx * 3 + 0] = Math.random() * Math.PI * 2; 
        off[idx * 3 + 1] = 0.1 + Math.random() * 0.5; 
        off[idx * 3 + 2] = Math.random(); 
      }
    }

    return { positions: pos, colors: col, sizes: siz, offsets: off };
  }, []);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        attribute vec3 color;
        attribute float size;
        attribute vec3 offset;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          float blink = 0.7 + 0.3 * sin(uTime * offset.y + offset.x);
          vAlpha = blink;

          vec3 pos = position;
          pos.x += sin(uTime * 0.2 + position.y) * 0.02;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * blink;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          gl_FragColor = vec4(vColor, vAlpha * (1.0 - d * 2.0));
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state) => {
    if (shaderMaterial.uniforms) {
      shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
        <planeGeometry args={[FOREST_RADIUS * 2.5, FOREST_RADIUS * 2.5]} />
        <meshStandardMaterial color="#010204" roughness={1} metalness={0} />
      </mesh>

      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={TOTAL_PARTICLES} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={TOTAL_PARTICLES} array={colors} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={TOTAL_PARTICLES} array={sizes} itemSize={1} />
          <bufferAttribute attach="attributes-offset" count={TOTAL_PARTICLES} array={offsets} itemSize={3} />
        </bufferGeometry>
        <primitive object={shaderMaterial} />
      </points>
    </group>
  );
};

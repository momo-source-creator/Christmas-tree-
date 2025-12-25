
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Aurora: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  const auroraMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color('#00ff88') }, // Emerald Green
        uColor2: { value: new THREE.Color('#004422') }, // Deep Forest Green
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;

        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float smoothNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = noise(i);
          float b = noise(i + vec2(1.0, 0.0));
          float c = noise(i + vec2(0.0, 1.0));
          float d = noise(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        void main() {
          float t = uTime * 0.15;
          
          float n1 = smoothNoise(vec2(vUv.x * 2.5 + t * 0.5, vUv.y * 1.2 - t * 0.2));
          float n2 = smoothNoise(vec2(vUv.x * 4.0 - t * 0.3, vUv.y * 1.8 + t * 0.1));
          float n3 = smoothNoise(vec2(vUv.x * 1.5 + t * 0.8, vUv.y * 0.5));
          
          // Vertical mask softened at the bottom (low vUv.y) to blend into ground fog
          float mask = pow(vUv.y, 2.2) * pow(1.0 - vUv.y, 1.0) * 8.0;
          
          float pattern = pow(n1 * n2, 1.5) * 2.0 + (n3 * 0.3);
          
          float breathing = 0.5 + 0.5 * sin(uTime * 0.4);
          
          vec3 finalColor = mix(uColor2, uColor1, n1 * n2) * pattern * mask * breathing;
          
          float glow = smoothstep(0.0, 1.0, mask) * 0.05 * breathing;
          
          gl_FragColor = vec4(finalColor + (uColor1 * glow), (pattern * mask * 0.35 + glow) * breathing);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state) => {
    if (auroraMaterial.uniforms) {
      auroraMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 15, -70]} rotation={[0.3, 0, 0]}>
      <sphereGeometry args={[140, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
      <primitive object={auroraMaterial} />
    </mesh>
  );
};


import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { ChristmasTree } from './ChristmasTree';
import { SnowParticles } from './SnowParticles';
import { FloatingCards } from './FloatingCards';
import { Aurora } from './Aurora';
import { BackgroundForest } from './BackgroundForest';
import { HandData } from '../types';

interface SceneProps {
  handData: HandData;
  customBlessingRequest?: { text: string, timestamp: number } | null;
}

const Galaxy: React.FC = () => {
  const galaxyMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.7, 31.1))) * 43758.5);
        }

        void main() {
          vec2 uv = vUv * 2.0 - 1.0;
          float dist = 1.0 - length(uv * vec2(0.5, 2.0)); 
          dist = smoothstep(0.1, 0.9, dist);
          
          float horizonFade = smoothstep(0.35, 0.6, vUv.y); 
          
          float n = noise(vUv * 12.0 + uTime * 0.005);
          vec3 color = mix(vec3(0.01, 0.03, 0.1), vec3(0.08, 0.15, 0.35), n);
          
          gl_FragColor = vec4(color, dist * 0.2 * horizonFade);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
  }, []);

  useFrame((state) => {
    galaxyMaterial.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh rotation={[0.4, 1.1, 0.2]} position={[0, 0, -80]}>
      <sphereGeometry args={[135, 32, 32]} />
      <primitive object={galaxyMaterial} />
    </mesh>
  );
};

const HorizonGlow: React.FC = () => {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color('#020814') }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float alpha = smoothstep(0.0, 0.5, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
        gl_FragColor = vec4(uColor, alpha * 0.9);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
  }), []);

  return (
    <mesh position={[0, -2, 0]} rotation={[0, 0, 0]}>
      <cylinderGeometry args={[145, 145, 40, 32, 1, true]} />
      <primitive object={mat} />
    </mesh>
  );
};

export const Scene: React.FC<SceneProps> = ({ handData, customBlessingRequest }) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(0);
  const targetZoom = useRef(22); 

  useFrame((state, delta) => {
    if (handData.detected) {
      targetRotation.current = (handData.x - 0.5) * Math.PI * 2.5;
      targetZoom.current = THREE.MathUtils.lerp(targetZoom.current, 16 + handData.z * 24, 0.1);
    } else {
      targetRotation.current += delta * 0.15;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.current, 0.05);
    }

    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZoom.current, 0.05);
    const lookTarget = new THREE.Vector3(0, 3.0, 0);
    camera.lookAt(lookTarget);
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 22]} fov={40} />
      
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 15, 10]} intensity={1.5} color="#d0e0ff" />
      <spotLight 
        position={[0, 25, 0]} 
        angle={0.4} 
        penumbra={1} 
        intensity={2.5} 
        color="#ffffff" 
        castShadow
      />

      <Stars radius={150} depth={60} count={8000} factor={6} saturation={0.5} fade speed={1.2} />
      <Galaxy />
      <Aurora />
      <HorizonGlow />
      
      <Environment preset="night" />
      <fog attach="fog" args={['#01040a', 10, 100]} />

      <BackgroundForest />
      <SnowParticles />
      <FloatingCards handData={handData} customBlessingRequest={customBlessingRequest} />

      <group ref={groupRef} scale={[0.6, 0.6, 0.6]}>
        <ChristmasTree handData={handData} />
        
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
          <circleGeometry args={[35, 64]} />
          <meshStandardMaterial 
            color="#050a0f" 
            roughness={1} 
            metalness={0.1} 
            emissive="#000d1a"
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>
    </>
  );
};

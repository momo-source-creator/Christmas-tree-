
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HandData, Blessing } from '../types';

const PARTICLE_COUNT = 80000;
const ORNAMENT_TYPES_COUNT = 3; 
const TOTAL_ORNAMENT_COUNT = 120;
const PER_TYPE_COUNT = TOTAL_ORNAMENT_COUNT / ORNAMENT_TYPES_COUNT;
const CARD_COUNT = 40;

const BLESSINGS_DATA: Blessing[] = [
  { text: "有光", weight: 15 },
  { text: "听雪", weight: 15 },
  { text: "归心", weight: 10 },
  { text: "如常", weight: 15 },
  { text: "见喜", weight: 15 },
  { text: "冬藏", weight: 10 },
  { text: "不息", weight: 10 },
  { text: "Glow", weight: 15 },
  { text: "Still", weight: 15 },
  { text: "Bloom", weight: 15 },
  { text: "Pure", weight: 10 },
  { text: "Hush", weight: 10 },
  { text: "Aura", weight: 10 },
  { text: "Within", weight: 10 },
];

interface ChristmasTreeProps {
  handData: HandData;
}

export const ChristmasTree: React.FC<ChristmasTreeProps> = ({ handData }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const lightPointRef = useRef<THREE.Mesh>(null);
  
  const ballsRef = useRef<THREE.InstancedMesh>(null);
  const cloudsRef = useRef<THREE.InstancedMesh>(null);
  const canesRef = useRef<THREE.InstancedMesh>(null);
  
  const meshRefs = [ballsRef, cloudsRef, canesRef];

  const morphProgress = useRef(1.0);
  const explosionFactor = useRef(0.0);
  const targetExplosion = useRef(0.0);
  const targetMorph = useRef(1.0);

  const silverBase = useMemo(() => new THREE.Color('#f0f0f0'), []); 

  const { positions, targets, scales, colors, offsets } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const tar = new Float32Array(PARTICLE_COUNT * 3);
    const sca = new Float32Array(PARTICLE_COUNT);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const off = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r_chaos = 5 + Math.random() * 15;
      const theta_chaos = Math.random() * Math.PI * 2;
      const phi_chaos = Math.random() * Math.PI;
      pos[i * 3 + 0] = r_chaos * Math.sin(phi_chaos) * Math.cos(theta_chaos);
      pos[i * 3 + 1] = r_chaos * Math.sin(phi_chaos) * Math.sin(theta_chaos) + 5;
      pos[i * 3 + 2] = r_chaos * Math.cos(phi_chaos);

      const height = Math.random() * 10;
      const baseRadius = 4 * (1 - height / 11);
      const angle = Math.random() * Math.PI * 2;
      const r_target = Math.pow(Math.random(), 0.5) * baseRadius;
      
      tar[i * 3 + 0] = r_target * Math.cos(angle);
      tar[i * 3 + 1] = height;
      tar[i * 3 + 2] = r_target * Math.sin(angle);

      off[i * 3 + 0] = (Math.random() - 0.5) * 2.0;
      off[i * 3 + 1] = (Math.random() - 0.5) * 2.0;
      off[i * 3 + 2] = (Math.random() - 0.5) * 2.0;

      const isSnow = Math.random() > 0.75;
      if (isSnow) {
        col[i * 3 + 0] = 1.0; col[i * 3 + 1] = 1.0; col[i * 3 + 2] = 1.0;
        sca[i] = Math.random() * 0.14 + 0.04;
      } else {
        col[i * 3 + 0] = 0.01; col[i * 3 + 1] = 0.18; col[i * 3 + 2] = 0.12;
        sca[i] = Math.random() * 0.08 + 0.02;
      }
    }
    return { positions: pos, targets: tar, scales: sca, colors: col, offsets: off };
  }, []);

  const cardMaterials = useMemo(() => {
    return BLESSINGS_DATA.map(blessing => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 768;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fdf5e6';
      ctx.fillRect(0, 0, 512, 768);
      ctx.lineWidth = 15;
      ctx.strokeStyle = '#1b4d3e';
      ctx.strokeRect(30, 30, 452, 708);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#8b0000';
      ctx.strokeRect(45, 45, 422, 678);

      const drawLeaf = (x: number, y: number, rotation: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.fillStyle = '#228b22';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(5, 5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawLeaf(50, 50, -Math.PI/4);
      drawLeaf(462, 50, Math.PI/4);
      drawLeaf(50, 718, -Math.PI*0.75);
      drawLeaf(462, 718, Math.PI*0.75);

      ctx.fillStyle = '#2c1e1a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const isChinese = /[\u4e00-\u9fa5]/.test(blessing.text);
      ctx.font = isChinese ? 'bold 120px serif' : 'italic bold 80px "Times New Roman", serif';
      ctx.fillText(blessing.text, 256, 384);

      const texture = new THREE.CanvasTexture(canvas);
      return new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.1,
      });
    });
  }, []);

  const cards = useMemo(() => {
    const list: { pos: THREE.Vector3; rot: THREE.Euler; mat: THREE.MeshStandardMaterial }[] = [];
    const totalWeight = BLESSINGS_DATA.reduce((sum, b) => sum + b.weight, 0);
    for (let i = 0; i < CARD_COUNT; i++) {
      const height = 0.8 + Math.random() * 8.5;
      const baseRadius = 4 * (1 - height / 11);
      const angle = Math.random() * Math.PI * 2;
      const pos = new THREE.Vector3(baseRadius * Math.cos(angle), height, baseRadius * Math.sin(angle));
      const rot = new THREE.Euler(0, -angle + Math.PI, (Math.random() - 0.5) * 0.5);
      let random = Math.random() * totalWeight;
      let selectedIdx = 0;
      for (let j = 0; j < BLESSINGS_DATA.length; j++) {
        random -= BLESSINGS_DATA[j].weight;
        if (random <= 0) { selectedIdx = j; break; }
      }
      list.push({ pos, rot, mat: cardMaterials[selectedIdx] });
    }
    return list;
  }, [cardMaterials]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    for (let typeIdx = 0; typeIdx < ORNAMENT_TYPES_COUNT; typeIdx++) {
      const mesh = meshRefs[typeIdx].current;
      if (!mesh) continue;
      for (let i = 0; i < PER_TYPE_COUNT; i++) {
        const height = 0.5 + Math.random() * 9.0;
        const baseRadius = 4 * (1 - height / 11);
        const angle = Math.random() * Math.PI * 2;
        dummy.position.set(baseRadius * Math.cos(angle), height, baseRadius * Math.sin(angle));
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        let s = 0.015 + Math.random() * 0.02;
        if (typeIdx === 2) s = 0.05 + Math.random() * 0.05;
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, silverBase);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }, [silverBase]);

  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMorphProgress: { value: 1.0 },
        uExplosionFactor: { value: 0.0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uMorphProgress;
        uniform float uExplosionFactor;
        attribute vec3 target;
        attribute float scale;
        attribute vec3 color;
        attribute vec3 offset;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec3 currentPos = mix(position, target, uMorphProgress);
          vec3 dir = normalize(currentPos - vec3(0.0, 5.0, 0.0));
          currentPos += dir * uExplosionFactor * (1.5 + offset.x);
          currentPos.x += sin(uTime * 0.5 + currentPos.y) * 0.03 * uMorphProgress;
          currentPos.z += cos(uTime * 0.4 + currentPos.y) * 0.03 * uMorphProgress;
          vColor = color;
          vAlpha = mix(0.4, 1.0, uMorphProgress);
          vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
          gl_PointSize = scale * (400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          float strength = 1.0 - (dist * 2.0);
          gl_FragColor = vec4(vColor, strength * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame(({ clock }) => {
    if (particleMaterial.uniforms) {
      particleMaterial.uniforms.uTime.value = clock.elapsedTime;
      if (handData.detected) {
        if (handData.isOpen) {
          targetExplosion.current = 4.0;
          targetMorph.current = 0.0;
        } else if (handData.isFist) {
          // Fist gathers particles faster
          targetExplosion.current = 0.0;
          targetMorph.current = 1.0;
          morphProgress.current = THREE.MathUtils.lerp(morphProgress.current, 1.0, 0.15);
        } else if (!handData.isOpen && !handData.isPointing) {
          targetExplosion.current = 0.0;
          targetMorph.current = 1.0;
        }
      } else {
        targetExplosion.current = 0.0;
        targetMorph.current = 1.0;
      }
      explosionFactor.current = THREE.MathUtils.lerp(explosionFactor.current, targetExplosion.current, 0.04);
      morphProgress.current = THREE.MathUtils.lerp(morphProgress.current, targetMorph.current, 0.06);
      particleMaterial.uniforms.uExplosionFactor.value = explosionFactor.current;
      particleMaterial.uniforms.uMorphProgress.value = morphProgress.current;
    }

    if (lightPointRef.current && handData.detected && handData.isPointing && handData.indexTip) {
      const x = (handData.indexTip.x - 0.5) * 15;
      const y = (0.5 - handData.indexTip.y) * 15 + 5;
      const z = (handData.indexTip.z) * 5;
      lightPointRef.current.position.lerp(new THREE.Vector3(x, y, z), 0.1);
      lightPointRef.current.visible = true;
    } else if (lightPointRef.current) {
      lightPointRef.current.position.lerp(new THREE.Vector3(0, 10.3, 0), 0.05);
    }
  });

  return (
    <group>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-target" count={PARTICLE_COUNT} array={targets} itemSize={3} />
          <bufferAttribute attach="attributes-scale" count={PARTICLE_COUNT} array={scales} itemSize={1} />
          <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={colors} itemSize={3} />
          <bufferAttribute attach="attributes-offset" count={PARTICLE_COUNT} array={offsets} itemSize={3} />
        </bufferGeometry>
        <primitive object={particleMaterial} />
      </points>

      <instancedMesh ref={ballsRef} args={[undefined, undefined, PER_TYPE_COUNT]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial roughness={0.0} metalness={1.0} color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={cloudsRef} args={[undefined, undefined, PER_TYPE_COUNT]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial roughness={0.0} metalness={1.0} color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={canesRef} args={[undefined, undefined, PER_TYPE_COUNT]}>
        <torusGeometry args={[1, 0.2, 8, 20, Math.PI]} />
        <meshStandardMaterial roughness={0.0} metalness={1.0} color="#ffffff" />
      </instancedMesh>

      <group scale={morphProgress.current}>
        {cards.map((card, i) => (
          <group key={i} position={card.pos} rotation={card.rot}>
            <mesh>
              <boxGeometry args={[0.3, 0.45, 0.01]} />
              <primitive object={card.mat} attach="material-4" />
              <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} attach="material-5" />
              <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} attach="material-0" />
              <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} attach="material-1" />
              <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} attach="material-2" />
              <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} attach="material-3" />
            </mesh>
          </group>
        ))}
      </group>

      <mesh ref={lightPointRef}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={50} />
        <pointLight intensity={15} distance={20} color="#ffffff" />
      </mesh>
      
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.4, 0.6, 1.2, 8]} />
        <meshStandardMaterial color="#1a0f00" roughness={1} />
      </mesh>
    </group>
  );
};

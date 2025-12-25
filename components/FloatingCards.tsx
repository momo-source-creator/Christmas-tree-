
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { HandData, Blessing } from '../types';

const BLESSINGS_DATA: Blessing[] = [
  { text: "有光", description: "不必急着寻找太阳。哪怕周遭再暗，只要你还在前行，你留下的每一个脚印里，其实都揉进了微光。", weight: 15 },
  { text: "听雪", description: "世界太吵的时候，就慢下来听听雪落下的声音吧。最珍贵的答案，往往藏在那些最寂静的瞬间里。", weight: 15 },
  { text: "归心", description: "走了很远的路，看了很多的景，别忘了回头看看出发时的那个自己。心安放的地方，才是你真正的家。", weight: 10 },
  { text: "如常", description: "万事如意固然美好，但生活如常才是岁月的馈赠。愿你在这份平凡的安稳中，品出最浓郁的幸福。", weight: 15 },
  { text: "见喜", description: "喜悦不是等来的，而是被发现的。愿你拥有穿透迷雾的眼睛，在寻常的一草一木间，撞见满怀惊喜。", weight: 15 },
  { text: "冬藏", description: "现在的沉寂不是停滞，而是在泥土下悄悄扎根。请耐心地守护你的灵性，待到春暖，再惊艳盛开。", weight: 10 },
  { text: "不息", description: "就像这寒冬无法封锁地底的暖流，你内心的力量也从未停止流转。只要还在跳动，生命便永远生机勃勃。", weight: 10 },
  { text: "Glow", description: "You don’t need to blind the world. Just keep that gentle glow inside you; it’s enough to light up your own path.", weight: 15 },
  { text: "Still", description: "In the middle of the storm, find your center. Being still isn't about doing nothing; it's about being everything.", weight: 15 },
  { text: "Bloom", description: "Who says flowers only belong to spring? In the coldest heart of winter, you have the power to bloom.", weight: 15 },
  { text: "Pure", description: "Let go of the dust, keep the essence. Your heart, in its simplest form, is the most beautiful thing I’ve ever seen.", weight: 10 },
  { text: "Hush", description: "Shhh... Can you hear that? The universe is whispering a secret just for you. Listen closely with your soul.", weight: 10 },
  { text: "Aura", description: "There is a unique magic surrounding you that no one else possesses. Trust your energy; it’s your guiding star.", weight: 10 },
  { text: "Within", description: "Stop searching across the mountains and seas. Everything you’ve ever wanted—the strength, the love, the light—is already within.", weight: 10 },
];

interface CardInstance {
  id: number;
  text: string;
  material: THREE.MeshStandardMaterial;
  startPos: THREE.Vector3;
  targetTreePos: THREE.Vector3;
  startTime: number;
  isCustom?: boolean;
}

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.includes(' ') ? text.split(' ') : text.split('');
  const lines = [];
  let currentLine = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = currentLine + words[n] + (text.includes(' ') ? ' ' : '');
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(currentLine);
      currentLine = words[n] + (text.includes(' ') ? ' ' : '');
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
};

const playPaperRustle = () => {
  try {
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    const audioCtx = new AudioContextClass();
    const bufferSize = audioCtx.sampleRate * 0.4;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500, audioCtx.currentTime);
    filter.Q.setValueAtTime(1.5, audioCtx.currentTime);
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    noise.start();
  } catch (e) {}
};

const createCardMaterial = (text: string, description?: string) => {
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

  const drawLeaf = (x: number, y: number, rot: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = '#228b22';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(5, 5, 8, 0, Math.PI * 2);
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
  const isChinese = /[\u4e00-\u9fa5]/.test(text);
  ctx.font = isChinese ? 'bold 120px serif' : 'italic bold 80px "Times New Roman", serif';
  
  if (text.length > 5) {
    ctx.font = isChinese ? 'bold 70px serif' : 'italic bold 50px serif';
    const lines = wrapText(ctx, text, 400);
    lines.forEach((line, i) => {
      ctx.fillText(line.trim(), 256, 320 + i * 80);
    });
  } else {
    ctx.fillText(text, 256, 340);
  }

  if (description) {
    ctx.font = isChinese ? '26px serif' : '22px "Times New Roman", serif';
    ctx.fillStyle = '#5c4b46';
    const descLines = wrapText(ctx, description, 360);
    const lineHeight = 35;
    const startY = 580 - (descLines.length * lineHeight / 2);
    descLines.forEach((line, i) => {
      ctx.fillText(line.trim(), 256, startY + (i * lineHeight));
    });
  }

  const tex = new THREE.CanvasTexture(canvas);
  return new THREE.MeshStandardMaterial({ 
    map: tex, 
    roughness: 0.7, 
    metalness: 0.1,
    emissive: new THREE.Color('#ffffff'),
    emissiveIntensity: 0
  });
};

const getRandomTreePos = () => {
  const height = 1.8 + Math.random() * 6.5; 
  const baseRadius = 4 * (1 - height / 11);
  const angle = Math.random() * Math.PI * 2;
  return new THREE.Vector3(
    baseRadius * 0.55 * Math.cos(angle),
    height * 0.6,
    baseRadius * 0.55 * Math.sin(angle)
  );
};

export const FloatingCards: React.FC<{ 
  handData: HandData, 
  customBlessingRequest?: { text: string, timestamp: number } | null 
}> = ({ handData, customBlessingRequest }) => {
  const [activeCards, setActiveCards] = useState<CardInstance[]>([]);
  const wasPinching = useRef(false);
  const sessionDrawn = useRef(false);
  const nextId = useRef(0);
  const lastCustomTimestamp = useRef(0);

  const prebakedMaterials = useMemo(() => {
    return BLESSINGS_DATA.map(b => createCardMaterial(b.text, b.description));
  }, []);

  useEffect(() => {
    if (customBlessingRequest && customBlessingRequest.timestamp > lastCustomTimestamp.current) {
      lastCustomTimestamp.current = customBlessingRequest.timestamp;
      const material = createCardMaterial(customBlessingRequest.text);
      const id = nextId.current++;
      
      const newCard: CardInstance = {
        id,
        text: customBlessingRequest.text,
        material: material,
        startPos: new THREE.Vector3(0, 1.5, 4), 
        targetTreePos: getRandomTreePos(),
        startTime: Date.now() / 1000,
        isCustom: true
      };
      
      setActiveCards(prev => [...prev, newCard]);
    }
  }, [customBlessingRequest]);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    
    if (handData.isPinching && handData.detected && handData.indexTip) {
      if (!wasPinching.current) {
        wasPinching.current = true;
        
        if (!sessionDrawn.current) {
          playPaperRustle();
          sessionDrawn.current = true;
          
          const totalWeight = BLESSINGS_DATA.reduce((s, b) => s + b.weight, 0);
          let r = Math.random() * totalWeight;
          let selectedIdx = 0;
          for (let j = 0; j < BLESSINGS_DATA.length; j++) {
            r -= BLESSINGS_DATA[j].weight;
            if (r <= 0) { selectedIdx = j; break; }
          }
          
          const worldX = (handData.indexTip.x - 0.5) * 15;
          const worldY = (0.5 - handData.indexTip.y) * 15 + 5;
          const worldZ = handData.indexTip.z * 5;
          
          const id = nextId.current++;
          const newCard: CardInstance = {
            id,
            text: BLESSINGS_DATA[selectedIdx].text,
            material: prebakedMaterials[selectedIdx].clone(),
            startPos: new THREE.Vector3(worldX, worldY, worldZ),
            targetTreePos: getRandomTreePos(), 
            startTime: now
          };
          setActiveCards(prev => [...prev, newCard]);
        }
      }
    } else {
      wasPinching.current = false;
    }

    if (activeCards.some(c => now - (c.isCustom ? (Date.now()/1000) : c.startTime) > 20)) {
       setActiveCards(prev => prev.filter(c => ((c.isCustom ? (Date.now()/1000) : clock.elapsedTime) - c.startTime) <= 20));
    }
  });

  return (
    <group>
      {activeCards.map(card => (
        <CardItem key={card.id} data={card} />
      ))}
    </group>
  );
};

const CardItem: React.FC<{ data: CardInstance }> = ({ data }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const hoverScale = useRef(1.0);
  const { size } = useThree();
  
  const isMobile = useMemo(() => size.width < 768, [size.width]);
  
  const backMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: "#d4af37", metalness: 0.9, roughness: 0.1, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0
  }), []);

  const rimMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: "#d4af37", metalness: 1, roughness: 0.2, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0
  }), []);
  
  useFrame(({ clock, camera }) => {
    if (!meshRef.current) return;
    const now = data.isCustom ? (Date.now() / 1000) : clock.elapsedTime;
    const elapsed = now - data.startTime;
    
    const flyInDuration = 2.2;
    const stayDuration = 5.0; 
    const flyOutDuration = 4.0;
    
    // Scale factor for mobile
    const mobileScaleFactor = isMobile ? 0.65 : 1.0;
    
    // Position the card slightly further back on mobile to ensure it's not cut off
    const distFromCamera = isMobile ? -5.5 : -4.5;
    const cameraFront = new THREE.Vector3(0, 0, distFromCamera).applyQuaternion(camera.quaternion).add(camera.position);
    
    let targetPos = new THREE.Vector3();
    let animT = 0;
    let scaleMultiplier = 1;

    if (elapsed < flyInDuration) {
      animT = THREE.MathUtils.clamp(elapsed / flyInDuration, 0, 1);
      const easeT = 1 - Math.pow(1 - animT, 4);
      targetPos.lerpVectors(data.startPos, cameraFront, easeT);
      scaleMultiplier = (0.05 + easeT * 1.55) * mobileScaleFactor;
      meshRef.current.quaternion.slerp(camera.quaternion, easeT);
      meshRef.current.rotation.y += (1 - easeT) * Math.PI;
    } else if (elapsed < flyInDuration + stayDuration) {
      targetPos.copy(cameraFront);
      scaleMultiplier = 1.6 * mobileScaleFactor;
      meshRef.current.quaternion.copy(camera.quaternion);
    } else {
      const outElapsed = elapsed - (flyInDuration + stayDuration);
      animT = THREE.MathUtils.clamp(outElapsed / flyOutDuration, 0, 1);
      const easeT = animT * animT * (3 - 2 * animT);
      
      targetPos.lerpVectors(cameraFront, data.targetTreePos, easeT);
      scaleMultiplier = (1.6 * mobileScaleFactor) * (1 - easeT * 0.88); 
      
      const lookAtTreeCenter = new THREE.Vector3(0, targetPos.y, 0);
      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(targetPos, lookAtTreeCenter, new THREE.Vector3(0, 1, 0))
      );
      meshRef.current.quaternion.slerp(targetQuat, easeT);
    }

    meshRef.current.position.copy(targetPos);
    
    const targetHoverScale = hovered ? 1.15 : 1.0;
    hoverScale.current = THREE.MathUtils.lerp(hoverScale.current, targetHoverScale, 0.15);
    meshRef.current.scale.setScalar(scaleMultiplier * hoverScale.current);
    
    const wobbleSpeed = 1.1;
    const wobbleIntensity = 0.025;
    meshRef.current.rotation.y += Math.sin(clock.elapsedTime * wobbleSpeed) * wobbleIntensity;
    meshRef.current.rotation.x += Math.cos(clock.elapsedTime * wobbleSpeed * 0.8) * (wobbleIntensity * 0.5);

    const glowT = THREE.MathUtils.clamp(elapsed, 0, 2.0);
    const glowIntensity = Math.max(0, (1 - glowT / 2.0) * 4.0);
    data.material.emissiveIntensity = glowIntensity;
    backMaterial.emissiveIntensity = glowIntensity * 0.5;
    rimMaterial.emissiveIntensity = glowIntensity;
  });

  return (
    <group 
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <Float speed={1.0} rotationIntensity={0.15} floatIntensity={0.1}>
        <mesh>
          <boxGeometry args={[1, 1.5, 0.02]} />
          <primitive object={data.material} attach="material-4" />
          <primitive object={backMaterial} attach="material-5" />
          <primitive object={backMaterial} attach="material-0" />
          <primitive object={backMaterial} attach="material-1" />
          <primitive object={backMaterial} attach="material-2" />
          <primitive object={backMaterial} attach="material-3" />
        </mesh>
        <mesh position={[0, 0, -0.011]}>
          <boxGeometry args={[1.05, 1.55, 0.01]} />
          <primitive object={rimMaterial} />
        </mesh>
      </Float>
    </group>
  );
};

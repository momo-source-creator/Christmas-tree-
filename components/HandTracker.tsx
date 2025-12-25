import React, { useRef, useEffect, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { HandData } from '../types';

interface HandTrackerProps {
  onUpdate: (data: HandData) => void;
}

export const HandTracker: React.FC<HandTrackerProps> = ({ onUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);

  useEffect(() => {
    let animationId: number;

    const initTracking = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        landmarkerRef.current = landmarker;

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 }
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadeddata = () => {
              videoRef.current?.play();
              detect();
            };
          }
        }
      } catch (e) {
        console.error("Camera/Tracker error:", e);
        setError("Tracker failed.");
      }
    };

    const detect = () => {
      if (videoRef.current && landmarkerRef.current) {
        const startTimeMs = performance.now();
        const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          
          const wrist = landmarks[0];
          const middleMCP = landmarks[9];
          const x = (wrist.x + middleMCP.x) / 2;
          const y = (wrist.y + middleMCP.y) / 2;
          const z = wrist.z;

          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const middleTip = landmarks[12];
          const ringTip = landmarks[16];
          const pinkyTip = landmarks[20];
          
          const handSize = Math.hypot(wrist.x - middleMCP.x, wrist.y - middleMCP.y);
          
          // Gesture: Open Palm
          const spread = Math.hypot(thumbTip.x - pinkyTip.x, thumbTip.y - pinkyTip.y);
          const isOpen = spread > handSize * 1.5;

          // Gesture: Pinch
          const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
          const isPinching = pinchDist < 0.05;

          // Gesture: Pointing
          const indexPIP = landmarks[6];
          const isPointing = !isPinching && (indexTip.y < indexPIP.y) && (middleTip.y > landmarks[10].y);

          // Gesture: Fist
          const tips = [indexTip, middleTip, ringTip, pinkyTip];
          const isFist = !isOpen && !isPointing && tips.every(tip => Math.hypot(tip.x - middleMCP.x, tip.y - middleMCP.y) < handSize * 0.8);

          onUpdate({
            x,
            y,
            z: Math.abs(z),
            isOpen,
            isPointing,
            isPinching,
            isFist,
            indexTip: { x: indexTip.x, y: indexTip.y, z: indexTip.z },
            detected: true,
          });
        } else {
          onUpdate({
            x: 0.5, y: 0.5, z: 0.5,
            isOpen: false, isPointing: false, isPinching: false, isFist: false,
            indexTip: null, detected: false,
          });
        }
      }
      animationId = requestAnimationFrame(detect);
    };

    initTracking();

    return () => {
      cancelAnimationFrame(animationId);
      if (landmarkerRef.current) landmarkerRef.current.close();
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [onUpdate]);

  return (
    <div className="relative w-full h-full bg-black">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="w-full h-full object-cover scale-x-[-1]" width={320} height={240} />
      {error && <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-[10px] text-center p-2">{error}</div>}
    </div>
  );
};

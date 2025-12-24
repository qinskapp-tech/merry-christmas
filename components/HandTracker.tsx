import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useStore } from '../store';
import { HandGesture } from '../types';

export const HandTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isCameraOpen, setGesture } = useStore();
  const [loaded, setLoaded] = useState(false);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    const initLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        setLoaded(true);
      } catch (error) {
        console.error("Error loading MediaPipe:", error);
      }
    };
    initLandmarker();
  }, []);

  const detectGesture = (landmarks: any[]) => {
    if (!landmarks || landmarks.length === 0) return HandGesture.None;
    
    const hand = landmarks[0];
    
    // Simple heuristic for Open Palm vs Closed Fist
    // Check if fingertips are above their respective PIP joints (y-coordinate is inverted in screen space usually, 
    // but MediaPipe normalizes it. Smaller Y is higher.)
    
    // Indices: 0 (wrist), 8 (index tip), 6 (index pip), 12 (middle tip), 10 (middle pip), etc.
    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];
    
    let extendedFingers = 0;
    
    // Check Index, Middle, Ring, Pinky
    for (let i = 0; i < 4; i++) {
        // Calculate distance from wrist (0) to tip vs wrist to PIP
        // Or simpler: check if tip is higher (smaller y) than PIP
        if (hand[tips[i]].y < hand[pips[i]].y) {
            extendedFingers++;
        }
    }

    // Thumb logic (check x distance relative to wrist/MCP)
    // Simplified: if >= 4 fingers extended -> Open Palm
    // if <= 1 finger extended -> Closed Fist

    if (extendedFingers >= 4) return HandGesture.Open_Palm;
    if (extendedFingers <= 1) return HandGesture.Closed_Fist;

    return HandGesture.None;
  };

  const predict = () => {
    if (landmarkerRef.current && videoRef.current && videoRef.current.readyState >= 2) {
      const results = landmarkerRef.current.detectForVideo(videoRef.current, performance.now());
      if (results.landmarks) {
        const detected = detectGesture(results.landmarks);
        setGesture(detected);
      }
    }
    requestRef.current = requestAnimationFrame(predict);
  };

  useEffect(() => {
    if (isCameraOpen && loaded) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener('loadeddata', predict);
          }
        } catch (err) {
          console.error("Camera access denied:", err);
        }
      };
      startCamera();
    } else {
      // Stop camera
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }

    return () => {
       if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isCameraOpen, loaded]);

  if (!isCameraOpen) return null;

  return (
    <div className="absolute top-4 right-4 w-48 h-36 bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 shadow-lg z-50">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover transform -scale-x-100" // Mirror effect
      />
      {!loaded && <div className="absolute inset-0 flex items-center justify-center text-xs text-white">Loading Model...</div>}
    </div>
  );
};
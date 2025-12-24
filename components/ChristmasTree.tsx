import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useStore } from '../store';
import { AppPhase, HandGesture } from '../types';
import { generateTreePoints, generateNebulaPoints, generateGarlandPoints, generateTorusPoints, ORNAMENT_COLORS } from '../utils/geometry';

const PARTICLE_COUNT = 5000;
const GARLAND_PARTICLE_COUNT = 2000; // Increased density for "thick" look
const TREE_HEIGHT = 10;
const TREE_RADIUS = 3.5;
const NEBULA_RADIUS = 8;
const NEBULA_TUBE = 2;

export const ChristmasTree: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const garlandMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const { phase, setPhase, gesture } = useStore();
  const [hoveredPoint, setHoveredPoint] = useState<THREE.Vector3 | null>(null);

  // Generate data once
  const { 
    treeData, nebulaData, colors,
    garlandTreeData, garlandNebulaData, garlandColors, garlandTypes 
  } = useMemo(() => {
    // --- Main Tree Data ---
    const tPoints = generateTreePoints(PARTICLE_COUNT, TREE_RADIUS, TREE_HEIGHT);
    const nPoints = generateNebulaPoints(PARTICLE_COUNT, NEBULA_RADIUS, NEBULA_TUBE);
    const cData = new Float32Array(PARTICLE_COUNT * 3);
    const tempColor = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const isOrnament = Math.random() > 0.9;
      if (isOrnament) {
        tempColor.set(ORNAMENT_COLORS[Math.floor(Math.random() * ORNAMENT_COLORS.length)]);
      } else {
        tempColor.set('#2E8B57').lerp(new THREE.Color('#006400'), Math.random());
      }
      cData[i * 3] = tempColor.r;
      cData[i * 3 + 1] = tempColor.g;
      cData[i * 3 + 2] = tempColor.b;
    }

    // --- Garland (Spiral) Data ---
    // Use generateGarlandPoints for a thick spiral
    const gTreePoints = generateGarlandPoints(GARLAND_PARTICLE_COUNT, TREE_RADIUS + 0.2, TREE_HEIGHT, 6, 0.25);
    // Use generateTorusPoints for a Saturn-like ring in nebula mode
    const gNebulaPoints = generateTorusPoints(GARLAND_PARTICLE_COUNT, NEBULA_RADIUS + 4, 0.5); 
    
    const gColors = new Float32Array(GARLAND_PARTICLE_COUNT * 3);
    const gTypes = new Float32Array(GARLAND_PARTICLE_COUNT); // 0 = Tinsel, 1 = Light

    const gold = new THREE.Color('#FFD700');
    const warmWhite = new THREE.Color('#FFF8E7');
    
    for (let i = 0; i < GARLAND_PARTICLE_COUNT; i++) {
        // 15% are bright lights, rest are gold tinsel
        const isLight = Math.random() > 0.85;
        gTypes[i] = isLight ? 1 : 0;

        let c;
        if (isLight) {
            c = warmWhite;
        } else {
            // Varying shades of gold/copper
            c = gold.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.3);
        }
        
        gColors[i * 3] = c.r;
        gColors[i * 3 + 1] = c.g;
        gColors[i * 3 + 2] = c.b;
    }

    return {
      treeData: tPoints,
      nebulaData: nPoints,
      colors: cData,
      garlandTreeData: gTreePoints,
      garlandNebulaData: gNebulaPoints,
      garlandColors: gColors,
      garlandTypes: gTypes
    };
  }, []);

  // Animation state (0 = tree, 1 = nebula)
  const animState = useRef({ progress: 0 });

  // Handle Phase Transitions
  useEffect(() => {
    if (phase === AppPhase.Blooming) {
      gsap.to(animState.current, {
        progress: 1,
        duration: 2.5,
        ease: 'elastic.out(1, 0.5)',
        onComplete: () => setPhase(AppPhase.Nebula)
      });
    } else if (phase === AppPhase.Collapsing) {
      gsap.to(animState.current, {
        progress: 0,
        duration: 2,
        ease: 'power3.inOut',
        onComplete: () => setPhase(AppPhase.Tree)
      });
    }
  }, [phase, setPhase]);

  // Handle Gestures
  useEffect(() => {
    if (gesture === HandGesture.Open_Palm && phase === AppPhase.Tree) {
      setPhase(AppPhase.Blooming);
    } else if (gesture === HandGesture.Closed_Fist && phase === AppPhase.Nebula) {
      setPhase(AppPhase.Collapsing);
    }
  }, [gesture, phase, setPhase]);

  // Mouse interaction
  const handlePointerMove = (e: any) => {
    if (phase === AppPhase.Tree) {
      setHoveredPoint(e.point);
    }
  };

  const handlePointerLeave = () => {
    setHoveredPoint(null);
  };

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const progress = animState.current.progress;

    // --- Update Main Tree Particles ---
    if (meshRef.current) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idx = i * 3;
        
        let tx = treeData[idx];
        let ty = treeData[idx + 1];
        let tz = treeData[idx + 2];

        const nx = nebulaData[idx];
        const ny = nebulaData[idx + 1];
        const nz = nebulaData[idx + 2];

        let x = THREE.MathUtils.lerp(tx, nx, progress);
        let y = THREE.MathUtils.lerp(ty, ny, progress);
        let z = THREE.MathUtils.lerp(tz, nz, progress);

        y += Math.sin(time * 0.5 + x * 0.5) * 0.1;

        // Repulsion
        if (progress < 0.1 && hoveredPoint) {
          const dx = x - hoveredPoint.x;
          const dy = y - hoveredPoint.y;
          const dz = z - hoveredPoint.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const repulsionRadius = 2.0;
          
          if (dist < repulsionRadius) {
            const force = (repulsionRadius - dist) / repulsionRadius;
            x += dx * force * 1.5;
            y += dy * force * 1.5;
            z += dz * force * 1.5;
          }
        }

        // Nebula Rotation
        if (progress > 0.9) {
          const angle = time * 0.1;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const rx = x * cos - z * sin;
          const rz = x * sin + z * cos;
          x = rx;
          z = rz;
        }

        dummy.position.set(x, y, z);
        const scale = 1 + Math.sin(time * 2 + i) * 0.2 + (progress === 1 ? 0.5 : 0);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      
      // Rotate container
      if (phase === AppPhase.Tree) {
        meshRef.current.rotation.y = time * 0.05;
      } else {
        meshRef.current.rotation.y = 0;
      }
    }

    // --- Update Garland Particles ---
    if (garlandMeshRef.current) {
        for (let i = 0; i < GARLAND_PARTICLE_COUNT; i++) {
          const idx = i * 3;
          
          const tx = garlandTreeData[idx];
          const ty = garlandTreeData[idx + 1];
          const tz = garlandTreeData[idx + 2];
  
          const nx = garlandNebulaData[idx];
          const ny = garlandNebulaData[idx + 1];
          const nz = garlandNebulaData[idx + 2];
  
          let x = THREE.MathUtils.lerp(tx, nx, progress);
          let y = THREE.MathUtils.lerp(ty, ny, progress);
          let z = THREE.MathUtils.lerp(tz, nz, progress);
  
          // Repulsion (Garland reacts too)
          if (progress < 0.1 && hoveredPoint) {
            const dx = x - hoveredPoint.x;
            const dy = y - hoveredPoint.y;
            const dz = z - hoveredPoint.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (dist < 2.5) {
              const force = (2.5 - dist) / 2.5;
              x += dx * force * 1.2;
              y += dy * force * 1.2;
              z += dz * force * 1.2;
            }
          }

          // Nebula Rotation
          if (progress > 0.9) {
            const angle = time * 0.15; // Slightly faster than inner tree
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const rx = x * cos - z * sin;
            const rz = x * sin + z * cos;
            x = rx;
            z = rz;
          }
  
          dummy.position.set(x, y, z);
          
          // --- Exquisite Animation Logic ---
          const isLight = garlandTypes[i] === 1;
          
          if (isLight) {
             // Lights twinkle slowly and are larger
             const twinkle = Math.sin(time * 3 + i * 10) * 0.5 + 0.5;
             const scale = 1.0 + twinkle * 1.5 + (progress === 1 ? 0.5 : 0);
             dummy.scale.set(scale, scale, scale);
          } else {
             // Tinsel glitters (fast small scale changes)
             const glitter = Math.sin(time * 10 + i) * 0.3 + 0.7;
             const scale = 0.6 * glitter + (progress === 1 ? 0.3 : 0);
             dummy.scale.set(scale, scale, scale);
          }
          
          dummy.updateMatrix();
          garlandMeshRef.current.setMatrixAt(i, dummy.matrix);
        }
        garlandMeshRef.current.instanceMatrix.needsUpdate = true;
        
        // Sync rotation
        if (phase === AppPhase.Tree) {
            garlandMeshRef.current.rotation.y = time * 0.05;
        } else {
            garlandMeshRef.current.rotation.y = 0;
        }
    }
  });

  return (
    <group>
        {/* Main Tree Mesh */}
        <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, PARTICLE_COUNT]}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        >
        <sphereGeometry args={[0.08, 8, 8]}>
            <instancedBufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
            />
        </sphereGeometry>
        <meshStandardMaterial
            vertexColors
            roughness={0.4}
            metalness={0.6}
            emissive="#111"
            emissiveIntensity={0.2}
        />
        </instancedMesh>

        {/* Exquisite Garland Mesh */}
        <instancedMesh
        ref={garlandMeshRef}
        args={[undefined, undefined, GARLAND_PARTICLE_COUNT]}
        >
        {/* Slightly larger geometry for garland lights */}
        <sphereGeometry args={[0.07, 8, 8]}>
            <instancedBufferAttribute
            attach="attributes-color"
            args={[garlandColors, 3]}
            />
        </sphereGeometry>
        <meshStandardMaterial
            vertexColors
            roughness={0.1}
            metalness={0.9}
            emissive="#FFD700"
            // High intensity for bloom effect
            emissiveIntensity={0.8}
            toneMapped={false} 
        />
        </instancedMesh>
    </group>
  );
};
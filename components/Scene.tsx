import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles, Environment, Float, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { ChristmasTree } from './ChristmasTree';

export const Scene: React.FC = () => {
  return (
    <Canvas
      camera={{ position: [0, 2, 15], fov: 45 }}
      gl={{ antialias: false, alpha: false }}
    >
      <color attach="background" args={['#050505']} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      {/* Warm Main Light */}
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffaa00" />
      {/* Cool Rim Light */}
      <pointLight position={[-10, 5, -10]} intensity={1} color="#4455ff" />
      {/* Top Spotlight */}
      <spotLight
        position={[0, 15, 0]}
        angle={0.5}
        penumbra={1}
        intensity={2}
        color="#fff"
        castShadow
      />

      <Suspense fallback={<Html center>Loading 3D Assets...</Html>}>
        <Environment preset="city" />
        
        {/* Environment */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.5} color="#ffd700" />
        
        <group position={[0, -4, 0]}>
             <ChristmasTree />
             
             {/* Top Star */}
             <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh position={[0, 10.2, 0]}>
                    <octahedronGeometry args={[0.8, 0]} />
                    <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={4} />
                </mesh>
             </Float>
        </group>
      </Suspense>

      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        maxPolarAngle={Math.PI / 1.5} 
        minPolarAngle={Math.PI / 3}
      />

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.6} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};
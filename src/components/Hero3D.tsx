import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Box, Torus } from "@react-three/drei";
import * as THREE from "three";

// Floating geometric shapes component
const FloatingShapes = () => {
  const sphereRef = useRef<THREE.Mesh>(null);
  const boxRef = useRef<THREE.Mesh>(null);
  const torusRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (sphereRef.current) {
      sphereRef.current.position.y = Math.sin(time) * 0.5;
      sphereRef.current.rotation.x = time * 0.2;
      sphereRef.current.rotation.y = time * 0.1;
    }
    
    if (boxRef.current) {
      boxRef.current.position.y = Math.cos(time * 0.8) * 0.3;
      boxRef.current.rotation.x = time * 0.15;
      boxRef.current.rotation.z = time * 0.1;
    }
    
    if (torusRef.current) {
      torusRef.current.position.y = Math.sin(time * 1.2) * 0.4;
      torusRef.current.rotation.x = time * 0.1;
      torusRef.current.rotation.y = time * 0.2;
    }
  });

  return (
    <>
      {/* Sphere */}
      <Sphere ref={sphereRef} args={[0.5, 32, 32]} position={[-3, 0, -2]}>
        <meshStandardMaterial
          color="#8b5cf6"
          transparent
          opacity={0.8}
          roughness={0.1}
          metalness={0.8}
        />
      </Sphere>

      {/* Box */}
      <Box ref={boxRef} args={[0.8, 0.8, 0.8]} position={[3, 1, -1]}>
        <meshStandardMaterial
          color="#06b6d4"
          transparent
          opacity={0.7}
          roughness={0.2}
          metalness={0.6}
        />
      </Box>

      {/* Torus */}
      <Torus ref={torusRef} args={[0.6, 0.2, 16, 100]} position={[0, -2, -3]}>
        <meshStandardMaterial
          color="#ec4899"
          transparent
          opacity={0.6}
          roughness={0.3}
          metalness={0.4}
        />
      </Torus>
    </>
  );
};

// Lighting setup
const Lighting = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#8b5cf6" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
      <spotLight
        position={[0, 5, 5]}
        angle={0.15}
        penumbra={1}
        intensity={0.8}
        color="#ffffff"
      />
    </>
  );
};

export const Hero3D = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <Lighting />
        <FloatingShapes />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Suspense>
    </Canvas>
  );
};
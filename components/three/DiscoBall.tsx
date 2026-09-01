'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { HDR_ENV } from '@/lib/hdr';

type Props = { bands?: number; lowPower?: boolean };

/**
 * Environnement HDR équirectangulaire : équivalent exact de <Environment />
 * de drei pour un simple fichier .hdr (même mapping, même espace colorimétrique),
 * sans embarquer drei ni ses décodeurs EXR/gainmap inutilisés ici.
 */
function HdrEnvironment({ file }: { file: string }) {
  const texture = useLoader(RGBELoader, file);
  const scene = useThree((state) => state.scene);

  useLayoutEffect(() => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.LinearSRGBColorSpace;
    const previous = scene.environment;
    scene.environment = texture;
    return () => {
      scene.environment = previous;
    };
  }, [texture, scene]);

  return null;
}

export default function DiscoBall({ bands = 22, lowPower = false }: Props) {
  const group = useRef<THREE.Group>(null);
  const tiles = useRef<THREE.InstancedMesh>(null);
  const lightA = useRef<THREE.PointLight>(null);
  const lightB = useRef<THREE.PointLight>(null);
  const lightC = useRef<THREE.PointLight>(null);
  const radius = 1.6;

  // Grille de miroirs lat/long, avec interstices (joints sombres = look disco)
  // Écrit directement dans les buffers d'instances : pas de millier d'objets
  // Matrix4/Color intermédiaires à allouer puis collecter au montage.
  const { matrixArray, colorArray, count } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const silver = '#eef2f6';
    const warm = ['#f7d9a8', '#f4b9cf', '#bdeee6'];
    const cellH = (Math.PI * radius) / bands;

    // 1ère passe : nombre exact de facettes, pour dimensionner les buffers
    const counts: number[] = [];
    let total = 0;
    for (let b = 0; b < bands; b++) {
      const lat = ((b + 0.5) / bands) * Math.PI;
      const ringR = Math.sin(lat) * radius;
      const c = Math.max(1, Math.round((2 * Math.PI * ringR) / cellH));
      counts.push(c);
      total += c;
    }

    const matrixArray = new Float32Array(total * 16);
    const colorArray = new Float32Array(total * 3);
    let n = 0;
    for (let b = 0; b < bands; b++) {
      const lat = ((b + 0.5) / bands) * Math.PI;
      const y = Math.cos(lat) * radius;
      const ringR = Math.sin(lat) * radius;
      const circ = 2 * Math.PI * ringR;
      const c = counts[b];
      const offset = (b % 2) * 0.5;
      const w = (circ / c) * 0.46;
      const h = cellH * 0.46;
      for (let i = 0; i < c; i++) {
        const lon = ((i + offset) / c) * Math.PI * 2;
        dummy.position.set(Math.cos(lon) * ringR, y, Math.sin(lon) * ringR);
        dummy.lookAt(0, 0, 0);
        dummy.scale.set(w, h, 0.03);
        dummy.updateMatrix();
        dummy.matrix.toArray(matrixArray, n * 16);
        color.set(n % 11 === 0 ? warm[n % warm.length] : silver);
        color.toArray(colorArray, n * 3);
        n++;
      }
    }
    return { matrixArray, colorArray, count: total };
  }, [bands]);

  useLayoutEffect(() => {
    const mesh = tiles.current;
    if (!mesh) return;
    (mesh.instanceMatrix.array as Float32Array).set(matrixArray);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
    mesh.instanceColor.needsUpdate = true;
  }, [matrixArray, colorArray]);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.22;
      const px = state.pointer.x * 0.14;
      const py = state.pointer.y * 0.1;
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, py, 0.04);
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, px, 0.04);
    }
    const t = state.clock.elapsedTime;
    if (lightA.current) lightA.current.position.set(Math.sin(t * 0.7) * 5, 3, Math.cos(t * 0.7) * 5);
    if (lightB.current) lightB.current.position.set(Math.cos(t * 0.5) * 5, -2.5, Math.sin(t * 0.5) * 5);
    if (lightC.current) lightC.current.position.set(Math.sin(t * 0.9 + 2) * 4, Math.cos(t * 0.6) * 4, 4.5);
  });

  return (
    <group ref={group}>
      <HdrEnvironment file={HDR_ENV} />

      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#fff0d6', '#3a1e33', 0.7]} />
      <pointLight ref={lightA} color="#f06a3a" intensity={lowPower ? 70 : 110} distance={20} />
      <pointLight ref={lightB} color="#e8487e" intensity={lowPower ? 65 : 100} distance={20} />
      <pointLight ref={lightC} color="#1aa293" intensity={lowPower ? 55 : 85} distance={20} />
      <pointLight color="#f5e8cf" intensity={lowPower ? 45 : 70} distance={22} position={[0, 5, 5]} />

      {/* Noyau sombre : ses interstices forment les joints de la boule */}
      <mesh>
        <sphereGeometry args={[radius * 0.99, 48, 48]} />
        <meshStandardMaterial color="#241019" metalness={0.6} roughness={0.6} />
      </mesh>

      {/* Miroirs */}
      <instancedMesh ref={tiles} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          metalness={0.95}
          roughness={lowPower ? 0.16 : 0.1}
          envMapIntensity={2.2}
          emissive={'#fff3da'}
          emissiveIntensity={0.5}
        />
      </instancedMesh>
    </group>
  );
}

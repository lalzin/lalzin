'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

type Props = { bands?: number; lowPower?: boolean };

export default function DiscoBall({ bands = 22, lowPower = false }: Props) {
  const group = useRef<THREE.Group>(null);
  const tiles = useRef<THREE.InstancedMesh>(null);
  const lightA = useRef<THREE.PointLight>(null);
  const lightB = useRef<THREE.PointLight>(null);
  const lightC = useRef<THREE.PointLight>(null);
  const radius = 1.6;

  // Grille de miroirs lat/long, avec interstices (joints sombres = look disco)
  const { matrices, colors } = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const dummy = new THREE.Object3D();
    const silver = new THREE.Color('#eef2f6');
    const warm = [
      new THREE.Color('#f7d9a8'),
      new THREE.Color('#f4b9cf'),
      new THREE.Color('#bdeee6'),
    ];
    const cellH = (Math.PI * radius) / bands;
    let n = 0;
    for (let b = 0; b < bands; b++) {
      const lat = ((b + 0.5) / bands) * Math.PI;
      const y = Math.cos(lat) * radius;
      const ringR = Math.sin(lat) * radius;
      const circ = 2 * Math.PI * ringR;
      const count = Math.max(1, Math.round(circ / cellH));
      const offset = (b % 2) * 0.5;
      for (let i = 0; i < count; i++) {
        const lon = ((i + offset) / count) * Math.PI * 2;
        const x = Math.cos(lon) * ringR;
        const z = Math.sin(lon) * ringR;
        dummy.position.set(x, y, z);
        dummy.lookAt(0, 0, 0);
        const w = (circ / count) * 0.46;
        const h = cellH * 0.46;
        dummy.scale.set(w, h, 0.03);
        dummy.updateMatrix();
        matrices.push(dummy.matrix.clone());
        colors.push(n % 11 === 0 ? warm[n % warm.length] : silver);
        n++;
      }
    }
    return { matrices, colors };
  }, [bands]);

  useLayoutEffect(() => {
    const mesh = tiles.current;
    if (!mesh) return;
    matrices.forEach((m, i) => {
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, colors[i]);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [matrices, colors]);

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
      <Environment preset="sunset" />

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
      <instancedMesh ref={tiles} args={[undefined, undefined, matrices.length]}>
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

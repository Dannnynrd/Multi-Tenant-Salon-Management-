'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, MeshDistortMaterial, OrbitControls, Sphere } from '@react-three/drei'
import * as THREE from 'three'

function AnimatedSphere({ position, color1 = '#3B82F6', color2 = '#8B5CF6', scale = 1 }: any) {
  const meshRef = useRef<THREE.Mesh>(null)

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.8}
      floatIntensity={0.8}
      floatingRange={[-0.5, 0.5]}
    >
      <Sphere ref={meshRef} args={[1, 64, 64]} position={position} scale={scale}>
        <MeshDistortMaterial
          color={color1}
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          opacity={0.15}
          transparent
        />
      </Sphere>
    </Float>
  )
}

function ParticleField() {
  const particlesRef = useRef<THREE.Points>(null)

  const particlesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const count = 500
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20
      positions[i + 1] = (Math.random() - 0.5) * 20
      positions[i + 2] = (Math.random() - 0.5) * 10
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [])

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.02
      particlesRef.current.rotation.x = clock.getElapsedTime() * 0.01
    }
  })

  return (
    <points ref={particlesRef} geometry={particlesGeometry}>
      <pointsMaterial
        size={0.02}
        color="#3B82F6"
        opacity={0.3}
        transparent
        sizeAttenuation
      />
    </points>
  )
}

function WaveGrid() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const positions = meshRef.current.geometry.attributes.position
      const time = clock.getElapsedTime()

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        const waveX = Math.sin(x * 0.5 + time) * 0.3
        const waveY = Math.sin(y * 0.5 + time * 0.8) * 0.3

        positions.setZ(i, waveX + waveY)
      }

      positions.needsUpdate = true
    }
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 3, 0, 0]} position={[0, -3, -2]}>
      <planeGeometry args={[20, 20, 50, 50]} />
      <meshStandardMaterial
        color="#8B5CF6"
        wireframe
        opacity={0.1}
        transparent
        emissive="#3B82F6"
        emissiveIntensity={0.05}
      />
    </mesh>
  )
}

function BackgroundGradient() {
  const { viewport } = useThree()

  return (
    <mesh scale={[viewport.width * 2, viewport.height * 2, 1]} position={[0, 0, -10]}>
      <planeGeometry />
      <shaderMaterial
        uniforms={{
          time: { value: 0 },
          colorA: { value: new THREE.Color('#ffffff') },
          colorB: { value: new THREE.Color('#f3f4f6') }
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 colorA;
          uniform vec3 colorB;
          varying vec2 vUv;

          void main() {
            vec3 color = mix(colorA, colorB, vUv.y);
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  )
}

export function Hero3DBackground() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        <pointLight position={[-10, -10, -5]} intensity={0.3} color="#8B5CF6" />

        <BackgroundGradient />

        {/* Main animated spheres */}
        <AnimatedSphere position={[-3, 2, -2]} scale={1.5} color1="#3B82F6" color2="#60A5FA" />
        <AnimatedSphere position={[3, -1, -3]} scale={1.2} color1="#8B5CF6" color2="#A78BFA" />
        <AnimatedSphere position={[0, 0, -4]} scale={0.8} color1="#EC4899" color2="#F472B6" />
        <AnimatedSphere position={[-2, -2, -2]} scale={0.6} color1="#10B981" color2="#34D399" />
        <AnimatedSphere position={[2, 1, -1]} scale={0.9} color1="#F59E0B" color2="#FCD34D" />

        {/* Particle field for depth */}
        <ParticleField />

        {/* Animated wave grid */}
        <WaveGrid />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* Gradient overlay for smooth blend */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white pointer-events-none" />

      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
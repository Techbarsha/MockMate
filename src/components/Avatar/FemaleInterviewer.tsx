import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import * as THREE from 'three';

interface FemaleInterviewerProps {
  isSpeaking: boolean;
  avatarStyle: string;
  emotion?: 'neutral' | 'happy' | 'focused' | 'encouraging';
  className?: string;
}

function ProfessionalFemaleAvatar({ isSpeaking, avatarStyle, emotion = 'neutral' }: { 
  isSpeaking: boolean; 
  avatarStyle: string; 
  emotion: string;
}) {
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Group>(null);
  const leftEyebrowRef = useRef<THREE.Mesh>(null);
  const rightEyebrowRef = useRef<THREE.Mesh>(null);
  const jawRef = useRef<THREE.Mesh>(null);
  const hairRef = useRef<THREE.Group>(null);
  const [blinkTimer, setBlinkTimer] = useState(0);
  const [speechTimer, setSpeechTimer] = useState(0);
  const [expressionTimer, setExpressionTimer] = useState(0);
  const { viewport } = useThree();

  // Calculate responsive scale for professional appearance
  const avatarScale = Math.min(viewport.width / 2.5, viewport.height / 3.5, 2.2);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Subtle head movement and breathing for realism
    if (headRef.current) {
      headRef.current.position.y = Math.sin(time * 0.4) * 0.012;
      headRef.current.rotation.x = Math.sin(time * 0.25) * 0.006;
      headRef.current.rotation.y = Math.sin(time * 0.15) * 0.01;
      
      // Slight head tilt when speaking
      if (isSpeaking) {
        headRef.current.rotation.z = Math.sin(time * 2) * 0.004;
      }
    }

    // Hair movement
    if (hairRef.current) {
      hairRef.current.rotation.y = Math.sin(time * 0.3) * 0.005;
      hairRef.current.position.y = Math.sin(time * 0.4) * 0.008;
    }

    // Realistic blinking animation
    setBlinkTimer(prev => prev + 0.016);
    if (blinkTimer > 2.8 + Math.random() * 2.5) {
      const blinkPhase = (blinkTimer - 2.8) * 18;
      if (blinkPhase < 1) {
        const blinkAmount = Math.sin(blinkPhase * Math.PI);
        if (leftEyeRef.current) leftEyeRef.current.scale.y = 1 - blinkAmount * 0.9;
        if (rightEyeRef.current) rightEyeRef.current.scale.y = 1 - blinkAmount * 0.9;
      } else {
        if (leftEyeRef.current) leftEyeRef.current.scale.y = 1;
        if (rightEyeRef.current) rightEyeRef.current.scale.y = 1;
        if (blinkPhase > 1.2) setBlinkTimer(0);
      }
    }

    // Advanced speaking animation with jaw movement
    if (isSpeaking && mouthRef.current && jawRef.current) {
      setSpeechTimer(prev => prev + 0.016);
      const speechPhase = speechTimer * 7;
      const mouthOpen = (Math.sin(speechPhase) + 1) * 0.5;
      const jawOpen = (Math.sin(speechPhase * 0.7) + 1) * 0.25;
      
      // Mouth scaling for speech
      const mouthWidth = 1 + mouthOpen * 0.35;
      const mouthHeight = 1 + mouthOpen * 0.5;
      mouthRef.current.scale.set(mouthWidth, mouthHeight, 1);
      mouthRef.current.position.z = 0.52 + mouthOpen * 0.012;
      
      // Jaw movement
      jawRef.current.rotation.x = jawOpen * 0.08;
      jawRef.current.position.y = -0.42 - jawOpen * 0.015;
    } else if (mouthRef.current && jawRef.current) {
      mouthRef.current.scale.set(1, 1, 1);
      mouthRef.current.position.z = 0.52;
      jawRef.current.rotation.x = 0;
      jawRef.current.position.y = -0.42;
    }

    // Emotion-based facial expressions
    setExpressionTimer(prev => prev + 0.016);
    if (leftEyebrowRef.current && rightEyebrowRef.current) {
      let eyebrowOffset = 0;
      let eyebrowRotation = 0;
      let eyebrowSpacing = 0;
      
      switch (emotion) {
        case 'happy':
          eyebrowOffset = 0.018 + Math.sin(expressionTimer * 0.5) * 0.006;
          eyebrowRotation = 0.1;
          eyebrowSpacing = 0.008;
          break;
        case 'focused':
          eyebrowOffset = -0.006 + Math.sin(expressionTimer * 0.3) * 0.003;
          eyebrowRotation = -0.03;
          eyebrowSpacing = -0.008;
          break;
        case 'encouraging':
          eyebrowOffset = 0.01 + Math.sin(expressionTimer * 0.4) * 0.005;
          eyebrowRotation = 0.06;
          eyebrowSpacing = 0.004;
          break;
        default:
          eyebrowOffset = Math.sin(expressionTimer * 0.2) * 0.002;
          eyebrowRotation = 0;
          eyebrowSpacing = 0;
      }
      
      leftEyebrowRef.current.position.y = 0.26 + eyebrowOffset;
      rightEyebrowRef.current.position.y = 0.26 + eyebrowOffset;
      leftEyebrowRef.current.position.x = -0.16 - eyebrowSpacing;
      rightEyebrowRef.current.position.x = 0.16 + eyebrowSpacing;
      leftEyebrowRef.current.rotation.z = -0.06 + eyebrowRotation;
      rightEyebrowRef.current.rotation.z = 0.06 - eyebrowRotation;
    }
  });

  // Professional female avatar features
  const avatarFeatures = {
    skinTone: '#F4C2A1',
    hairColor: '#8B4513',
    eyeColor: '#654321',
    lipColor: '#D2691E',
    clothing: '#FFFFFF',
    blazerColor: '#2C3E50',
    earringColor: '#FFD700'
  };

  return (
    <group ref={headRef} scale={[avatarScale, avatarScale, avatarScale]} position={[0, -0.3, 0]}>
      {/* Neck with feminine proportions */}
      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[0.24, 0.28, 0.6, 20]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>

      {/* Professional blazer */}
      <mesh position={[0, -1.3, 0]}>
        <cylinderGeometry args={[0.85, 1.2, 0.9, 20]} />
        <meshStandardMaterial color={avatarFeatures.blazerColor} />
      </mesh>

      {/* White blouse */}
      <mesh position={[0, -1.0, 0.2]}>
        <cylinderGeometry args={[0.32, 0.38, 0.4, 20]} />
        <meshStandardMaterial color={avatarFeatures.clothing} />
      </mesh>

      {/* Blazer lapels */}
      <mesh position={[-0.22, -1.1, 0.22]} rotation={[0, 0, 0.25]}>
        <boxGeometry args={[0.12, 0.5, 0.06]} />
        <meshStandardMaterial color={avatarFeatures.blazerColor} />
      </mesh>
      <mesh position={[0.22, -1.1, 0.22]} rotation={[0, 0, -0.25]}>
        <boxGeometry args={[0.12, 0.5, 0.06]} />
        <meshStandardMaterial color={avatarFeatures.blazerColor} />
      </mesh>

      {/* Head with feminine structure */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.48, 32, 32]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>

      {/* Cheekbones - more defined for feminine features */}
      <mesh position={[-0.25, -0.05, 0.35]} scale={[0.8, 0.8, 0.6]}>
        <sphereGeometry args={[0.12, 18, 18]} />
        <meshStandardMaterial color="#F0B090" />
      </mesh>
      <mesh position={[0.25, -0.05, 0.35]} scale={[0.8, 0.8, 0.6]}>
        <sphereGeometry args={[0.12, 18, 18]} />
        <meshStandardMaterial color="#F0B090" />
      </mesh>

      {/* Professional hairstyle - shoulder length with layers */}
      <group ref={hairRef}>
        {/* Main hair volume */}
        <mesh position={[0, 0.25, -0.05]} scale={[1.05, 0.8, 1.1]}>
          <sphereGeometry args={[0.5, 28, 28]} />
          <meshStandardMaterial color={avatarFeatures.hairColor} />
        </mesh>

        {/* Hair layers - left side */}
        <mesh position={[-0.4, 0.1, 0.2]} rotation={[0, 0, 0.3]} scale={[0.15, 0.6, 0.1]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={avatarFeatures.hairColor} />
        </mesh>
        <mesh position={[-0.45, -0.2, 0.15]} rotation={[0, 0, 0.4]} scale={[0.12, 0.5, 0.08]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={avatarFeatures.hairColor} />
        </mesh>

        {/* Hair layers - right side */}
        <mesh position={[0.4, 0.1, 0.2]} rotation={[0, 0, -0.3]} scale={[0.15, 0.6, 0.1]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={avatarFeatures.hairColor} />
        </mesh>
        <mesh position={[0.45, -0.2, 0.15]} rotation={[0, 0, -0.4]} scale={[0.12, 0.5, 0.08]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={avatarFeatures.hairColor} />
        </mesh>

        {/* Hair front styling with side part */}
        <mesh position={[-0.1, 0.42, 0.32]} rotation={[0.15, -0.2, 0]} scale={[0.4, 0.18, 0.25]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color={avatarFeatures.hairColor} />
        </mesh>
        <mesh position={[0.15, 0.4, 0.3]} rotation={[0.1, 0.1, 0]} scale={[0.3, 0.15, 0.2]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color={avatarFeatures.hairColor} />
        </mesh>
      </group>

      {/* Left Eye Complex */}
      <group position={[-0.16, 0.06, 0.4]}>
        {/* Eye socket shadow */}
        <mesh scale={[1.2, 1.0, 0.6]} position={[0, 0, -0.02]}>
          <sphereGeometry args={[0.08, 20, 20]} />
          <meshStandardMaterial color="#E8B896" />
        </mesh>
        {/* Eye white */}
        <mesh scale={[1.1, 0.9, 0.8]}>
          <sphereGeometry args={[0.075, 20, 20]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        {/* Iris with detail */}
        <mesh ref={leftEyeRef} position={[0, 0, 0.06]} scale={[0.7, 0.7, 1]}>
          <sphereGeometry args={[0.05, 20, 20]} />
          <meshStandardMaterial color={avatarFeatures.eyeColor} />
        </mesh>
        {/* Pupil */}
        <mesh position={[0, 0, 0.11]} scale={[0.4, 0.4, 1]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Eye highlight */}
        <mesh position={[0.02, 0.02, 0.12]} scale={[0.2, 0.2, 1]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#FFFFFF" transparent opacity={0.9} />
        </mesh>
        {/* Upper eyelid */}
        <mesh position={[0, 0.05, 0.07]} scale={[1.0, 0.25, 0.8]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={avatarFeatures.skinTone} />
        </mesh>
        {/* Eyelashes */}
        <mesh position={[0, 0.06, 0.08]} scale={[1.1, 0.1, 0.9]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#2C1810" />
        </mesh>
      </group>

      {/* Right Eye Complex */}
      <group position={[0.16, 0.06, 0.4]}>
        {/* Eye socket shadow */}
        <mesh scale={[1.2, 1.0, 0.6]} position={[0, 0, -0.02]}>
          <sphereGeometry args={[0.08, 20, 20]} />
          <meshStandardMaterial color="#E8B896" />
        </mesh>
        {/* Eye white */}
        <mesh scale={[1.1, 0.9, 0.8]}>
          <sphereGeometry args={[0.075, 20, 20]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        {/* Iris with detail */}
        <mesh ref={rightEyeRef} position={[0, 0, 0.06]} scale={[0.7, 0.7, 1]}>
          <sphereGeometry args={[0.05, 20, 20]} />
          <meshStandardMaterial color={avatarFeatures.eyeColor} />
        </mesh>
        {/* Pupil */}
        <mesh position={[0, 0, 0.11]} scale={[0.4, 0.4, 1]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Eye highlight */}
        <mesh position={[-0.02, 0.02, 0.12]} scale={[0.2, 0.2, 1]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#FFFFFF" transparent opacity={0.9} />
        </mesh>
        {/* Upper eyelid */}
        <mesh position={[0, 0.05, 0.07]} scale={[1.0, 0.25, 0.8]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={avatarFeatures.skinTone} />
        </mesh>
        {/* Eyelashes */}
        <mesh position={[0, 0.06, 0.08]} scale={[1.1, 0.1, 0.9]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#2C1810" />
        </mesh>
      </group>

      {/* Professional Eyebrows - shaped */}
      <mesh ref={leftEyebrowRef} position={[-0.16, 0.26, 0.45]} rotation={[0, 0, -0.06]} scale={[0.22, 0.05, 0.03]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#6B4423" />
      </mesh>
      <mesh ref={rightEyebrowRef} position={[0.16, 0.26, 0.45]} rotation={[0, 0, 0.06]} scale={[0.22, 0.05, 0.03]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#6B4423" />
      </mesh>

      {/* Feminine nose structure */}
      <mesh position={[0, -0.01, 0.48]} scale={[0.6, 1.1, 0.8]}>
        <coneGeometry args={[0.06, 0.16, 12]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>
      
      {/* Nose bridge */}
      <mesh position={[0, 0.04, 0.46]} scale={[0.4, 0.9, 0.6]}>
        <boxGeometry args={[0.04, 0.1, 0.08]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>

      {/* Nostrils */}
      <mesh position={[-0.02, -0.07, 0.5]} scale={[0.3, 0.5, 0.3]}>
        <sphereGeometry args={[0.015, 10, 10]} />
        <meshStandardMaterial color="#8B4513" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.02, -0.07, 0.5]} scale={[0.3, 0.5, 0.3]}>
        <sphereGeometry args={[0.015, 10, 10]} />
        <meshStandardMaterial color="#8B4513" transparent opacity={0.6} />
      </mesh>

      {/* Professional mouth with lipstick */}
      <group ref={mouthRef} position={[0, -0.26, 0.52]}>
        {/* Upper lip */}
        <mesh position={[0, 0.015, 0]} scale={[1.0, 0.35, 0.7]}>
          <sphereGeometry args={[0.07, 16, 10]} />
          <meshStandardMaterial color={avatarFeatures.lipColor} />
        </mesh>
        {/* Lower lip */}
        <mesh position={[0, -0.015, 0]} scale={[0.95, 0.5, 0.8]}>
          <sphereGeometry args={[0.07, 16, 10]} />
          <meshStandardMaterial color={avatarFeatures.lipColor} />
        </mesh>
        {/* Mouth corners */}
        <mesh position={[-0.06, 0, 0]} scale={[0.25, 0.4, 0.6]}>
          <sphereGeometry args={[0.07, 12, 10]} />
          <meshStandardMaterial color={avatarFeatures.lipColor} />
        </mesh>
        <mesh position={[0.06, 0, 0]} scale={[0.25, 0.4, 0.6]}>
          <sphereGeometry args={[0.07, 12, 10]} />
          <meshStandardMaterial color={avatarFeatures.lipColor} />
        </mesh>
      </group>

      {/* Feminine jawline */}
      <mesh ref={jawRef} position={[0, -0.42, 0.22]} scale={[1.0, 0.6, 0.9]}>
        <sphereGeometry args={[0.16, 20, 20]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>

      {/* Feminine chin */}
      <mesh position={[0, -0.48, 0.32]} scale={[0.8, 0.6, 0.8]}>
        <sphereGeometry args={[0.14, 18, 18]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>

      {/* Ears with earrings */}
      <mesh position={[-0.44, 0, 0.1]} rotation={[0, 0, -0.1]} scale={[0.6, 1.0, 0.4]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>
      <mesh position={[0.44, 0, 0.1]} rotation={[0, 0, 0.1]} scale={[0.6, 1.0, 0.4]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>

      {/* Earrings */}
      <mesh position={[-0.48, -0.1, 0.15]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color={avatarFeatures.earringColor} />
      </mesh>
      <mesh position={[0.48, -0.1, 0.15]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color={avatarFeatures.earringColor} />
      </mesh>

      {/* Ear details */}
      <mesh position={[-0.42, 0, 0.16]} rotation={[0, 0, -0.1]} scale={[0.3, 0.5, 0.25]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#E8B896" />
      </mesh>
      <mesh position={[0.42, 0, 0.16]} rotation={[0, 0, 0.1]} scale={[0.3, 0.5, 0.25]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#E8B896" />
      </mesh>

      {/* Blouse collar details */}
      <mesh position={[-0.12, -0.95, 0.22]} rotation={[0, 0, 0.15]} scale={[0.1, 0.2, 0.04]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={avatarFeatures.clothing} />
      </mesh>
      <mesh position={[0.12, -0.95, 0.22]} rotation={[0, 0, -0.15]} scale={[0.1, 0.2, 0.04]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={avatarFeatures.clothing} />
      </mesh>

      {/* Subtle makeup highlights */}
      <mesh position={[-0.25, -0.02, 0.38]} scale={[0.6, 0.6, 0.4]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#F8D7DA" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0.25, -0.02, 0.38]} scale={[0.6, 0.6, 0.4]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#F8D7DA" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export default function FemaleInterviewer({ 
  isSpeaking, 
  avatarStyle, 
  emotion = 'neutral', 
  className = '' 
}: FemaleInterviewerProps) {
  const [currentEmotion, setCurrentEmotion] = useState(emotion);

  useEffect(() => {
    // Dynamic emotion changes based on interaction
    if (isSpeaking) {
      setCurrentEmotion('focused');
    } else {
      setCurrentEmotion(emotion);
    }
  }, [isSpeaking, emotion]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        camera={{ 
          position: [0, 0.2, 2.8], 
          fov: 45,
          aspect: window.innerWidth / window.innerHeight
        }}
        style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          width: '100%',
          height: '100%'
        }}
        shadows
        dpr={[1, 2]}
      >
        {/* Professional studio lighting setup */}
        <ambientLight intensity={0.4} color="#f8fafc" />
        
        {/* Key light - main illumination */}
        <directionalLight 
          position={[3, 5, 4]} 
          intensity={1.6} 
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          color="#ffffff"
        />
        
        {/* Fill light - soften shadows */}
        <directionalLight 
          position={[-2, 3, 3]} 
          intensity={0.8} 
          color="#e0f2fe"
        />
        
        {/* Rim light - edge definition */}
        <directionalLight 
          position={[0, -1, -4]} 
          intensity={0.6} 
          color="#fef3c7"
        />
        
        {/* Face-specific lighting */}
        <pointLight position={[0, 2, 3]} intensity={0.5} color="#ffffff" />
        <pointLight position={[-1, 1, 2]} intensity={0.3} color="#f0f9ff" />
        <pointLight position={[1, 1, 2]} intensity={0.3} color="#f0f9ff" />
        
        {/* Professional spotlight */}
        <spotLight 
          position={[0, 4, 3]} 
          angle={0.5} 
          penumbra={0.3} 
          intensity={1.0}
          target-position={[0, 0, 0]}
          castShadow
          color="#ffffff"
        />

        <ProfessionalFemaleAvatar 
          isSpeaking={isSpeaking} 
          avatarStyle={avatarStyle}
          emotion={currentEmotion}
        />

        {/* Professional backdrop */}
        <mesh position={[0, 0, -3]} receiveShadow>
          <planeGeometry args={[8, 6]} />
          <meshStandardMaterial 
            color="#667eea" 
            transparent 
            opacity={0.1}
          />
        </mesh>

        {/* Ground plane for shadows */}
        <mesh receiveShadow position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[12, 12]} />
          <meshStandardMaterial 
            color="#e2e8f0" 
            transparent 
            opacity={0.2}
          />
        </mesh>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={5}
          maxPolarAngle={Math.PI * 0.65}
          minPolarAngle={Math.PI * 0.35}
          autoRotate={false}
          enableDamping
          dampingFactor={0.03}
          rotateSpeed={0.4}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Professional status indicator */}
      <div className="absolute bottom-6 right-6">
        <div className={`flex items-center space-x-3 px-6 py-3 rounded-2xl backdrop-blur-lg border transition-all duration-300 shadow-xl ${
          isSpeaking 
            ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40 shadow-emerald-500/25' 
            : 'bg-purple-500/25 text-purple-200 border-purple-400/40 shadow-purple-500/25'
        }`}>
          <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
            isSpeaking 
              ? 'bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/60' 
              : 'bg-purple-400 shadow-lg shadow-purple-400/60'
          }`} />
          <span className="text-sm font-semibold">
            {isSpeaking ? 'Speaking' : 'Listening'}
          </span>
          {isSpeaking && (
            <div className="flex space-x-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-5 bg-emerald-300 rounded-full animate-pulse"
                  style={{
                    animationDelay: `${i * 0.12}s`,
                    animationDuration: '0.7s'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Professional avatar info */}
      <div className="absolute top-6 left-6">
        <div className="bg-white/15 backdrop-blur-lg rounded-xl px-5 py-4 border border-white/25 shadow-xl">
          <div className="text-white text-lg font-bold">
            Professional AI Interviewer
          </div>
          <div className="text-white/90 text-sm font-medium">
            Realistic Female Avatar • Advanced Expressions
          </div>
          <div className="text-white/70 text-xs mt-1 flex items-center">
            <span className="mr-2">
              {currentEmotion === 'happy' && '😊'}
              {currentEmotion === 'focused' && '🤔'}
              {currentEmotion === 'encouraging' && '😌'}
              {currentEmotion === 'neutral' && '😐'}
            </span>
            {currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)} Mode
          </div>
        </div>
      </div>

      {/* Professional credentials badge */}
      <div className="absolute top-6 right-6">
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-md rounded-lg px-4 py-3 border border-white/20 shadow-lg">
          <div className="text-white/90 text-sm font-semibold flex items-center">
            <span className="mr-2">👩‍💼</span>
            Senior HR Manager
          </div>
          <div className="text-white/70 text-xs">
            8+ Years Experience
          </div>
        </div>
      </div>

      {/* Speaking visualization */}
      {isSpeaking && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-2">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-white/50 rounded-full animate-pulse backdrop-blur-sm"
                  style={{
                    animationDelay: `${i * 0.08}s`,
                    animationDuration: '0.9s',
                    height: `${15 + Math.random() * 25}px`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Professional interaction hints */}
      <div className="absolute bottom-6 left-6">
        <div className="bg-black/20 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
          <div className="text-white/80 text-xs">
            Drag to rotate • Scroll to zoom • Professional interview mode
          </div>
        </div>
      </div>
    </div>
  );
}
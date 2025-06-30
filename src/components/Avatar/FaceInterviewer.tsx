import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import FemaleInterviewer from './FemaleInterviewer';

interface FaceInterviewerProps {
  isSpeaking: boolean;
  avatarStyle: string;
  emotion?: 'neutral' | 'happy' | 'focused' | 'encouraging';
  className?: string;
  gender?: 'male' | 'female';
}

function ProfessionalMaleAvatar({ isSpeaking, avatarStyle, emotion = 'neutral' }: { 
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
      headRef.current.position.y = Math.sin(time * 0.4) * 0.015;
      headRef.current.rotation.x = Math.sin(time * 0.25) * 0.008;
      headRef.current.rotation.y = Math.sin(time * 0.15) * 0.012;
      
      // Slight head tilt when speaking
      if (isSpeaking) {
        headRef.current.rotation.z = Math.sin(time * 2) * 0.005;
      }
    }

    // Realistic blinking animation
    setBlinkTimer(prev => prev + 0.016);
    if (blinkTimer > 2.5 + Math.random() * 3) {
      const blinkPhase = (blinkTimer - 2.5) * 20;
      if (blinkPhase < 1) {
        const blinkAmount = Math.sin(blinkPhase * Math.PI);
        if (leftEyeRef.current) leftEyeRef.current.scale.y = 1 - blinkAmount * 0.95;
        if (rightEyeRef.current) rightEyeRef.current.scale.y = 1 - blinkAmount * 0.95;
      } else {
        if (leftEyeRef.current) leftEyeRef.current.scale.y = 1;
        if (rightEyeRef.current) rightEyeRef.current.scale.y = 1;
        if (blinkPhase > 1.1) setBlinkTimer(0);
      }
    }

    // Advanced speaking animation with jaw movement
    if (isSpeaking && mouthRef.current && jawRef.current) {
      setSpeechTimer(prev => prev + 0.016);
      const speechPhase = speechTimer * 8;
      const mouthOpen = (Math.sin(speechPhase) + 1) * 0.5;
      const jawOpen = (Math.sin(speechPhase * 0.8) + 1) * 0.3;
      
      // Mouth scaling for speech
      const mouthWidth = 1 + mouthOpen * 0.4;
      const mouthHeight = 1 + mouthOpen * 0.6;
      mouthRef.current.scale.set(mouthWidth, mouthHeight, 1);
      mouthRef.current.position.z = 0.54 + mouthOpen * 0.015;
      
      // Jaw movement
      jawRef.current.rotation.x = jawOpen * 0.1;
      jawRef.current.position.y = -0.45 - jawOpen * 0.02;
    } else if (mouthRef.current && jawRef.current) {
      mouthRef.current.scale.set(1, 1, 1);
      mouthRef.current.position.z = 0.54;
      jawRef.current.rotation.x = 0;
      jawRef.current.position.y = -0.45;
    }

    // Emotion-based facial expressions
    setExpressionTimer(prev => prev + 0.016);
    if (leftEyebrowRef.current && rightEyebrowRef.current) {
      let eyebrowOffset = 0;
      let eyebrowRotation = 0;
      let eyebrowSpacing = 0;
      
      switch (emotion) {
        case 'happy':
          eyebrowOffset = 0.015 + Math.sin(expressionTimer * 0.5) * 0.005;
          eyebrowRotation = 0.08;
          eyebrowSpacing = 0.005;
          break;
        case 'focused':
          eyebrowOffset = -0.008 + Math.sin(expressionTimer * 0.3) * 0.003;
          eyebrowRotation = -0.04;
          eyebrowSpacing = -0.01;
          break;
        case 'encouraging':
          eyebrowOffset = 0.008 + Math.sin(expressionTimer * 0.4) * 0.004;
          eyebrowRotation = 0.05;
          eyebrowSpacing = 0.002;
          break;
        default:
          eyebrowOffset = Math.sin(expressionTimer * 0.2) * 0.002;
          eyebrowRotation = 0;
          eyebrowSpacing = 0;
      }
      
      leftEyebrowRef.current.position.y = 0.28 + eyebrowOffset;
      rightEyebrowRef.current.position.y = 0.28 + eyebrowOffset;
      leftEyebrowRef.current.position.x = -0.18 - eyebrowSpacing;
      rightEyebrowRef.current.position.x = 0.18 + eyebrowSpacing;
      leftEyebrowRef.current.rotation.z = -0.08 + eyebrowRotation;
      rightEyebrowRef.current.rotation.z = 0.08 - eyebrowRotation;
    }
  });

  // Professional male avatar features
  const avatarFeatures = {
    skinTone: '#F5C6A0',
    hairColor: '#2C1810',
    eyeColor: '#4A4A4A',
    lipColor: '#C4A484',
    clothing: '#1a365d',
    shirtColor: '#ffffff',
    tieColor: '#8B0000'
  };

  return (
    <group ref={headRef} scale={[avatarScale, avatarScale, avatarScale]} position={[0, -0.3, 0]}>
      {/* Neck with realistic proportions */}
      <mesh position={[0, -0.9, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.7, 20]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>

      {/* Shirt collar */}
      <mesh position={[0, -1.1, 0.15]}>
        <cylinderGeometry args={[0.35, 0.4, 0.3, 20]} />
        <meshStandardMaterial color={avatarFeatures.shirtColor} />
      </mesh>

      {/* Suit jacket */}
      <mesh position={[0, -1.4, 0]}>
        <cylinderGeometry args={[0.9, 1.3, 1.0, 20]} />
        <meshStandardMaterial color={avatarFeatures.clothing} />
      </mesh>

      {/* Suit lapels */}
      <mesh position={[-0.25, -1.2, 0.25]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.15, 0.6, 0.08]} />
        <meshStandardMaterial color={avatarFeatures.clothing} />
      </mesh>
      <mesh position={[0.25, -1.2, 0.25]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.15, 0.6, 0.08]} />
        <meshStandardMaterial color={avatarFeatures.clothing} />
      </mesh>

      {/* Professional tie */}
      <mesh position={[0, -1.1, 0.28]} scale={[0.12, 0.9, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={avatarFeatures.tieColor} />
      </mesh>

      {/* Head with masculine structure */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.52, 32, 32]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>

      {/* Forehead definition */}
      <mesh position={[0, 0.18, 0.47]} scale={[0.8, 0.3, 0.15]}>
        <sphereGeometry args={[0.5, 20, 20]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>

      {/* Professional hairstyle */}
      <mesh position={[0, 0.28, -0.08]} scale={[1.08, 0.85, 1.15]}>
        <sphereGeometry args={[0.52, 28, 28]} />
        <meshStandardMaterial color={avatarFeatures.hairColor} />
      </mesh>

      {/* Hair side parts */}
      <mesh position={[-0.35, 0.32, 0.25]} rotation={[0, 0, 0.4]} scale={[0.18, 0.45, 0.12]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={avatarFeatures.hairColor} />
      </mesh>
      <mesh position={[0.35, 0.32, 0.25]} rotation={[0, 0, -0.4]} scale={[0.18, 0.45, 0.12]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={avatarFeatures.hairColor} />
      </mesh>

      {/* Hair front styling */}
      <mesh position={[0, 0.45, 0.35]} rotation={[0.2, 0, 0]} scale={[0.6, 0.2, 0.3]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color={avatarFeatures.hairColor} />
      </mesh>

      {/* Left Eye Complex */}
      <group position={[-0.18, 0.08, 0.42]}>
        {/* Eye socket shadow */}
        <mesh scale={[1.3, 1.1, 0.6]} position={[0, 0, -0.02]}>
          <sphereGeometry args={[0.09, 20, 20]} />
          <meshStandardMaterial color="#E8B896" />
        </mesh>
        {/* Eye white */}
        <mesh scale={[1.2, 1, 0.8]}>
          <sphereGeometry args={[0.085, 20, 20]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        {/* Iris with detail */}
        <mesh ref={leftEyeRef} position={[0, 0, 0.07]} scale={[0.75, 0.75, 1]}>
          <sphereGeometry args={[0.055, 20, 20]} />
          <meshStandardMaterial color={avatarFeatures.eyeColor} />
        </mesh>
        {/* Pupil */}
        <mesh position={[0, 0, 0.12]} scale={[0.45, 0.45, 1]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Eye highlight */}
        <mesh position={[0.025, 0.025, 0.13]} scale={[0.25, 0.25, 1]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshStandardMaterial color="#FFFFFF" transparent opacity={0.9} />
        </mesh>
        {/* Upper eyelid */}
        <mesh position={[0, 0.06, 0.08]} scale={[1.1, 0.3, 0.9]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color={avatarFeatures.skinTone} />
        </mesh>
      </group>

      {/* Right Eye Complex */}
      <group position={[0.18, 0.08, 0.42]}>
        {/* Eye socket shadow */}
        <mesh scale={[1.3, 1.1, 0.6]} position={[0, 0, -0.02]}>
          <sphereGeometry args={[0.09, 20, 20]} />
          <meshStandardMaterial color="#E8B896" />
        </mesh>
        {/* Eye white */}
        <mesh scale={[1.2, 1, 0.8]}>
          <sphereGeometry args={[0.085, 20, 20]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        {/* Iris with detail */}
        <mesh ref={rightEyeRef} position={[0, 0, 0.07]} scale={[0.75, 0.75, 1]}>
          <sphereGeometry args={[0.055, 20, 20]} />
          <meshStandardMaterial color={avatarFeatures.eyeColor} />
        </mesh>
        {/* Pupil */}
        <mesh position={[0, 0, 0.12]} scale={[0.45, 0.45, 1]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Eye highlight */}
        <mesh position={[-0.025, 0.025, 0.13]} scale={[0.25, 0.25, 1]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshStandardMaterial color="#FFFFFF" transparent opacity={0.9} />
        </mesh>
        {/* Upper eyelid */}
        <mesh position={[0, 0.06, 0.08]} scale={[1.1, 0.3, 0.9]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color={avatarFeatures.skinTone} />
        </mesh>
      </group>

      {/* Professional Eyebrows */}
      <mesh ref={leftEyebrowRef} position={[-0.18, 0.28, 0.47]} rotation={[0, 0, -0.08]} scale={[0.25, 0.06, 0.04]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={avatarFeatures.hairColor} />
      </mesh>
      <mesh ref={rightEyebrowRef} position={[0.18, 0.28, 0.47]} rotation={[0, 0, 0.08]} scale={[0.25, 0.06, 0.04]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={avatarFeatures.hairColor} />
      </mesh>

      {/* Masculine nose structure */}
      <mesh position={[0, -0.02, 0.5]} scale={[0.7, 1.2, 0.9]}>
        <coneGeometry args={[0.07, 0.18, 12]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>
      
      {/* Nose bridge */}
      <mesh position={[0, 0.05, 0.48]} scale={[0.5, 1, 0.7]}>
        <boxGeometry args={[0.05, 0.12, 0.1]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>

      {/* Nostrils */}
      <mesh position={[-0.025, -0.08, 0.52]} scale={[0.4, 0.6, 0.4]}>
        <sphereGeometry args={[0.02, 10, 10]} />
        <meshStandardMaterial color="#8B4513" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.025, -0.08, 0.52]} scale={[0.4, 0.6, 0.4]}>
        <sphereGeometry args={[0.02, 10, 10]} />
        <meshStandardMaterial color="#8B4513" transparent opacity={0.7} />
      </mesh>

      {/* Professional mouth */}
      <group ref={mouthRef} position={[0, -0.28, 0.54]}>
        {/* Upper lip */}
        <mesh position={[0, 0.02, 0]} scale={[1.1, 0.4, 0.8]}>
          <sphereGeometry args={[0.08, 16, 10]} />
          <meshStandardMaterial color={avatarFeatures.lipColor} />
        </mesh>
        {/* Lower lip */}
        <mesh position={[0, -0.02, 0]} scale={[1, 0.6, 0.9]}>
          <sphereGeometry args={[0.08, 16, 10]} />
          <meshStandardMaterial color={avatarFeatures.lipColor} />
        </mesh>
        {/* Mouth corners */}
        <mesh position={[-0.07, 0, 0]} scale={[0.3, 0.5, 0.7]}>
          <sphereGeometry args={[0.08, 12, 10]} />
          <meshStandardMaterial color={avatarFeatures.lipColor} />
        </mesh>
        <mesh position={[0.07, 0, 0]} scale={[0.3, 0.5, 0.7]}>
          <sphereGeometry args={[0.08, 12, 10]} />
          <meshStandardMaterial color={avatarFeatures.lipColor} />
        </mesh>
      </group>

      {/* Strong jawline */}
      <mesh ref={jawRef} position={[0, -0.45, 0.25]} scale={[1.1, 0.7, 1]}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>

      {/* Cheekbones */}
      <mesh position={[-0.28, -0.08, 0.38]} scale={[0.9, 0.9, 0.7]}>
        <sphereGeometry args={[0.14, 18, 18]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>
      <mesh position={[0.28, -0.08, 0.38]} scale={[0.9, 0.9, 0.7]}>
        <sphereGeometry args={[0.14, 18, 18]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>

      {/* Masculine chin */}
      <mesh position={[0, -0.52, 0.35]} scale={[0.9, 0.7, 0.9]}>
        <sphereGeometry args={[0.16, 18, 18]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>

      {/* Ears */}
      <mesh position={[-0.48, 0, 0.12]} rotation={[0, 0, -0.15]} scale={[0.7, 1.1, 0.5]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>
      <mesh position={[0.48, 0, 0.12]} rotation={[0, 0, 0.15]} scale={[0.7, 1.1, 0.5]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color={avatarFeatures.skinTone} />
      </mesh>

      {/* Ear details */}
      <mesh position={[-0.46, 0, 0.18]} rotation={[0, 0, -0.15]} scale={[0.4, 0.6, 0.3]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#E8B896" />
      </mesh>
      <mesh position={[0.46, 0, 0.18]} rotation={[0, 0, 0.15]} scale={[0.4, 0.6, 0.3]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#E8B896" />
      </mesh>

      {/* Subtle facial hair/5 o'clock shadow */}
      <mesh position={[0, -0.35, 0.45]} scale={[0.8, 0.4, 0.6]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#3C2415" transparent opacity={0.15} />
      </mesh>

      {/* Professional glasses (optional for tech style) */}
      {avatarStyle === 'tech' && (
        <group>
          <mesh position={[-0.18, 0.08, 0.5]}>
            <torusGeometry args={[0.13, 0.018, 10, 20]} />
            <meshStandardMaterial color="#2D2D2D" />
          </mesh>
          <mesh position={[0.18, 0.08, 0.5]}>
            <torusGeometry args={[0.13, 0.018, 10, 20]} />
            <meshStandardMaterial color="#2D2D2D" />
          </mesh>
          <mesh position={[0, 0.08, 0.5]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.01, 0.01, 0.36]} />
            <meshStandardMaterial color="#2D2D2D" />
          </mesh>
          {/* Nose pads */}
          <mesh position={[-0.08, 0.05, 0.51]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshStandardMaterial color="#2D2D2D" />
          </mesh>
          <mesh position={[0.08, 0.05, 0.51]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshStandardMaterial color="#2D2D2D" />
          </mesh>
        </group>
      )}

      {/* Shirt collar details */}
      <mesh position={[-0.15, -1.05, 0.25]} rotation={[0, 0, 0.2]} scale={[0.12, 0.25, 0.05]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={avatarFeatures.shirtColor} />
      </mesh>
      <mesh position={[0.15, -1.05, 0.25]} rotation={[0, 0, -0.2]} scale={[0.12, 0.25, 0.05]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={avatarFeatures.shirtColor} />
      </mesh>

      {/* Tie knot */}
      <mesh position={[0, -0.95, 0.3]} scale={[0.15, 0.12, 0.08]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={avatarFeatures.tieColor} />
      </mesh>
    </group>
  );
}

export default function FaceInterviewer({ 
  isSpeaking, 
  avatarStyle, 
  emotion = 'neutral', 
  className = '',
  gender = 'female' // Default to female to match the image
}: FaceInterviewerProps) {
  const [currentEmotion, setCurrentEmotion] = useState(emotion);

  useEffect(() => {
    // Dynamic emotion changes based on interaction
    if (isSpeaking) {
      setCurrentEmotion('focused');
    } else {
      setCurrentEmotion(emotion);
    }
  }, [isSpeaking, emotion]);

  // Choose avatar based on gender preference
  if (gender === 'female') {
    return (
      <FemaleInterviewer
        isSpeaking={isSpeaking}
        avatarStyle={avatarStyle}
        emotion={currentEmotion}
        className={className}
      />
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        camera={{ 
          position: [0, 0.2, 2.8], 
          fov: 45,
          aspect: window.innerWidth / window.innerHeight
        }}
        style={{ 
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #1e40af 100%)',
          width: '100%',
          height: '100%'
        }}
        shadows
        dpr={[1, 2]}
      >
        {/* Professional studio lighting setup */}
        <ambientLight intensity={0.3} color="#f8fafc" />
        
        {/* Key light - main illumination */}
        <directionalLight 
          position={[3, 5, 4]} 
          intensity={1.8} 
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
          intensity={0.9} 
          color="#e0f2fe"
        />
        
        {/* Rim light - edge definition */}
        <directionalLight 
          position={[0, -1, -4]} 
          intensity={0.7} 
          color="#fef3c7"
        />
        
        {/* Face-specific lighting */}
        <pointLight position={[0, 2, 3]} intensity={0.6} color="#ffffff" />
        <pointLight position={[-1, 1, 2]} intensity={0.4} color="#f0f9ff" />
        <pointLight position={[1, 1, 2]} intensity={0.4} color="#f0f9ff" />
        
        {/* Professional spotlight */}
        <spotLight 
          position={[0, 4, 3]} 
          angle={0.5} 
          penumbra={0.3} 
          intensity={1.2}
          target-position={[0, 0, 0]}
          castShadow
          color="#ffffff"
        />

        <ProfessionalMaleAvatar 
          isSpeaking={isSpeaking} 
          avatarStyle={avatarStyle}
          emotion={currentEmotion}
        />

        {/* Professional backdrop */}
        <mesh position={[0, 0, -3]} receiveShadow>
          <planeGeometry args={[8, 6]} />
          <meshStandardMaterial 
            color="#1e40af" 
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
            : 'bg-blue-500/25 text-blue-200 border-blue-400/40 shadow-blue-500/25'
        }`}>
          <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
            isSpeaking 
              ? 'bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/60' 
              : 'bg-blue-400 shadow-lg shadow-blue-400/60'
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
            Realistic Male Avatar • Advanced Expressions
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
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md rounded-lg px-4 py-3 border border-white/20 shadow-lg">
          <div className="text-white/90 text-sm font-semibold flex items-center">
            <span className="mr-2">🎓</span>
            Senior Interviewer
          </div>
          <div className="text-white/70 text-xs">
            10+ Years Experience
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
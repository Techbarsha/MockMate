import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import * as THREE from 'three';

interface FaceInterviewerProps {
  isSpeaking: boolean;
  avatarStyle: string;
  emotion?: 'neutral' | 'happy' | 'focused' | 'encouraging';
  className?: string;
}

function FaceModel({ isSpeaking, avatarStyle, emotion = 'neutral' }: { 
  isSpeaking: boolean; 
  avatarStyle: string; 
  emotion: string;
}) {
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyebrowRef = useRef<THREE.Mesh>(null);
  const rightEyebrowRef = useRef<THREE.Mesh>(null);
  const [blinkTimer, setBlinkTimer] = useState(0);
  const [speechTimer, setSpeechTimer] = useState(0);
  const { viewport } = useThree();

  // Calculate responsive scale
  const avatarScale = Math.min(viewport.width / 3, viewport.height / 4, 2);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Head movement and breathing
    if (headRef.current) {
      headRef.current.position.y = Math.sin(time * 0.5) * 0.02;
      headRef.current.rotation.x = Math.sin(time * 0.3) * 0.01;
      headRef.current.rotation.y = Math.sin(time * 0.2) * 0.02;
    }

    // Blinking animation
    setBlinkTimer(prev => prev + 0.016);
    if (blinkTimer > 3 + Math.random() * 2) {
      const blinkPhase = (blinkTimer - 3) * 15;
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

    // Speaking animation
    if (isSpeaking && mouthRef.current) {
      setSpeechTimer(prev => prev + 0.016);
      const speechPhase = speechTimer * 12;
      const mouthOpen = (Math.sin(speechPhase) + 1) * 0.5;
      const mouthWidth = 1 + mouthOpen * 0.3;
      const mouthHeight = 1 + mouthOpen * 0.5;
      
      mouthRef.current.scale.set(mouthWidth, mouthHeight, 1);
      mouthRef.current.position.z = 0.52 + mouthOpen * 0.02;
    } else if (mouthRef.current) {
      mouthRef.current.scale.set(1, 1, 1);
      mouthRef.current.position.z = 0.52;
    }

    // Emotion-based eyebrow positioning
    if (leftEyebrowRef.current && rightEyebrowRef.current) {
      let eyebrowOffset = 0;
      let eyebrowRotation = 0;
      
      switch (emotion) {
        case 'happy':
          eyebrowOffset = 0.02;
          eyebrowRotation = 0.1;
          break;
        case 'focused':
          eyebrowOffset = -0.01;
          eyebrowRotation = -0.05;
          break;
        case 'encouraging':
          eyebrowOffset = 0.01;
          eyebrowRotation = 0.05;
          break;
        default:
          eyebrowOffset = 0;
          eyebrowRotation = 0;
      }
      
      leftEyebrowRef.current.position.y = 0.25 + eyebrowOffset;
      rightEyebrowRef.current.position.y = 0.25 + eyebrowOffset;
      leftEyebrowRef.current.rotation.z = -0.1 + eyebrowRotation;
      rightEyebrowRef.current.rotation.z = 0.1 - eyebrowRotation;
    }
  });

  // Avatar style colors and features
  const getAvatarFeatures = (style: string) => {
    switch (style) {
      case 'professional':
        return {
          skinTone: '#FDBCB4',
          hairColor: '#4A4A4A',
          eyeColor: '#8B4513',
          lipColor: '#CD5C5C',
          clothing: '#1e3a8a'
        };
      case 'tech':
        return {
          skinTone: '#F4C2A1',
          hairColor: '#2D2D2D',
          eyeColor: '#228B22',
          lipColor: '#B22222',
          clothing: '#059669'
        };
      case 'casual':
        return {
          skinTone: '#E8B896',
          hairColor: '#8B4513',
          eyeColor: '#4169E1',
          lipColor: '#DC143C',
          clothing: '#7c3aed'
        };
      default:
        return {
          skinTone: '#FDBCB4',
          hairColor: '#4A4A4A',
          eyeColor: '#8B4513',
          lipColor: '#CD5C5C',
          clothing: '#1e3a8a'
        };
    }
  };

  const features = getAvatarFeatures(avatarStyle);

  return (
    <group ref={headRef} scale={[avatarScale, avatarScale, avatarScale]} position={[0, -0.5, 0]}>
      {/* Neck */}
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.6, 16]} />
        <meshStandardMaterial color={features.skinTone} />
      </mesh>

      {/* Shoulders/Clothing */}
      <mesh position={[0, -1.3, 0]}>
        <cylinderGeometry args={[0.8, 1.2, 0.8, 16]} />
        <meshStandardMaterial color={features.clothing} />
      </mesh>

      {/* Head (more detailed shape) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={features.skinTone} />
      </mesh>

      {/* Forehead highlight */}
      <mesh position={[0, 0.15, 0.45]} scale={[0.3, 0.2, 0.1]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
          color={features.skinTone} 
          transparent 
          opacity={0.3}
        />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 0.25, -0.1]} scale={[1.1, 0.8, 1.1]}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshStandardMaterial color={features.hairColor} />
      </mesh>

      {/* Hair details */}
      <mesh position={[-0.3, 0.3, 0.2]} rotation={[0, 0, 0.3]} scale={[0.15, 0.4, 0.1]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={features.hairColor} />
      </mesh>
      <mesh position={[0.3, 0.3, 0.2]} rotation={[0, 0, -0.3]} scale={[0.15, 0.4, 0.1]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={features.hairColor} />
      </mesh>

      {/* Left Eye */}
      <group position={[-0.15, 0.08, 0.4]}>
        {/* Eye socket */}
        <mesh scale={[1.2, 1, 0.8]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        {/* Iris */}
        <mesh ref={leftEyeRef} position={[0, 0, 0.06]} scale={[0.8, 0.8, 1]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={features.eyeColor} />
        </mesh>
        {/* Pupil */}
        <mesh position={[0, 0, 0.11]} scale={[0.5, 0.5, 1]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Eye highlight */}
        <mesh position={[0.02, 0.02, 0.12]} scale={[0.3, 0.3, 1]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#FFFFFF" transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Right Eye */}
      <group position={[0.15, 0.08, 0.4]}>
        {/* Eye socket */}
        <mesh scale={[1.2, 1, 0.8]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        {/* Iris */}
        <mesh ref={rightEyeRef} position={[0, 0, 0.06]} scale={[0.8, 0.8, 1]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={features.eyeColor} />
        </mesh>
        {/* Pupil */}
        <mesh position={[0, 0, 0.11]} scale={[0.5, 0.5, 1]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Eye highlight */}
        <mesh position={[-0.02, 0.02, 0.12]} scale={[0.3, 0.3, 1]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#FFFFFF" transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Eyebrows */}
      <mesh ref={leftEyebrowRef} position={[-0.15, 0.25, 0.45]} rotation={[0, 0, -0.1]} scale={[0.2, 0.05, 0.05]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={features.hairColor} />
      </mesh>
      <mesh ref={rightEyebrowRef} position={[0.15, 0.25, 0.45]} rotation={[0, 0, 0.1]} scale={[0.2, 0.05, 0.05]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={features.hairColor} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, -0.05, 0.48]} scale={[0.6, 1, 0.8]}>
        <coneGeometry args={[0.06, 0.15, 8]} />
        <meshStandardMaterial color={features.skinTone} />
      </mesh>
      
      {/* Nose bridge */}
      <mesh position={[0, 0.02, 0.46]} scale={[0.4, 0.8, 0.6]}>
        <boxGeometry args={[0.04, 0.1, 0.08]} />
        <meshStandardMaterial color={features.skinTone} />
      </mesh>

      {/* Nostrils */}
      <mesh position={[-0.02, -0.08, 0.5]} scale={[0.3, 0.5, 0.3]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#8B4513" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.02, -0.08, 0.5]} scale={[0.3, 0.5, 0.3]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#8B4513" transparent opacity={0.6} />
      </mesh>

      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, -0.25, 0.52]}>
        <sphereGeometry args={[0.08, 16, 8]} />
        <meshStandardMaterial color={features.lipColor} />
      </mesh>

      {/* Upper lip */}
      <mesh position={[0, -0.22, 0.51]} scale={[1.2, 0.3, 0.8]}>
        <sphereGeometry args={[0.08, 12, 8]} />
        <meshStandardMaterial color={features.lipColor} />
      </mesh>

      {/* Cheeks */}
      <mesh position={[-0.25, -0.1, 0.35]} scale={[0.8, 0.8, 0.6]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial 
          color={features.skinTone} 
          transparent 
          opacity={0.7}
        />
      </mesh>
      <mesh position={[0.25, -0.1, 0.35]} scale={[0.8, 0.8, 0.6]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial 
          color={features.skinTone} 
          transparent 
          opacity={0.7}
        />
      </mesh>

      {/* Chin */}
      <mesh position={[0, -0.4, 0.3]} scale={[0.8, 0.6, 0.8]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={features.skinTone} />
      </mesh>

      {/* Ears */}
      <mesh position={[-0.45, 0, 0.1]} rotation={[0, 0, -0.2]} scale={[0.6, 1, 0.4]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color={features.skinTone} />
      </mesh>
      <mesh position={[0.45, 0, 0.1]} rotation={[0, 0, 0.2]} scale={[0.6, 1, 0.4]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color={features.skinTone} />
      </mesh>

      {/* Glasses for tech style */}
      {avatarStyle === 'tech' && (
        <group>
          <mesh position={[-0.15, 0.08, 0.48]}>
            <torusGeometry args={[0.12, 0.015, 8, 16]} />
            <meshStandardMaterial color="#2D2D2D" />
          </mesh>
          <mesh position={[0.15, 0.08, 0.48]}>
            <torusGeometry args={[0.12, 0.015, 8, 16]} />
            <meshStandardMaterial color="#2D2D2D" />
          </mesh>
          <mesh position={[0, 0.08, 0.48]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.3]} />
            <meshStandardMaterial color="#2D2D2D" />
          </mesh>
        </group>
      )}

      {/* Tie for professional style */}
      {avatarStyle === 'professional' && (
        <mesh position={[0, -1, 0.3]} scale={[0.15, 0.8, 0.02]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#DC143C" />
        </mesh>
      )}
    </group>
  );
}

export default function FaceInterviewer({ 
  isSpeaking, 
  avatarStyle, 
  emotion = 'neutral', 
  className = '' 
}: FaceInterviewerProps) {
  const [currentEmotion, setCurrentEmotion] = useState(emotion);

  useEffect(() => {
    // Change emotion based on speaking state
    if (isSpeaking) {
      setCurrentEmotion('focused');
    } else {
      setCurrentEmotion('encouraging');
    }
  }, [isSpeaking]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        camera={{ 
          position: [0, 0, 3], 
          fov: 50,
          aspect: window.innerWidth / window.innerHeight
        }}
        style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%'
        }}
        shadows
        dpr={[1, 2]}
      >
        {/* Enhanced Lighting for realistic face rendering */}
        <ambientLight intensity={0.4} />
        
        {/* Key light */}
        <directionalLight 
          position={[2, 4, 5]} 
          intensity={1.5} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        {/* Fill light */}
        <directionalLight 
          position={[-2, 2, 3]} 
          intensity={0.8} 
          color="#f0f8ff"
        />
        
        {/* Rim light */}
        <directionalLight 
          position={[0, -2, -3]} 
          intensity={0.6} 
          color="#ffd700"
        />
        
        {/* Face-specific lighting */}
        <pointLight position={[0, 1, 2]} intensity={0.5} color="#ffffff" />
        <spotLight 
          position={[0, 3, 2]} 
          angle={0.6} 
          penumbra={0.5} 
          intensity={0.8}
          target-position={[0, 0, 0]}
        />

        <FaceModel 
          isSpeaking={isSpeaking} 
          avatarStyle={avatarStyle}
          emotion={currentEmotion}
        />

        {/* Ground plane for shadows */}
        <mesh receiveShadow position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial 
            color="#e2e8f0" 
            transparent 
            opacity={0.3}
          />
        </mesh>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={6}
          maxPolarAngle={Math.PI * 0.7}
          minPolarAngle={Math.PI * 0.3}
          autoRotate={false}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.3}
        />
      </Canvas>

      {/* Enhanced status indicator */}
      <div className="absolute bottom-6 right-6">
        <div className={`flex items-center space-x-3 px-5 py-3 rounded-2xl backdrop-blur-lg border transition-all duration-300 shadow-xl ${
          isSpeaking 
            ? 'bg-green-500/25 text-green-200 border-green-400/40 shadow-green-500/25' 
            : 'bg-blue-500/25 text-blue-200 border-blue-400/40 shadow-blue-500/25'
        }`}>
          <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
            isSpeaking 
              ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/60' 
              : 'bg-blue-400 shadow-lg shadow-blue-400/60'
          }`} />
          <span className="text-sm font-semibold">
            {isSpeaking ? 'Speaking' : 'Listening'}
          </span>
          {isSpeaking && (
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-4 bg-green-300 rounded-full animate-pulse"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: '0.6s'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Avatar info panel */}
      <div className="absolute top-6 left-6">
        <div className="bg-white/15 backdrop-blur-lg rounded-xl px-4 py-3 border border-white/25 shadow-xl">
          <div className="text-white text-base font-bold">
            AI Face Interviewer
          </div>
          <div className="text-white/80 text-sm font-medium">
            {avatarStyle.charAt(0).toUpperCase() + avatarStyle.slice(1)} Style • Realistic Expressions
          </div>
          <div className="text-white/60 text-xs mt-1">
            Emotion: {currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}
          </div>
        </div>
      </div>

      {/* Emotion indicator */}
      <div className="absolute top-6 right-6">
        <div className="bg-black/20 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
          <div className="text-white/80 text-xs flex items-center">
            <span className="mr-2">
              {currentEmotion === 'happy' && '😊'}
              {currentEmotion === 'focused' && '🤔'}
              {currentEmotion === 'encouraging' && '😌'}
              {currentEmotion === 'neutral' && '😐'}
            </span>
            {currentEmotion}
          </div>
        </div>
      </div>

      {/* Speaking animation overlay */}
      {isSpeaking && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-2">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-white/40 rounded-full animate-pulse backdrop-blur-sm"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.8s',
                    height: `${20 + Math.random() * 20}px`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Text } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarModelProps {
  isSpeaking: boolean;
  avatarStyle: string;
  audioAnalyzer?: AnalyserNode;
}

function AvatarModel({ isSpeaking, avatarStyle, audioAnalyzer }: AvatarModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const eyesRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [blinkTimer, setBlinkTimer] = useState(0);
  const [mouthMovement, setMouthMovement] = useState(0);
  const { viewport } = useThree();

  // Audio analysis for lip sync
  useEffect(() => {
    if (audioAnalyzer && isSpeaking) {
      const dataArray = new Uint8Array(audioAnalyzer.frequencyBinCount);
      
      const analyzeAudio = () => {
        if (isSpeaking) {
          audioAnalyzer.getByteFrequencyData(dataArray);
          
          // Calculate average volume for mouth movement
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          const normalizedVolume = average / 255;
          
          setMouthMovement(normalizedVolume);
          requestAnimationFrame(analyzeAudio);
        }
      };
      
      analyzeAudio();
    } else {
      setMouthMovement(0);
    }
  }, [audioAnalyzer, isSpeaking]);

  // Calculate responsive scale based on viewport
  const avatarScale = Math.min(viewport.width / 4, viewport.height / 6, 1.5);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
      
      // Subtle rotation when speaking
      if (isSpeaking) {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.03;
      }
    }

    // Head movement
    if (headRef.current) {
      if (isSpeaking) {
        headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 3) * 0.02;
        headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2.5) * 0.025;
      }
    }

    // Mouth animation based on audio or speaking state
    if (mouthRef.current) {
      if (isSpeaking) {
        // Use audio analysis if available, otherwise use sine wave
        const mouthScale = audioAnalyzer 
          ? 1 + (mouthMovement * 0.4)
          : 1 + Math.sin(state.clock.elapsedTime * 8) * 0.15;
        
        mouthRef.current.scale.setScalar(mouthScale);
        mouthRef.current.position.z = 0.45 + (mouthMovement * 0.03);
      } else {
        mouthRef.current.scale.setScalar(1);
        mouthRef.current.position.z = 0.45;
      }
    }

    // Blinking animation
    if (eyesRef.current) {
      setBlinkTimer(prev => prev + 0.016); // ~60fps
      
      if (blinkTimer > 3 + Math.random() * 2) { // Blink every 3-5 seconds
        const blinkPhase = (blinkTimer - 3) * 10;
        if (blinkPhase < 1) {
          eyesRef.current.scale.y = 1 - Math.sin(blinkPhase * Math.PI) * 0.8;
        } else {
          eyesRef.current.scale.y = 1;
          if (blinkPhase > 1.5) {
            setBlinkTimer(0);
          }
        }
      }
    }
  });

  // Avatar style colors
  const getAvatarColors = (style: string) => {
    switch (style) {
      case 'professional':
        return {
          suit: '#1e3a8a', // Navy blue
          skin: '#fbbf24', // Warm skin tone
          hair: '#374151'  // Dark hair
        };
      case 'tech':
        return {
          suit: '#059669', // Tech green
          skin: '#f59e0b', // Slightly different skin tone
          hair: '#6b7280'  // Gray hair
        };
      case 'casual':
        return {
          suit: '#7c3aed', // Purple
          skin: '#fbbf24', // Warm skin tone
          hair: '#92400e'  // Brown hair
        };
      default:
        return {
          suit: '#1e3a8a',
          skin: '#fbbf24',
          hair: '#374151'
        };
    }
  };

  const colors = getAvatarColors(avatarStyle);

  return (
    <group
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={[avatarScale, avatarScale, avatarScale]}
      position={[0, -1, 0]}
    >
      {/* Body/Suit - Extended for full frame */}
      <mesh position={[0, -0.2, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.8, 4, 12]} />
        <meshStandardMaterial color={colors.suit} />
      </mesh>
      
      {/* Shoulders - Wider for better proportions */}
      <mesh position={[-1.3, 0.8, 0]} rotation={[0, 0, -0.2]} castShadow>
        <cylinderGeometry args={[0.25, 0.35, 1.5, 8]} />
        <meshStandardMaterial color={colors.suit} />
      </mesh>
      <mesh position={[1.3, 0.8, 0]} rotation={[0, 0, 0.2]} castShadow>
        <cylinderGeometry args={[0.25, 0.35, 1.5, 8]} />
        <meshStandardMaterial color={colors.suit} />
      </mesh>

      {/* Arms - Extended */}
      <mesh position={[-1.8, 0.2, 0]} rotation={[0, 0, -0.3]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 2, 8]} />
        <meshStandardMaterial color={colors.skin} />
      </mesh>
      <mesh position={[1.8, 0.2, 0]} rotation={[0, 0, 0.3]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 2, 8]} />
        <meshStandardMaterial color={colors.skin} />
      </mesh>

      {/* Hands */}
      <mesh position={[-2.2, -0.8, 0]} castShadow>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={colors.skin} />
      </mesh>
      <mesh position={[2.2, -0.8, 0]} castShadow>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={colors.skin} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.4, 8]} />
        <meshStandardMaterial color={colors.skin} />
      </mesh>
      
      {/* Head - Larger for better visibility */}
      <mesh ref={headRef} position={[0, 2, 0]} castShadow>
        <sphereGeometry args={[0.6, 20, 20]} />
        <meshStandardMaterial color={colors.skin} />
      </mesh>
      
      {/* Hair - Better coverage */}
      <mesh position={[0, 2.4, -0.15]} castShadow>
        <sphereGeometry args={[0.58, 16, 16]} />
        <meshStandardMaterial color={colors.hair} />
      </mesh>
      
      {/* Eyes Group */}
      <group ref={eyesRef} position={[0, 2.05, 0]}>
        {/* Left Eye */}
        <mesh position={[-0.2, 0.08, 0.45]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.2, 0.08, 0.52]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        
        {/* Right Eye */}
        <mesh position={[0.2, 0.08, 0.45]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.2, 0.08, 0.52]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        
        {/* Eyebrows */}
        <mesh position={[-0.2, 0.22, 0.45]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[0.15, 0.03, 0.03]} />
          <meshStandardMaterial color={colors.hair} />
        </mesh>
        <mesh position={[0.2, 0.22, 0.45]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.15, 0.03, 0.03]} />
          <meshStandardMaterial color={colors.hair} />
        </mesh>
      </group>
      
      {/* Nose */}
      <mesh position={[0, 1.9, 0.52]}>
        <coneGeometry args={[0.05, 0.12, 8]} />
        <meshStandardMaterial color={colors.skin} />
      </mesh>
      
      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, 1.75, 0.45]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial 
          color={isSpeaking ? "#dc2626" : "#b91c1c"} 
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Collar */}
      <mesh position={[0, 1.2, 0.3]}>
        <boxGeometry args={[0.8, 0.15, 0.08]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* Tie (for professional style) */}
      {avatarStyle === 'professional' && (
        <mesh position={[0, 0.6, 0.35]}>
          <boxGeometry args={[0.2, 1.2, 0.03]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
      )}
      
      {/* Glasses (for tech style) */}
      {avatarStyle === 'tech' && (
        <group position={[0, 2.05, 0.45]}>
          <mesh position={[-0.2, 0.08, 0.08]}>
            <torusGeometry args={[0.12, 0.015, 8, 16]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
          <mesh position={[0.2, 0.08, 0.08]}>
            <torusGeometry args={[0.12, 0.015, 8, 16]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
          <mesh position={[0, 0.08, 0.08]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.4]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
        </group>
      )}

      {/* Casual accessories */}
      {avatarStyle === 'casual' && (
        <mesh position={[0, 0.8, 0.3]}>
          <boxGeometry args={[0.6, 0.1, 0.05]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
      )}
    </group>
  );
}

interface InterviewerAvatarProps {
  isSpeaking: boolean;
  avatarStyle: string;
  className?: string;
}

export default function InterviewerAvatar({ isSpeaking, avatarStyle, className = '' }: InterviewerAvatarProps) {
  const [audioAnalyzer, setAudioAnalyzer] = useState<AnalyserNode | null>(null);

  // Set up audio analysis for lip sync
  useEffect(() => {
    if (isSpeaking && 'speechSynthesis' in window) {
      try {
        // Create audio context for analysis
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        
        setAudioAnalyzer(analyzer);
        
        return () => {
          audioContext.close();
        };
      } catch (error) {
        console.log('Audio analysis not available:', error);
      }
    }
  }, [isSpeaking]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        camera={{ 
          position: [0, 1, 4], 
          fov: 60,
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
        {/* Enhanced Lighting Setup */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[8, 8, 5]} 
          intensity={1.2} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-8, 8, 8]} intensity={0.4} color="#ffffff" />
        <pointLight position={[8, -4, 6]} intensity={0.3} color="#e0e7ff" />
        <spotLight 
          position={[0, 12, 8]} 
          angle={0.4} 
          penumbra={1} 
          intensity={0.8}
          castShadow
          color="#f8fafc"
        />
        
        {/* Rim lighting for depth */}
        <directionalLight 
          position={[-5, 2, -5]} 
          intensity={0.3} 
          color="#a78bfa"
        />
        
        {/* Avatar Model */}
        <AvatarModel 
          isSpeaking={isSpeaking} 
          avatarStyle={avatarStyle}
          audioAnalyzer={audioAnalyzer || undefined}
        />
        
        {/* Enhanced ground plane for shadows */}
        <mesh receiveShadow position={[0, -3.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial 
            color="#e2e8f0" 
            transparent 
            opacity={0.4}
            roughness={0.8}
          />
        </mesh>
        
        {/* Background elements for depth */}
        <mesh position={[0, 0, -8]}>
          <planeGeometry args={[16, 12]} />
          <meshStandardMaterial 
            color="#1e40af" 
            transparent 
            opacity={0.15}
          />
        </mesh>
        
        {/* Subtle particle effects */}
        {isSpeaking && (
          <group>
            {[...Array(8)].map((_, i) => (
              <mesh 
                key={i}
                position={[
                  (Math.random() - 0.5) * 6,
                  Math.random() * 4 + 1,
                  (Math.random() - 0.5) * 4
                ]}
              >
                <sphereGeometry args={[0.02, 4, 4]} />
                <meshBasicMaterial 
                  color="#60a5fa" 
                  transparent 
                  opacity={0.6}
                />
              </mesh>
            ))}
          </group>
        )}
        
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={8}
          maxPolarAngle={Math.PI * 0.75}
          minPolarAngle={Math.PI * 0.25}
          autoRotate={false}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
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

      {/* Enhanced avatar info panel */}
      <div className="absolute top-6 left-6">
        <div className="bg-white/15 backdrop-blur-lg rounded-xl px-4 py-3 border border-white/25 shadow-xl">
          <div className="text-white text-base font-bold">
            {avatarStyle.charAt(0).toUpperCase() + avatarStyle.slice(1)} Interviewer
          </div>
          <div className="text-white/80 text-sm font-medium">
            AI-Powered • Real-time Lip Sync
          </div>
          <div className="text-white/60 text-xs mt-1">
            Full Frame Display • Interactive 3D
          </div>
        </div>
      </div>

      {/* Enhanced speaking animation overlay */}
      {isSpeaking && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-2">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-12 bg-white/40 rounded-full animate-pulse backdrop-blur-sm"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.8s',
                    height: `${20 + Math.random() * 20}px`
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Lip sync indicator */}
          {audioAnalyzer && (
            <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
              <div className="bg-green-500/20 backdrop-blur-lg rounded-full px-4 py-2 border border-green-400/30">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-200 text-sm font-medium">Lip Sync</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Responsive controls hint */}
      <div className="absolute bottom-6 left-6">
        <div className="bg-black/20 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
          <div className="text-white/80 text-xs">
            Drag to rotate • Scroll to zoom
          </div>
        </div>
      </div>
    </div>
  );
}
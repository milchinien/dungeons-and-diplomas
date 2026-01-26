'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  progress: number; // 0-100
  statusText: string;
}

export default function LoadingScreen({ progress, statusText }: LoadingScreenProps) {
  const [dots, setDots] = useState('');

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        fontFamily: 'Rajdhani, sans-serif'
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontSize: '48px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #00ff88 0%, #00ccff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '40px',
          letterSpacing: '2px'
        }}
      >
        Dungeons & Diplomas
      </h1>

      {/* Progress bar container */}
      <div
        style={{
          width: '400px',
          height: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid rgba(0, 255, 136, 0.2)',
          boxShadow: '0 0 20px rgba(0, 255, 136, 0.1)'
        }}
      >
        {/* Progress bar fill */}
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #00ff88 0%, #00ccff 100%)',
            transition: 'width 0.3s ease-out',
            boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Animated shimmer effect */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              animation: 'shimmer 1.5s infinite'
            }}
          />
        </div>
      </div>

      {/* Progress percentage */}
      <div
        style={{
          marginTop: '16px',
          fontSize: '24px',
          fontWeight: 600,
          color: '#00ff88',
          letterSpacing: '1px'
        }}
      >
        {Math.round(progress)}%
      </div>

      {/* Status text */}
      <div
        style={{
          marginTop: '24px',
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: 400,
          minWidth: '300px',
          textAlign: 'center'
        }}
      >
        {statusText}{dots}
      </div>

      {/* Shimmer animation keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 200%;
          }
        }
      `}</style>
    </div>
  );
}

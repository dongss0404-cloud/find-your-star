import React, { useEffect, useRef } from 'react';

interface CosmicOrbProps {
  isActive: boolean;
  volume: number; // 0 to 1
}

const CosmicOrb: React.FC<CosmicOrbProps> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      if (!ctx || !canvas) return;

      timeRef.current += 0.005; // Slower time for smoother idle animation
      
      // REDUCED FLUCTUATION:
      // Base radius 110, max added 40. 
      const targetRadius = 110 + (volume * 40); 
      
      // 1. Fade out previous frame (Trails) - using destination-out for transparency
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Additive Blending for "Light" effect
      ctx.globalCompositeOperation = 'lighter';

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Soft Pulse for Idle state
      const pulse = Math.sin(timeRef.current) * 5; 
      const currentRadius = Math.max(0, targetRadius + pulse);

      // Gradient setup
      const gradient = ctx.createRadialGradient(centerX, centerY, currentRadius * 0.1, centerX, centerY, currentRadius * 2.0);
      
      if (isActive) {
        // UPDATED: Removed "Deep Nebula Purple" to avoid the large purple blob effect.
        // Now using Crystalline/Starlight tones (Blue/White/Slate).
        gradient.addColorStop(0, 'rgba(210, 230, 255, 0.25)'); // Bright, subtle white/blue core
        gradient.addColorStop(0.25, 'rgba(100, 130, 180, 0.15)'); // Desaturated Steel Blue
        gradient.addColorStop(0.6, 'rgba(40, 60, 90, 0.05)'); // Very faint outer glow
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        // IDLE STATE
        gradient.addColorStop(0, 'rgba(120, 140, 180, 0.08)'); // Very dim cool white
        gradient.addColorStop(0.4, 'rgba(30, 45, 70, 0.02)'); // Fade to background
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = 'source-over';
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, volume]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-10 pointer-events-none"
    />
  );
};

export default CosmicOrb;
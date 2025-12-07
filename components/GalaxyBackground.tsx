import React, { useEffect, useRef } from 'react';

const GalaxyBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    // Configuration
    const STAR_COUNT = 1500;
    const ARM_COUNT = 3; // Number of spiral arms
    const GALAXY_THICKNESS = 100; // Z-axis spread
    const FOV = 600; // Field of view (perspective)

    interface Star {
      x: number;
      y: number;
      z: number;
      baseX: number;
      baseY: number;
      baseZ: number;
      angleOffset: number;
      radius: number;
      speed: number;
      size: number;
      color: string;
      blinkSpeed: number;
      blinkPhase: number;
    }

    const stars: Star[] = [];

    // Initialize Stars in a Spiral Galaxy formation
    for (let i = 0; i < STAR_COUNT; i++) {
      // Distance from center (Gaussian-ish distribution for denser core)
      const dist = Math.random() * Math.random() * 800 + 50; 
      
      // Spiral Angle
      const armIndex = i % ARM_COUNT;
      const spiralAngle = (dist / 1500) * Math.PI * 4; // Winding factor
      const armAngle = (armIndex / ARM_COUNT) * Math.PI * 2;
      const randomness = (Math.random() - 0.5) * 1.5; // Scatter
      
      const finalAngle = spiralAngle + armAngle + randomness;

      const x = Math.cos(finalAngle) * dist;
      const z = Math.sin(finalAngle) * dist;
      const y = (Math.random() - 0.5) * GALAXY_THICKNESS * (1 - dist / 1000); // Thinner at edges

      // Colors: Violet, Blue, Cyan, White
      const colors = [
        'rgba(167, 139, 250,', // Violet
        'rgba(147, 197, 253,', // Blue
        'rgba(103, 232, 249,', // Cyan
        'rgba(255, 255, 255,'  // White
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];

      stars.push({
        x, y, z,
        baseX: x, baseY: y, baseZ: z,
        angleOffset: finalAngle,
        radius: dist,
        speed: 0.0005 + (100 / dist) * 0.0001, // Inner stars orbit faster? Or rigid body? Let's do subtle rotation.
        size: Math.random() * 2,
        color,
        blinkSpeed: 0.02 + Math.random() * 0.05,
        blinkPhase: Math.random() * Math.PI * 2
      });
    }

    let rotationY = 0;

    const animate = () => {
      if (!ctx) return;
      
      // Clear with very slight fade for negligible trails, mostly clear
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#020617'; // Slate 950
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter'; // Additive blending for glow

      rotationY += 0.001; // Constant slow rotation

      // Sort stars by Z-depth so distant ones draw first (better blending)
      // Although with 'lighter' blending order matters less, for opacity it helps.
      
      const cx = width / 2;
      const cy = height / 2;

      stars.forEach(star => {
        // 1. Rotate Coordinate System
        // Rotate around Y axis
        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);
        
        let rx = star.baseX * cosY - star.baseZ * sinY;
        let rz = star.baseX * sinY + star.baseZ * cosY;
        let ry = star.baseY;

        // Add a slight fixed tilt (X-axis rotation) to see the galaxy disc
        const tiltAngle = 0.4; // Radians
        const cosX = Math.cos(tiltAngle);
        const sinX = Math.sin(tiltAngle);
        
        const rz_tilted = rz * cosX - ry * sinX;
        const ry_tilted = rz * sinX + ry * cosX;
        
        rz = rz_tilted;
        ry = ry_tilted;

        // 2. Perspective Projection
        // Offset Z so it's in front of camera
        const zOffset = rz + 800; 
        if (zOffset <= 0) return; // Behind camera

        const scale = FOV / zOffset;
        const x2d = rx * scale + cx;
        const y2d = ry * scale + cy;

        // 3. Draw
        // Blink effect
        star.blinkPhase += star.blinkSpeed;
        const blink = (Math.sin(star.blinkPhase) + 1) / 2; // 0 to 1
        const alpha = Math.min(1, (scale * 1.5) * blink); // Closer = brighter

        if (alpha <= 0.05) return;

        ctx.beginPath();
        ctx.fillStyle = `${star.color} ${alpha})`;
        ctx.arc(x2d, y2d, star.size * scale, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 bg-slate-950"
    />
  );
};

export default GalaxyBackground;

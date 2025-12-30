import React, { useEffect, useRef } from 'react';
import { Renderer } from '@/game/Renderer';
import { Hazard } from '@/types/game';
import { GAME_CONSTANTS } from '@/game/constants';
interface HazardPreviewProps {
  type: string;
  className?: string;
}
export function HazardPreview({ type, className }: HazardPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const animationRef = useRef<number>(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Initialize renderer with small dimensions
    // We don't need the background elements for preview, so we can ignore them
    const renderer = new Renderer(ctx, 100, 100);
    rendererRef.current = renderer;
    // Create a mock hazard based on type
    let shape: Hazard['shape'] = 'circle';
    let width = 0;
    let height = 0;
    let radius = 20;
    let color = '#000';
    let hazardType = type as Hazard['hazardType'];
    // Map type to visual properties (simplified logic from GameEngine)
    if (['log', 'icicle', 'frisbee', 'glitch_square', 'gift', 'candy_cane', 'wrench', 'spanner', 'shampoo_bottle', 'shower_jet'].includes(type)) {
      shape = 'rectangle';
    }
    // Set specific dimensions/colors based on constants
    switch (type) {
      case 'rock': color = GAME_CONSTANTS.COLORS.HAZARD_ROCK; radius = 25; break;
      case 'log': width = 60; height = 20; color = GAME_CONSTANTS.COLORS.HAZARD_LOG; break;
      case 'frog': color = GAME_CONSTANTS.COLORS.HAZARD_FROG; radius = 25; break;
      case 'icicle': width = 15; height = 40; color = GAME_CONSTANTS.COLORS.HAZARD_ICICLE; break;
      case 'snowball': color = GAME_CONSTANTS.COLORS.HAZARD_SNOWBALL; radius = 25; break;
      case 'drone': color = GAME_CONSTANTS.COLORS.HAZARD_DRONE; radius = 20; break;
      case 'frisbee': width = 40; height = 12; color = GAME_CONSTANTS.COLORS.HAZARD_FRISBEE; break;
      case 'glitch_square': width = 30; height = 30; color = GAME_CONSTANTS.COLORS.HAZARD_GLITCH_SQUARE; break;
      case 'pixel_orb': color = GAME_CONSTANTS.COLORS.HAZARD_PIXEL_ORB; radius = 20; break;
      case 'gift': width = 30; height = 30; color = GAME_CONSTANTS.COLORS.HAZARD_GIFT; break;
      case 'ornament': color = GAME_CONSTANTS.COLORS.HAZARD_ORNAMENT; radius = 20; break;
      case 'candy_cane': width = 10; height = 40; color = GAME_CONSTANTS.COLORS.HAZARD_CANDY_CANE; break;
      case 'dodgeball': color = GAME_CONSTANTS.COLORS.HAZARD_DODGEBALL; radius = 25; break;
      case 'wrench': width = 50; height = 15; color = GAME_CONSTANTS.COLORS.HAZARD_WRENCH; break;
      case 'spanner': width = 50; height = 15; color = GAME_CONSTANTS.COLORS.HAZARD_WRENCH; break;
      case 'laser': color = GAME_CONSTANTS.COLORS.HAZARD_LASER_ACTIVE; break;
      case 'soap_bubble': color = GAME_CONSTANTS.COLORS.HAZARD_BUBBLE; radius = 30; break;
      case 'shampoo_bottle': width = 30; height = 60; color = GAME_CONSTANTS.COLORS.HAZARD_SHAMPOO_BOTTLE; break;
      case 'shower_jet': width = 15; height = 80; color = GAME_CONSTANTS.COLORS.HAZARD_SHOWER_JET; break;
      case 'pool_ball_white': color = GAME_CONSTANTS.COLORS.HAZARD_POOL_BALL_WHITE; radius = 25; break;
      case 'pool_ball_red': color = GAME_CONSTANTS.COLORS.HAZARD_POOL_BALL_RED; radius = 25; break;
      case 'pool_ball_yellow': color = GAME_CONSTANTS.COLORS.HAZARD_POOL_BALL_YELLOW; radius = 25; break;
      case 'pocket': radius = GAME_CONSTANTS.BILLIARDS_POCKET_RADIUS || 35; color = '#000'; break;
    }
    const hazard: Hazard = {
      id: 'preview',
      type: 'hazard',
      hazardType,
      shape,
      position: { x: 50, y: 50 },
      velocity: { x: 0, y: 0 },
      radius,
      width,
      height,
      rotation: 0,
      color,
      spawnTimer: 1,
      wobbleOffset: 0,
      aiState: type === 'frog' ? 'idle' : type === 'laser' ? 'active' : undefined,
      laserEndpoints: type === 'laser' ? { start: { x: 10, y: 50 }, end: { x: 90, y: 50 } } : undefined
    };
    const animate = () => {
      if (!ctx || !rendererRef.current) return;
      ctx.clearRect(0, 0, 100, 100);
      // Rotate hazard for preview
      hazard.rotation += 0.02;
      // Special animations
      if (type === 'frog') {
        // Make frog breathe
        const scale = 1 + Math.sin(Date.now() / 200) * 0.1;
        ctx.save();
        ctx.translate(50, 50);
        ctx.scale(scale, scale);
        ctx.translate(-50, -50);
      }
      rendererRef.current.drawHazard(hazard);
      if (type === 'frog') {
        ctx.restore();
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [type]);
  return (
    <canvas
      ref={canvasRef}
      width={100}
      height={100}
      className={className}
    />
  );
}
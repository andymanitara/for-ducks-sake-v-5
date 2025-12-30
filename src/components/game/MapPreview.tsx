import React, { useEffect, useRef } from 'react';
import { Renderer } from '@/game/Renderer';
import { BiomeType } from '@/types/game';
interface MapPreviewProps {
  biome: string;
  className?: string;
}
export function MapPreview({ biome, className }: MapPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const animationRef = useRef<number>(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
        // Initialize renderer with canvas dimensions
        // We use the internal resolution of the canvas
        const renderer = new Renderer(ctx, canvas.width, canvas.height);
        rendererRef.current = renderer;
        const animate = () => {
          if (!ctx || !rendererRef.current) return;
          try {
              // Clear and draw
              rendererRef.current.clear();
              rendererRef.current.drawBackground(biome as BiomeType);
              animationRef.current = requestAnimationFrame(animate);
          } catch (e) {
              console.error("MapPreview render error:", e);
              cancelAnimationFrame(animationRef.current);
          }
        };
        animate();
    } catch (e) {
        console.error("MapPreview init error:", e);
    }
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [biome]);
  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={150}
      className={className}
    />
  );
}
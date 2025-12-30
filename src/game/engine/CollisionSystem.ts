import { Duck, Hazard } from '@/types/game';
import { GAME_CONSTANTS } from '@/game/constants';
export class CollisionSystem {
  public checkCollision(duck: Duck, hazard: Hazard, buffer: number = 0): boolean {
    if (hazard.spawnTimer < 0.2 && hazard.hazardType !== 'laser') return false;
    if (hazard.hazardType === 'laser') {
        if (hazard.aiState !== 'active') return false;
        if (!hazard.laserEndpoints) return false;
        const { start, end } = hazard.laserEndpoints;
        const p = duck.position;
        const l2 = (start.x - end.x)**2 + (start.y - end.y)**2;
        if (l2 === 0) return false;
        let t = ((p.x - start.x) * (end.x - start.x) + (p.y - start.y) * (end.y - start.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projX = start.x + t * (end.x - start.x);
        const projY = start.y + t * (end.y - start.y);
        const distSq = (p.x - projX)**2 + (p.y - projY)**2;
        return distSq < (duck.radius + 10 + buffer)**2;
    }
    if (hazard.shape === 'circle') {
      const dx = duck.position.x - hazard.position.x;
      const dy = duck.position.y - hazard.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < duck.radius + hazard.radius + buffer;
    } else if (hazard.shape === 'rectangle') {
      const dx = duck.position.x - hazard.position.x;
      const dy = duck.position.y - hazard.position.y;
      const cos = Math.cos(-hazard.rotation);
      const sin = Math.sin(-hazard.rotation);
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;
      const halfW = hazard.width / 2;
      const halfH = hazard.height / 2;
      const closestX = Math.max(-halfW, Math.min(halfW, localX));
      const closestY = Math.max(-halfH, Math.min(halfH, localY));
      const distX = localX - closestX;
      const distY = localY - closestY;
      const distanceSquared = distX * distX + distY * distY;
      return distanceSquared < ((duck.radius + buffer) ** 2);
    }
    return false;
  }
  public checkNearMiss(duck: Duck, hazard: Hazard): boolean {
      // Filter out hazards that shouldn't trigger near miss
      if (hazard.spawnTimer < 0.8) return false; // Only mostly visible hazards
      if (hazard.hazardType === 'laser' && hazard.aiState !== 'active') return false;
      if (hazard.hazardType === 'shower_jet') return false; // Non-lethal
      if (hazard.hazardType === 'explosion') return false; // Non-lethal
      if (hazard.hazardType === 'pocket') return false; // Environment
      return this.checkCollision(duck, hazard, GAME_CONSTANTS.NEAR_MISS_BUFFER);
  }
  public checkEnvironmentHazards(duck: Duck, width: number, height: number, biome: string): Hazard | null {
      if (biome !== 'billiards') return null;
      const pocketRadius = GAME_CONSTANTS.BILLIARDS_POCKET_RADIUS;
      const pockets = [
          { x: 0, y: 0 }, { x: width, y: 0 },
          { x: 0, y: height }, { x: width, y: height },
          { x: 0, y: height / 2 }, { x: width, y: height / 2 }
      ];
      for (const p of pockets) {
          const dx = duck.position.x - p.x;
          const dy = duck.position.y - p.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < pocketRadius) {
              return {
                  id: 'pocket',
                  type: 'hazard',
                  hazardType: 'pocket',
                  shape: 'circle',
                  position: { x: p.x, y: p.y },
                  velocity: { x: 0, y: 0 },
                  radius: pocketRadius,
                  width: pocketRadius * 2,
                  height: pocketRadius * 2,
                  rotation: 0,
                  color: '#000000',
                  spawnTimer: 1,
                  wobbleOffset: 0
              };
          }
      }
      return null;
  }
}
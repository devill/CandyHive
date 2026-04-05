import { HexCoord } from '../types';

const DIRECTIONS: [number, number][] = [
  [1, 0], [1, -1], [0, -1],
  [-1, 0], [-1, 1], [0, 1],
];

export function coordKey(q: number, r: number): string {
  return `${q},${r}`;
}

export function parseKey(key: string): HexCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

export function generateHexCoords(radius: number): HexCoord[] {
  const coords: HexCoord[] = [];
  const maxRing = radius - 1;
  for (let q = -maxRing; q <= maxRing; q++) {
    for (let r = -maxRing; r <= maxRing; r++) {
      if (Math.abs(q + r) <= maxRing) {
        coords.push({ q, r });
      }
    }
  }
  return coords;
}

export function getNeighbors(q: number, r: number): HexCoord[] {
  return DIRECTIONS.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
}

export function areAdjacent(a: HexCoord, b: HexCoord): boolean {
  const dq = b.q - a.q;
  const dr = b.r - a.r;
  return DIRECTIONS.some(([dirQ, dirR]) => dq === dirQ && dr === dirR);
}

// Pointy-top hex to pixel
export function hexToPixel(q: number, r: number, size: number): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * ((3 / 2) * r);
  return { x, y };
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;
}

export function distanceFromCenter(q: number, r: number): number {
  return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
}

// Get the hex direction that most closely points from (q,r) toward center (0,0)
export function directionTowardCenter(q: number, r: number): [number, number] | null {
  if (q === 0 && r === 0) return null;

  let bestDir: [number, number] = DIRECTIONS[0];
  let bestDist = Infinity;

  for (const [dq, dr] of DIRECTIONS) {
    const nq = q + dq;
    const nr = r + dr;
    const dist = (Math.abs(nq) + Math.abs(nr) + Math.abs(nq + nr)) / 2;
    if (dist < bestDist) {
      bestDist = dist;
      bestDir = [dq, dr];
    }
  }

  return bestDir;
}

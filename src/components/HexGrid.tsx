import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { HexCoord, GameBoard } from '../types';
import { coordKey, hexToPixel } from '../hex/hexUtils';
import { HEX_SIZE } from '../constants';
import HexCell from './HexCell';

interface HexGridProps {
  board: GameBoard;
  coords: HexCoord[];
  onDragSwap: (fromKey: string, toKey: string) => void;
  animating: boolean;
  animValues: Map<string, {
    x: Animated.Value;
    y: Animated.Value;
    scale: Animated.Value;
    opacity: Animated.Value;
  }>;
}

// Determine which of the 6 hex neighbors the drag direction points toward
function dragToHexDirection(dx: number, dy: number): { dq: number; dr: number } {
  // Angle of the drag
  const angle = Math.atan2(dy, dx);

  // Pointy-top hex directions and their angles:
  // (1,0)  → 0° (right)
  // (0,1)  → 90° + 30° offset ... let's compute from hexToPixel
  // For pointy-top: direction (dq, dr) maps to pixel offset:
  //   dx_px = sqrt(3)*dq + sqrt(3)/2*dr
  //   dy_px = 3/2 * dr
  const sqrt3 = Math.sqrt(3);
  const directions = [
    { dq: 1, dr: 0 },
    { dq: 1, dr: -1 },
    { dq: 0, dr: -1 },
    { dq: -1, dr: 0 },
    { dq: -1, dr: 1 },
    { dq: 0, dr: 1 },
  ];

  let bestDir = directions[0];
  let bestDot = -Infinity;

  for (const dir of directions) {
    // Pixel direction of this hex direction
    const px = sqrt3 * dir.dq + (sqrt3 / 2) * dir.dr;
    const py = (3 / 2) * dir.dr;
    // Dot product (unnormalized is fine for comparison)
    const dot = dx * px + dy * py;
    if (dot > bestDot) {
      bestDot = dot;
      bestDir = dir;
    }
  }

  return bestDir;
}

export default function HexGrid({
  board,
  coords,
  onDragSwap,
  animating,
  animValues,
}: HexGridProps) {
  const positions = useMemo(() => {
    const pos = new Map<string, { x: number; y: number }>();
    for (const { q, r } of coords) {
      pos.set(coordKey(q, r), hexToPixel(q, r, HEX_SIZE));
    }
    return pos;
  }, [coords]);

  // Calculate grid bounds for centering
  const { gridWidth, gridHeight, offsetX, offsetY } = useMemo(() => {
    const allPos = Array.from(positions.values());
    const minX = Math.min(...allPos.map(p => p.x));
    const maxX = Math.max(...allPos.map(p => p.x));
    const minY = Math.min(...allPos.map(p => p.y));
    const maxY = Math.max(...allPos.map(p => p.y));

    const cellWidth = Math.sqrt(3) * HEX_SIZE;
    const cellHeight = 2 * HEX_SIZE;

    return {
      gridWidth: maxX - minX + cellWidth + 8,
      gridHeight: maxY - minY + cellHeight + 8,
      offsetX: -minX + cellWidth / 2 + 4,
      offsetY: -minY + cellHeight / 2 + 4,
    };
  }, [positions]);

  const handleDragRelease = useCallback(
    (key: string, direction: { dx: number; dy: number }) => {
      if (animating) return;

      const coord = coords.find(c => coordKey(c.q, c.r) === key);
      if (!coord) return;

      const hexDir = dragToHexDirection(direction.dx, direction.dy);
      const targetKey = coordKey(coord.q + hexDir.dq, coord.r + hexDir.dr);

      // Check target exists and has an emoji
      if (!board.has(targetKey)) return;
      const targetEmoji = board.get(targetKey);
      const sourceEmoji = board.get(key);
      if (!sourceEmoji || !targetEmoji) return;

      onDragSwap(key, targetKey);
    },
    [board, coords, animating, onDragSwap]
  );

  return (
    <View style={[styles.container, { width: gridWidth, height: gridHeight }]}>
      {coords.map(({ q, r }) => {
        const key = coordKey(q, r);
        const emoji = board.get(key) ?? null;
        const pos = positions.get(key)!;
        const anim = animValues.get(key);

        if (!anim) return null;

        return (
          <HexCell
            key={key}
            emoji={emoji}
            x={pos.x + offsetX}
            y={pos.y + offsetY}
            animX={anim.x}
            animY={anim.y}
            animScale={anim.scale}
            animOpacity={anim.opacity}
            onDragRelease={(dir) => handleDragRelease(key, dir)}
            disabled={animating}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});

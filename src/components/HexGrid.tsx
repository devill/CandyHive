import React from 'react';
import { View, StyleSheet } from 'react-native';
import { HexCoord, GameBoard } from '../types';
import { coordKey, hexToPixel } from '../hex/hexUtils';
import { HEX_SIZE } from '../constants';
import HexCell from './HexCell';

interface HexGridProps {
  board: GameBoard;
  coords: HexCoord[];
  selectedCell: string | null;
  onCellPress: (key: string) => void;
}

export default function HexGrid({ board, coords, selectedCell, onCellPress }: HexGridProps) {
  // Calculate pixel positions and find bounds for centering
  const positions = coords.map(({ q, r }) => {
    const { x, y } = hexToPixel(q, r, HEX_SIZE);
    return { q, r, x, y };
  });

  const minX = Math.min(...positions.map(p => p.x));
  const maxX = Math.max(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const maxY = Math.max(...positions.map(p => p.y));

  const cellWidth = Math.sqrt(3) * HEX_SIZE;
  const cellHeight = 2 * HEX_SIZE;
  const gridWidth = maxX - minX + cellWidth + 8;
  const gridHeight = maxY - minY + cellHeight + 8;

  // Offset so the grid is centered within its container
  const offsetX = -minX + cellWidth / 2 + 4;
  const offsetY = -minY + cellHeight / 2 + 4;

  return (
    <View style={[styles.container, { width: gridWidth, height: gridHeight }]}>
      {positions.map(({ q, r, x, y }) => {
        const key = coordKey(q, r);
        const emoji = board.get(key) ?? null;
        return (
          <HexCell
            key={key}
            emoji={emoji}
            x={x + offsetX}
            y={y + offsetY}
            isSelected={selectedCell === key}
            onPress={() => onCellPress(key)}
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

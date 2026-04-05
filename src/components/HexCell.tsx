import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { HEX_SIZE, COLORS } from '../constants';

interface HexCellProps {
  emoji: string | null;
  x: number;
  y: number;
  isSelected: boolean;
  onPress: () => void;
}

const CELL_WIDTH = Math.sqrt(3) * HEX_SIZE;
const CELL_HEIGHT = 2 * HEX_SIZE;

export default function HexCell({ emoji, x, y, isSelected, onPress }: HexCellProps) {
  if (emoji === null) {
    return (
      <View
        style={[
          styles.cell,
          {
            left: x - CELL_WIDTH / 2,
            top: y - CELL_HEIGHT / 2,
          },
        ]}
      />
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.cell,
        styles.filledCell,
        isSelected && styles.selectedCell,
        {
          left: x - CELL_WIDTH / 2,
          top: y - CELL_HEIGHT / 2,
        },
      ]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    position: 'absolute',
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filledCell: {
    backgroundColor: COLORS.cellBackground,
    borderWidth: 2,
    borderColor: COLORS.cellBorder,
    borderRadius: HEX_SIZE * 0.4,
  },
  selectedCell: {
    borderColor: COLORS.selectedBorder,
    borderWidth: 3,
    backgroundColor: '#1e2a4a',
  },
  emoji: {
    fontSize: HEX_SIZE * 0.9,
    textAlign: 'center',
  },
});

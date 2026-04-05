import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { GameBoard } from '../types';
import { generateHexCoords, coordKey, parseKey, areAdjacent } from '../hex/hexUtils';
import { createBoard, swapCells, processBoard, checkWin } from '../game/gameLogic';
import { HEX_RADIUS, COLORS } from '../constants';
import HexGrid from './HexGrid';

export default function GameScreen() {
  const coords = useMemo(() => generateHexCoords(HEX_RADIUS), []);

  const initBoard = useCallback(() => {
    // Create a board and process any initial matches
    let board = createBoard(coords);
    const result = processBoard(board, coords);
    return result.board;
  }, [coords]);

  const [board, setBoard] = useState<GameBoard>(() => initBoard());
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  const handleNewGame = useCallback(() => {
    setBoard(initBoard());
    setSelectedCell(null);
    setScore(0);
    setMoveCount(0);
    setGameWon(false);
  }, [initBoard]);

  const handleCellPress = useCallback(
    (key: string) => {
      if (gameWon) return;

      const emoji = board.get(key);
      if (!emoji) return; // can't select empty cells

      if (selectedCell === null) {
        setSelectedCell(key);
        return;
      }

      if (selectedCell === key) {
        setSelectedCell(null);
        return;
      }

      // Check if the two cells are adjacent
      const a = parseKey(selectedCell);
      const b = parseKey(key);

      if (!areAdjacent(a, b)) {
        // Not adjacent — select the new cell instead
        setSelectedCell(key);
        return;
      }

      // Perform swap
      const swapped = swapCells(board, selectedCell, key);
      const result = processBoard(swapped, coords);

      setBoard(result.board);
      setScore(prev => prev + result.cleared);
      setMoveCount(prev => prev + 1);
      setSelectedCell(null);

      if (checkWin(result.board)) {
        setGameWon(true);
      }
    },
    [board, selectedCell, gameWon, coords]
  );

  // Count remaining emojis
  const remaining = useMemo(() => {
    let count = 0;
    for (const val of board.values()) {
      if (val !== null) count++;
    }
    return count;
  }, [board]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      bounces={false}
    >
      <Text style={styles.title}>CandyHive</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Score</Text>
          <Text style={styles.statValue}>{score}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Moves</Text>
          <Text style={styles.statValue}>{moveCount}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Left</Text>
          <Text style={styles.statValue}>{remaining}</Text>
        </View>
      </View>

      {gameWon && (
        <View style={styles.winBanner}>
          <Text style={styles.winText}>You cleared the hive!</Text>
        </View>
      )}

      <View style={styles.gridWrapper}>
        <HexGrid
          board={board}
          coords={coords}
          selectedCell={selectedCell}
          onCellPress={handleCellPress}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleNewGame}>
        <Text style={styles.buttonText}>New Game</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Tap two adjacent cells to swap. Match 3+ in a line to clear!
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 40,
    minHeight: '100%',
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.headerText,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.scoreText,
  },
  winBanner: {
    backgroundColor: '#00d4aa22',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  winText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.winText,
  },
  gridWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  button: {
    marginTop: 16,
    backgroundColor: COLORS.buttonBackground,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    marginTop: 16,
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
  },
});

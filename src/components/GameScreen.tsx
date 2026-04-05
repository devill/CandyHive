import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { GameBoard } from '../types';
import { generateHexCoords, coordKey, parseKey, hexToPixel } from '../hex/hexUtils';
import {
  createBoard,
  swapCells,
  processBoard,
  processStep,
  checkWin,
  wouldSwapMatch,
} from '../game/gameLogic';
import { HEX_RADIUS, HEX_SIZE, COLORS, ANIM } from '../constants';
import HexGrid from './HexGrid';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function GameScreen() {
  const coords = useMemo(() => generateHexCoords(HEX_RADIUS), []);

  const initBoard = useCallback(() => {
    let board = createBoard(coords);
    const result = processBoard(board, coords);
    return result.board;
  }, [coords]);

  const [board, setBoard] = useState<GameBoard>(() => initBoard());
  const [score, setScore] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Create animation values for each cell
  const animValues = useMemo(() => {
    const map = new Map<string, {
      x: Animated.Value;
      y: Animated.Value;
      scale: Animated.Value;
      opacity: Animated.Value;
    }>();
    for (const { q, r } of coords) {
      const key = coordKey(q, r);
      map.set(key, {
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
      });
    }
    return map;
  }, [coords]);

  // Reset all animation values to default
  const resetAnimValues = useCallback(() => {
    for (const anim of animValues.values()) {
      anim.x.setValue(0);
      anim.y.setValue(0);
      anim.scale.setValue(1);
      anim.opacity.setValue(1);
    }
  }, [animValues]);

  // Animate two cells swapping positions
  const animateSwap = useCallback(
    (keyA: string, keyB: string): Promise<void> => {
      const posA = hexToPixel(parseKey(keyA).q, parseKey(keyA).r, HEX_SIZE);
      const posB = hexToPixel(parseKey(keyB).q, parseKey(keyB).r, HEX_SIZE);
      const dx = posB.x - posA.x;
      const dy = posB.y - posA.y;

      const animA = animValues.get(keyA)!;
      const animB = animValues.get(keyB)!;

      return new Promise(resolve => {
        Animated.parallel([
          Animated.timing(animA.x, {
            toValue: dx,
            duration: ANIM.swapDuration,
            useNativeDriver: false,
          }),
          Animated.timing(animA.y, {
            toValue: dy,
            duration: ANIM.swapDuration,
            useNativeDriver: false,
          }),
          Animated.timing(animB.x, {
            toValue: -dx,
            duration: ANIM.swapDuration,
            useNativeDriver: false,
          }),
          Animated.timing(animB.y, {
            toValue: -dy,
            duration: ANIM.swapDuration,
            useNativeDriver: false,
          }),
        ]).start(() => {
          animA.x.setValue(0);
          animA.y.setValue(0);
          animB.x.setValue(0);
          animB.y.setValue(0);
          resolve();
        });
      });
    },
    [animValues]
  );

  // Animate matched cells disappearing
  const animateMatchClear = useCallback(
    (matched: Set<string>): Promise<void> => {
      const anims: Animated.CompositeAnimation[] = [];
      for (const key of matched) {
        const anim = animValues.get(key);
        if (anim) {
          anims.push(
            Animated.timing(anim.scale, {
              toValue: 0,
              duration: ANIM.clearDuration,
              useNativeDriver: false,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: ANIM.clearDuration,
              useNativeDriver: false,
            })
          );
        }
      }
      return new Promise(resolve => {
        Animated.parallel(anims).start(() => {
          // Reset after clearing
          for (const key of matched) {
            const anim = animValues.get(key);
            if (anim) {
              anim.scale.setValue(1);
              anim.opacity.setValue(1);
            }
          }
          resolve();
        });
      });
    },
    [animValues]
  );

  // Animate gravity movements
  const animateGravity = useCallback(
    (
      moves: Array<{ from: string; to: string }>,
      boardBeforeGravity: GameBoard
    ): Promise<void> => {
      if (moves.length === 0) return Promise.resolve();

      // For each move, the emoji currently at `from` (before gravity) needs to
      // visually slide to `to`. But we'll render the post-gravity board,
      // so we set initial offsets (from→to reversed) and animate to 0.
      //
      // Actually — we render the pre-gravity board during animation, then swap to post.
      // Simpler: set the post-gravity board first, then animate FROM the old positions.

      // Compute pixel offsets: for each move, the cell at `to` should start
      // at the pixel position of `from` and animate to its own position.
      const anims: Animated.CompositeAnimation[] = [];

      for (const move of moves) {
        const fromCoord = parseKey(move.from);
        const toCoord = parseKey(move.to);
        const fromPos = hexToPixel(fromCoord.q, fromCoord.r, HEX_SIZE);
        const toPos = hexToPixel(toCoord.q, toCoord.r, HEX_SIZE);

        const anim = animValues.get(move.to);
        if (anim) {
          // Start at the "from" position offset
          anim.x.setValue(fromPos.x - toPos.x);
          anim.y.setValue(fromPos.y - toPos.y);

          anims.push(
            Animated.timing(anim.x, {
              toValue: 0,
              duration: ANIM.gravityDuration,
              useNativeDriver: false,
            }),
            Animated.timing(anim.y, {
              toValue: 0,
              duration: ANIM.gravityDuration,
              useNativeDriver: false,
            })
          );
        }
      }

      return new Promise(resolve => {
        Animated.parallel(anims).start(() => resolve());
      });
    },
    [animValues]
  );

  // Animate an invalid swap bouncing back
  const animateBounce = useCallback(
    (keyA: string, keyB: string): Promise<void> => {
      const posA = hexToPixel(parseKey(keyA).q, parseKey(keyA).r, HEX_SIZE);
      const posB = hexToPixel(parseKey(keyB).q, parseKey(keyB).r, HEX_SIZE);
      const dx = (posB.x - posA.x) * 0.3;
      const dy = (posB.y - posA.y) * 0.3;

      const animA = animValues.get(keyA)!;
      const animB = animValues.get(keyB)!;

      return new Promise(resolve => {
        Animated.sequence([
          Animated.parallel([
            Animated.timing(animA.x, {
              toValue: dx,
              duration: ANIM.bounceDuration,
              useNativeDriver: false,
            }),
            Animated.timing(animA.y, {
              toValue: dy,
              duration: ANIM.bounceDuration,
              useNativeDriver: false,
            }),
            Animated.timing(animB.x, {
              toValue: -dx,
              duration: ANIM.bounceDuration,
              useNativeDriver: false,
            }),
            Animated.timing(animB.y, {
              toValue: -dy,
              duration: ANIM.bounceDuration,
              useNativeDriver: false,
            }),
          ]),
          Animated.parallel([
            Animated.timing(animA.x, {
              toValue: 0,
              duration: ANIM.bounceDuration,
              useNativeDriver: false,
            }),
            Animated.timing(animA.y, {
              toValue: 0,
              duration: ANIM.bounceDuration,
              useNativeDriver: false,
            }),
            Animated.timing(animB.x, {
              toValue: 0,
              duration: ANIM.bounceDuration,
              useNativeDriver: false,
            }),
            Animated.timing(animB.y, {
              toValue: 0,
              duration: ANIM.bounceDuration,
              useNativeDriver: false,
            }),
          ]),
        ]).start(() => resolve());
      });
    },
    [animValues]
  );

  const handleDragSwap = useCallback(
    async (fromKey: string, toKey: string) => {
      if (animating || gameWon) return;

      // Check if swap would produce a match
      if (!wouldSwapMatch(board, fromKey, toKey, coords)) {
        // Invalid swap — bounce animation
        setAnimating(true);
        await animateBounce(fromKey, toKey);
        setAnimating(false);
        return;
      }

      setAnimating(true);

      // 1. Animate the swap
      await animateSwap(fromKey, toKey);

      // 2. Apply the swap to the board
      let current = swapCells(board, fromKey, toKey);
      setBoard(new Map(current));

      // 3. Process cascading matches with animations
      let totalCleared = 0;

      while (true) {
        const step = processStep(current, coords);
        if (!step) break;

        // Animate match clear
        await animateMatchClear(step.matched);

        // Update board to cleared state
        current = step.boardAfterClear;
        setBoard(new Map(current));
        totalCleared += step.matched.size;

        // Small pause before gravity
        await sleep(50);

        // Apply gravity board state, then animate
        current = step.boardAfterGravity;
        setBoard(new Map(current));
        await animateGravity(step.gravityMoves, step.boardAfterClear);

        // Small pause before next cascade check
        await sleep(100);
      }

      setScore(prev => prev + totalCleared);
      setMoveCount(prev => prev + 1);

      if (checkWin(current)) {
        setGameWon(true);
      }

      setAnimating(false);
    },
    [
      board,
      coords,
      animating,
      gameWon,
      animateSwap,
      animateMatchClear,
      animateGravity,
      animateBounce,
    ]
  );

  const handleNewGame = useCallback(() => {
    resetAnimValues();
    setBoard(initBoard());
    setScore(0);
    setMoveCount(0);
    setGameWon(false);
    setAnimating(false);
  }, [initBoard, resetAnimValues]);

  const remaining = useMemo(() => {
    let count = 0;
    for (const val of board.values()) {
      if (val !== null) count++;
    }
    return count;
  }, [board]);

  return (
    <ScrollView contentContainerStyle={styles.container} bounces={false}>
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
          onDragSwap={handleDragSwap}
          animating={animating}
          animValues={animValues}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleNewGame}>
        <Text style={styles.buttonText}>New Game</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Drag an emoji toward a neighbor to swap. Match 3+ in a line to clear!
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

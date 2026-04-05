import React, { useRef, useEffect } from 'react';
import {
  Animated,
  PanResponder,
  Text,
  StyleSheet,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { HEX_SIZE } from '../constants';

interface HexCellProps {
  emoji: string | null;
  x: number;
  y: number;
  animX: Animated.Value;
  animY: Animated.Value;
  animScale: Animated.Value;
  animOpacity: Animated.Value;
  onDragRelease: (direction: { dx: number; dy: number }) => void;
  disabled: boolean;
}

const CELL_WIDTH = Math.sqrt(3) * HEX_SIZE;
const CELL_HEIGHT = 2 * HEX_SIZE;
const DRAG_THRESHOLD = 12;

export default function HexCell({
  emoji,
  x,
  y,
  animX,
  animY,
  animScale,
  animOpacity,
  onDragRelease,
  disabled,
}: HexCellProps) {
  const dragOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Keep latest props in refs so the PanResponder closure is never stale
  const callbackRef = useRef(onDragRelease);
  const disabledRef = useRef(disabled);
  const emojiRef = useRef(emoji);

  useEffect(() => { callbackRef.current = onDragRelease; }, [onDragRelease]);
  useEffect(() => { disabledRef.current = disabled; }, [disabled]);
  useEffect(() => { emojiRef.current = emoji; }, [emoji]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current && emojiRef.current !== null,
      onMoveShouldSetPanResponder: () => !disabledRef.current && emojiRef.current !== null,
      onPanResponderMove: (_e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const clampedDx = Math.max(-20, Math.min(20, gestureState.dx));
        const clampedDy = Math.max(-20, Math.min(20, gestureState.dy));
        dragOffset.setValue({ x: clampedDx, y: clampedDy });
      },
      onPanResponderRelease: (_e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        dragOffset.setValue({ x: 0, y: 0 });
        const dist = Math.sqrt(gestureState.dx ** 2 + gestureState.dy ** 2);
        if (dist >= DRAG_THRESHOLD) {
          callbackRef.current({ dx: gestureState.dx, dy: gestureState.dy });
        }
      },
      onPanResponderTerminate: () => {
        dragOffset.setValue({ x: 0, y: 0 });
      },
    })
  ).current;

  if (emoji === null) {
    return null;
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.cell,
        {
          left: x - CELL_WIDTH / 2,
          top: y - CELL_HEIGHT / 2,
          transform: [
            { translateX: Animated.add(animX, dragOffset.x) },
            { translateY: Animated.add(animY, dragOffset.y) },
            { scale: animScale },
          ],
          opacity: animOpacity,
        },
      ]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    position: 'absolute',
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  emoji: {
    fontSize: HEX_SIZE * 0.95,
    textAlign: 'center',
  },
});

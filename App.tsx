import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import GameScreen from './src/components/GameScreen';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Prevent pull-to-refresh and scroll interference on the whole page
      document.body.style.overscrollBehavior = 'none';
      document.body.style.touchAction = 'pan-x pan-y';
      document.documentElement.style.overscrollBehavior = 'none';
    }
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <GameScreen />
    </>
  );
}

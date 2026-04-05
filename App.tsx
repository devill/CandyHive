import { StatusBar } from 'expo-status-bar';
import GameScreen from './src/components/GameScreen';

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <GameScreen />
    </>
  );
}

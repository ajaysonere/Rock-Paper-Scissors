import type { Gesture } from './gestureDetection';

export type GameResult = 'Win' | 'Lose' | 'Draw';

export function getRandomGesture(): Gesture {
  const gestures: Gesture[] = ['rock', 'paper', 'scissors'];
  return gestures[Math.floor(Math.random() * gestures.length)];
}

export function getGameResult(player: Gesture, computer: Gesture): GameResult {
  if (player === computer) return 'Draw';
  if (
    (player === 'rock' && computer === 'scissors') ||
    (player === 'scissors' && computer === 'paper') ||
    (player === 'paper' && computer === 'rock')
  ) {
    return 'Win';
  }
  return 'Lose';
}

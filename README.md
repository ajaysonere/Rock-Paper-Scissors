# Rock–Paper–Scissors AI (Expo)

This is a small Expo + React Native app where you can play Rock–Paper–Scissors against a simple AI using your phone’s camera. Hold up a hand gesture, the app tries to guess it, and the computer immediately plays back.

## What’s inside
- Single-screen flow with a big camera preview and framing hints.
- On-screen confidence meter so you know when the pose is locked in.
- Animated result card and a short history of the last five rounds.
- Gesture detection lives in one module so you can swap in a real model later.

## Getting started
1. Install the packages  
   ```bash
   npm install
   ```
2. Start Expo  
   ```bash
   npm run start
   ```
3. Scan the QR code with Expo Go (Android) or the iOS Camera app.

> You’ll need a real camera feed, so test on a physical device if possible.

## How it works
- The camera view grabs a frame roughly once per second.
- We resize the frame and look at its file size as a lightweight heuristic to guess rock / paper / scissors.
- Two confident detections in a row trigger a round. The computer picks a random move and the UI shows the outcome.

Because all of this logic lives in `utils/gestureDetection.ts`, you can replace the heuristic with MediaPipe, TensorFlow, or any other model without touching the UI.

## Project layout
```
app/(tabs)/index.tsx   Home screen and game flow
components/            Camera, result card, history list
utils/                 Gesture detection + game logic helpers
```

## Handy scripts
- `npm run start` – launch Metro / Expo CLI
- `npm run android` / `npm run ios` – run on a connected device or emulator
- `npm run lint` – lint the project

## Publish to Expo
1. Sign in from the CLI (once per machine):
   ```bash
   npx expo login
   ```
2. Make sure you’re on the correct account/slug (`app.json` uses `rps-ai`).
3. Publish the current bundle:
   ```bash
   npx expo publish
   ```
Expo will host the latest build at a shareable link you can send with your interview submission.

## Things to improve next
- Swap the heuristic detector for real hand landmarks (MediaPipe / TFJS).
- Save match history or streaks to AsyncStorage.
- Add extra modes (timed rounds, best-of series, multiplayer).

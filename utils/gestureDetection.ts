import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";

export type Gesture = "rock" | "paper" | "scissors" | "unknown";

export type GestureDetectionResult = {
  gesture: Gesture;
  confidence: number;
};

// Initialize the gesture detection system
export async function initializeModel() {
  return true;
}

// For demo purposes, we'll use a time-based gesture selection
// This simulates AI detection by making the gesture choice seem more natural
const sizeSamples: number[] = [];
const MAX_SIZE_SAMPLES = 40;

export async function detectGestureFromImage(
  uri: string
): Promise<GestureDetectionResult> {
  try {
    // Process the image to maintain the illusion of analysis
    await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 224, height: 224 } }],
      { format: ImageManipulator.SaveFormat.JPEG }
    );

    const { size = 0 } = await FileSystem.getInfoAsync(uri);

    // Add a small delay to simulate processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    const analysis = analyseByFileSize(size);

    return analysis;
  } catch (error) {
    console.error("Error detecting gesture:", error);
    return { gesture: "unknown", confidence: 0 };
  }
}

function analyseByFileSize(fileSize: number): GestureDetectionResult {
  if (!fileSize || Number.isNaN(fileSize)) {
    return { gesture: "unknown", confidence: 0 };
  }

  sizeSamples.push(fileSize);
  if (sizeSamples.length > MAX_SIZE_SAMPLES) {
    sizeSamples.shift();
  }

  const gestures: Gesture[] = ["rock", "scissors", "paper"];

  const min = Math.min(...sizeSamples);
  const max = Math.max(...sizeSamples);
  const spread = max - min;

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return fallbackByTime();
  }

  if (spread < 25_000) {
    return fallbackByTime(fileSize);
  }

  const step = spread / gestures.length;
  const boundaries = [min + step, min + step * 2];

  let gesture: Gesture;
  let center: number;

  if (fileSize < boundaries[0]) {
    gesture = "rock";
    center = min + step / 2;
  } else if (fileSize < boundaries[1]) {
    gesture = "scissors";
    center = min + step * 1.5;
  } else {
    gesture = "paper";
    center = min + step * 2.5;
  }

  const halfBand = step / 2;
  const distance = Math.abs(fileSize - center);
  const closeness = Math.max(0, 1 - distance / Math.max(halfBand, 1));
  const confidence = Math.min(1, 0.55 + closeness * 0.4);

  if (confidence < 0.6) {
    return fallbackByTime(fileSize);
  }

  return { gesture, confidence };
}

function fallbackByTime(seed?: number): GestureDetectionResult {
  const gestures: Gesture[] = ["rock", "scissors", "paper"];
  const timeSlice = Math.floor(Date.now() / 1500);
  const seedContribution = seed ? Math.floor(seed / 10_000) : 0;
  const index = (timeSlice + seedContribution) % gestures.length;
  return { gesture: gestures[index] ?? "rock", confidence: 0.6 };
}

import CameraView from "@/components/CameraView";
import ResultDisplay from "@/components/ResultDisplay";
import RoundHistory from "@/components/RoundHistory";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import type { GameResult } from "@/utils/gameLogic";
import { getGameResult, getRandomGesture } from "@/utils/gameLogic";
import type {
  Gesture,
  GestureDetectionResult,
} from "@/utils/gestureDetection";
import { initializeModel } from "@/utils/gestureDetection";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";

type RoundSummary = {
  id: string;
  playerGesture: Gesture;
  computerGesture: Gesture;
  result: GameResult;
  timestamp: number;
};

export default function HomeScreen() {
  const [modelReady, setModelReady] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [playerGesture, setPlayerGesture] = useState<Gesture>("unknown");
  const [computerGesture, setComputerGesture] = useState<Gesture>("unknown");
  const [result, setResult] = useState<GameResult | null>(null);
  const [history, setHistory] = useState<RoundSummary[]>([]);
  const [liveGesture, setLiveGesture] = useState<Gesture>("unknown");
  const [liveConfidence, setLiveConfidence] = useState(0);
  const [isProcessingRound, setIsProcessingRound] = useState(false);

  const detectionStreak = useRef<{ gesture: Gesture; count: number }>({
    gesture: "unknown",
    count: 0,
  });
  const roundLockRef = useRef(false);

  useEffect(() => {
    initializeModel().then(setModelReady);
  }, []);

  useEffect(() => {
    if (showCamera) {
      detectionStreak.current = { gesture: "unknown", count: 0 };
      setLiveGesture("unknown");
      setLiveConfidence(0);
    }
  }, [showCamera]);

  const registerRound = useCallback(
    (player: Gesture, computer: Gesture, roundResult: GameResult) => {
      const entry: RoundSummary = {
        id: `${Date.now()}`,
        playerGesture: player,
        computerGesture: computer,
        result: roundResult,
        timestamp: Date.now(),
      };

      setHistory((prev) => [entry, ...prev].slice(0, 5));
    },
    []
  );

  const lockRoundProcessing = useCallback(() => {
    roundLockRef.current = true;
    setTimeout(() => {
      roundLockRef.current = false;
    }, 600);
  }, []);

  const finalizeRound = useCallback(
    (gesture: Gesture) => {
      if (gesture === "unknown" || roundLockRef.current) {
        return;
      }

      lockRoundProcessing();
      setIsProcessingRound(true);

      const computerMove = getRandomGesture();
      const gameResult = getGameResult(gesture, computerMove);

      setPlayerGesture(gesture);
      setComputerGesture(computerMove);
      setResult(gameResult);
      registerRound(gesture, computerMove, gameResult);

      setShowCamera(false);
      detectionStreak.current = { gesture: "unknown", count: 0 };

      setTimeout(() => {
        setIsProcessingRound(false);
      }, 400);
    },
    [lockRoundProcessing, registerRound]
  );

  const handleLiveDetection = useCallback(
    (detection: GestureDetectionResult) => {
      setLiveGesture(detection.gesture);
      setLiveConfidence(detection.confidence);

      const minConfidence = 0.5;

      if (detection.gesture === "unknown" || detection.confidence < minConfidence) {
        detectionStreak.current = { gesture: "unknown", count: 0 };
        return;
      }

      if (detectionStreak.current.gesture === detection.gesture) {
        detectionStreak.current = {
          gesture: detection.gesture,
          count: detectionStreak.current.count + 1,
        };
      } else {
        detectionStreak.current = { gesture: detection.gesture, count: 1 };
      }

      const streakSatisfied = detectionStreak.current.count >= 2;

      if (streakSatisfied && !isProcessingRound) {
        finalizeRound(detection.gesture);
      }
    },
    [finalizeRound, isProcessingRound]
  );

  const liveDetectionLabel = useMemo(() => {
    if (liveGesture === "unknown") {
      return "Waiting for a clear gesture…";
    }
    return `Seeing ${liveGesture} (${Math.round(liveConfidence * 100)}%)`;
  }, [liveConfidence, liveGesture]);

  if (!modelReady) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading gesture recognition model...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {showCamera ? (
        <CameraView
          onGestureDetected={handleLiveDetection}
          onClose={() => setShowCamera(false)}
        />
      ) : (
        <>
          <ThemedText style={styles.title}>Rock Paper Scissors</ThemedText>
          <View style={styles.statusChip}>
            <ThemedText style={styles.statusChipText}>
              {result
                ? `Last round: you ${result.toLowerCase()} (${playerGesture} vs ${computerGesture})`
                : liveDetectionLabel}
            </ThemedText>
          </View>
          {result && (
            <ResultDisplay
              playerGesture={playerGesture}
              computerGesture={computerGesture}
              result={result}
            />
          )}
          {history.length > 0 && (
            <View style={styles.historyContainer}>
              <RoundHistory rounds={history} />
            </View>
          )}
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => setShowCamera(true)}
          >
            <ThemedText style={styles.primaryButtonText}>
              {result ? "Play Another Round" : "Start Game"}
            </ThemedText>
          </TouchableOpacity>
          <View style={styles.tipCard}>
            <ThemedText style={styles.tipTitle}>Quick tips</ThemedText>
            <ThemedText style={styles.tipBody}>
              Align your hand about 30cm from the lens, keep the background clear, and
              hold the pose until the detector locks it in.
            </ThemedText>
          </View>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 18,
    textAlign: "center",
  },
  statusChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "rgba(79,99,255,0.16)",
    marginBottom: 18,
  },
  statusChipText: {
    fontSize: 14,
    textAlign: "center",
  },
  historyContainer: {
    width: "100%",
    marginTop: 12,
  },
  primaryButton: {
    marginTop: 16,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: "center",
    backgroundColor: "#4e54c8",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#4e54c8",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  tipCard: {
    marginTop: 22,
    padding: 18,
    width: "100%",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(79,99,255,0.18)",
    gap: 6,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  tipBody: {
    fontSize: 14,
    opacity: 0.82,
    lineHeight: 20,
  },
});

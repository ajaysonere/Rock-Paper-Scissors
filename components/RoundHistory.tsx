import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { GameResult } from "@/utils/gameLogic";
import type { Gesture } from "@/utils/gestureDetection";

type RoundHistoryItem = {
  id: string;
  timestamp: number;
  playerGesture: Gesture;
  computerGesture: Gesture;
  result: GameResult;
};

type RoundHistoryProps = {
  rounds: RoundHistoryItem[];
};

const gestureEmoji: Record<Gesture, string> = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
  unknown: "❔",
};

const resultColor: Record<GameResult, string> = {
  Win: "#4CAF50",
  Lose: "#FF5252",
  Draw: "#FFC107",
};

export default function RoundHistory({ rounds }: RoundHistoryProps) {
  if (!rounds.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Rounds</Text>
      {rounds.map((round) => (
        <View key={round.id} style={styles.row}>
          <Text style={styles.gesture}>
            {gestureEmoji[round.playerGesture]} vs{" "}
            {gestureEmoji[round.computerGesture]}
          </Text>
          <Text
            style={[
              styles.result,
              { color: resultColor[round.result] ?? "#ffffff" },
            ]}
          >
            {round.result}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 12,
    borderRadius: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  gesture: {
    fontSize: 18,
  },
  result: {
    fontSize: 16,
    fontWeight: "600",
  },
});

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Gesture } from "../utils/gestureDetection";
import type { GameResult } from "../utils/gameLogic";

type ResultDisplayProps = {
  playerGesture: Gesture;
  computerGesture: Gesture;
  result: GameResult;
};

const gestureEmoji: Record<Gesture, string> = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
  unknown: "❔",
};

const themes: Record<
  GameResult,
  { colors: [string, string]; accent: string; headline: string; sub: string }
> = {
  Win: {
    colors: ["#0ba360", "#3cba92"],
    accent: "#cbffdd",
    headline: "You Win!",
    sub: "Crushed it—keep the streak going.",
  },
  Lose: {
    colors: ["#f12711", "#f5af19"],
    accent: "#ffe9d6",
    headline: "You Lost",
    sub: "Shake it off and go again.",
  },
  Draw: {
    colors: ["#8360c3", "#2ebf91"],
    accent: "#f0e9ff",
    headline: "It's a Draw",
    sub: "So close! Rematch?",
  },
};

export default function ResultDisplay({
  playerGesture,
  computerGesture,
  result,
}: ResultDisplayProps) {
  const theme = themes[result];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors[0],
          shadowColor: theme.colors[1],
          borderColor: theme.colors[1],
        },
      ]}
    >
      <Text style={styles.headline}>{theme.headline}</Text>
      <Text style={[styles.subline, { color: theme.accent }]}>{theme.sub}</Text>
      <View style={styles.matchupRow}>
        <GestureBadge label="You" emoji={gestureEmoji[playerGesture]} />
        <Text style={styles.vs}>vs</Text>
        <GestureBadge label="Computer" emoji={gestureEmoji[computerGesture]} />
      </View>
      <View style={styles.detailsRow}>
        <Text style={styles.detailText}>You played {playerGesture}</Text>
        <View style={styles.dot} />
        <Text style={styles.detailText}>CPU played {computerGesture}</Text>
      </View>
    </View>
  );
}

type GestureBadgeProps = {
  emoji: string;
  label: string;
};

function GestureBadge({ emoji, label }: GestureBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeEmoji}>{emoji}</Text>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 26,
    marginVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    gap: 18,
    borderWidth: 1,
  },
  headline: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 1,
  },
  subline: {
    fontSize: 15,
    fontWeight: "600",
    opacity: 0.9,
  },
  matchupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vs: {
    fontSize: 20,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  badge: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  badgeEmoji: {
    fontSize: 38,
    color: "#ffffff",
  },
  badgeLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  detailText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
});

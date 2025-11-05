import "@/utils/expoCameraCompat";
import { Camera, CameraView as ExpoCameraView } from "expo-camera";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ComponentProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { GestureDetectionResult } from "@/utils/gestureDetection";
import { detectGestureFromImage } from "@/utils/gestureDetection";

type CameraViewProps = {
  onGestureDetected: (result: GestureDetectionResult) => void;
  onClose: () => void;
};

export default function CameraView({
  onGestureDetected,
  onClose,
}: CameraViewProps) {
  const cameraRef = useRef<React.ComponentRef<typeof ExpoCameraView> | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front");
  const [lastDetection, setLastDetection] =
    useState<GestureDetectionResult | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const frameInFlightRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [fadeAnim]);

  const detectionLoop = useCallback(async () => {
    const reschedule = (delay: number) => {
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
      detectionTimeoutRef.current = setTimeout(detectionLoop, delay);
    };

    if (!isCameraReady || !cameraRef.current) {
      reschedule(400);
      return;
    }

    if (frameInFlightRef.current) {
      reschedule(200);
      return;
    }

    frameInFlightRef.current = true;
    let nextDelay = 1100;
    try {
      const cameraInstance = cameraRef.current;
      if (!cameraInstance || typeof cameraInstance.takePictureAsync !== "function") {
        nextDelay = 500;
        return;
      }

      const photo = await cameraInstance.takePictureAsync({
        quality: 0.35,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        nextDelay = 500;
        return;
      }

      const detection = await detectGestureFromImage(photo.uri);
      setLastDetection(detection);
      onGestureDetected(detection);
    } catch (error) {
      console.error("Frame detection error", error);
      nextDelay = 900;
    } finally {
      frameInFlightRef.current = false;
      reschedule(nextDelay);
    }
  }, [isCameraReady, onGestureDetected]);

  useEffect(() => {
    if (hasPermission) {
      detectionLoop();
    }
    return () => {
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, [hasPermission, detectionLoop]);

  useEffect(() => {
    return () => {
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsCameraReady(false);
  }, [cameraFacing]);

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        <ExpoCameraView
          style={styles.camera}
          facing={cameraFacing}
          ref={cameraRef}
          onCameraReady={() => setIsCameraReady(true)}
        />
        <View style={styles.topOverlay}>
          <Text style={styles.topOverlayText}>Center your hand inside the frame</Text>
          <Text style={styles.topOverlaySub}>Hold steady for a couple of beats</Text>
        </View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
              borderColor: "#ffffff",
            },
          ]}
        />
        <DetectionOverlay detection={lastDetection} />
      </View>
      <View style={styles.controls}>
        <ControlButton icon="close-outline" label="Close" onPress={onClose} />
        <ControlButton
          icon="camera-reverse-outline"
          label="Flip"
          onPress={() =>
            setCameraFacing((prev) => (prev === "front" ? "back" : "front"))
          }
        />
      </View>
    </View>
  );
}

type DetectionOverlayProps = {
  detection: GestureDetectionResult | null;
};

function DetectionOverlay({ detection }: DetectionOverlayProps) {
  const gestureLabel =
    detection?.gesture && detection.gesture !== "unknown"
      ? detection.gesture.toUpperCase()
      : "Hold steady";
  const confidence = Math.round((detection?.confidence ?? 0) * 100);

  return (
    <View style={styles.overlayContainer}>
      <Text style={styles.overlayTitle}>Live Detection</Text>
      <Text style={styles.overlayGesture}>{gestureLabel}</Text>
      <View style={styles.confidenceBar}>
        <View
          style={[
            styles.confidenceFill,
            { width: `${Math.max(confidence, 8)}%` },
          ]}
        />
      </View>
      <Text style={styles.overlayHint}>
        Confidence {confidence}%. Keep your pose still for a moment.
      </Text>
    </View>
  );
}

type ControlButtonProps = {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
};

function ControlButton({ icon, label, onPress }: ControlButtonProps) {
  return (
    <TouchableOpacity style={styles.controlButton} onPress={onPress}>
      <Ionicons name={icon} size={26} color="#ffffff" />
      <Text style={styles.controlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraWrapper: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: "#05060a",
    marginHorizontal: -18,
    marginBottom: -8,
  },
  camera: {
    flex: 1,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "rgba(8,8,12,0.92)",
    paddingHorizontal: 32,
    paddingVertical: 14,
    gap: 24,
  },
  overlayContainer: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.68)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  overlayTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  overlayGesture: {
    color: "#9CF6B8",
    fontSize: 30,
    fontWeight: "bold",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  confidenceBar: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 10,
  },
  confidenceFill: {
    height: "100%",
    backgroundColor: "#52ffb8",
  },
  overlayHint: {
    color: "#fff",
    textAlign: "center",
    fontSize: 12,
    opacity: 0.8,
  },
  controlButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    gap: 6,
  },
  controlLabel: {
    color: "#fff",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: "11%",
    left: "5%",
    right: "5%",
    bottom: "22%",
    borderWidth: 2,
    borderRadius: 32,
    borderStyle: "dashed",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 32,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  topOverlayText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  topOverlaySub: {
    marginTop: 6,
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
});

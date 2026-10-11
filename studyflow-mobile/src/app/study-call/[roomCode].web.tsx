import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Room, RoomEvent } from "livekit-client";

import {
  endStudyCall,
  startStudyCall,
  StudyCallToken,
} from "../../services/studyCallService";

export default function StudyCallWebScreen() {
  const { roomCode } = useLocalSearchParams<{ roomCode?: string }>();
  const code = String(roomCode ?? "");

  const [call, setCall] = useState<StudyCallToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const roomRef = useRef<Room | null>(null);
  const callRef = useRef<StudyCallToken | null>(null);

  useEffect(() => {
    let mounted = true;
    let activeRoom: Room | null = null;

    async function beginCall() {
      try {
        if (!code) {
          throw new Error("The study room code is missing.");
        }

        const token = await startStudyCall(code);
        if (!mounted) {
          if (token.logId) {
            void endStudyCall(token.logId).catch(() => undefined);
          }
          return;
        }

        callRef.current = token;
        setCall(token);

        const room = new Room();
        activeRoom = room;
        roomRef.current = room;

        room.on(RoomEvent.Connected, () => {
          if (mounted) setConnected(true);
        });

        room.on(RoomEvent.Disconnected, () => {
          if (mounted) setConnected(false);
        });

        await room.connect(token.serverUrl, token.participantToken);

        if (!mounted) {
          await room.disconnect();
          return;
        }

        await room.localParticipant.setMicrophoneEnabled(true);
        if (mounted) setConnected(true);
      } catch (err: unknown) {
        if (activeRoom) {
          await activeRoom.disconnect().catch(() => undefined);
        }
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to start the call. Check your LiveKit configuration and try again."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void beginCall();

    return () => {
      mounted = false;
      if (activeRoom) void activeRoom.disconnect();
      roomRef.current = null;
    };
  }, [code]);

  async function leaveCall() {
    if (ending) return;
    setEnding(true);

    try {
      await roomRef.current?.disconnect();
      const token = callRef.current;
      if (token?.logId) {
        await endStudyCall(token.logId);
      }
    } catch (err) {
      console.warn("Could not finish the study call:", err);
    } finally {
      router.back();
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B8DFF" />
        <Text style={styles.muted}>Connecting to your study room...</Text>
      </View>
    );
  }

  if (error || !call) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Unable to start call</Text>
        <Text style={styles.muted}>
          {error || "The study call could not be initialized."}
        </Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>STUDYFLOW CALL</Text>
        <Text style={styles.title}>Study together</Text>
        <Text style={styles.room}>Room {code}</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>

          <Text style={styles.callTitle}>Group study call</Text>
          <Text style={styles.muted}>
            Keep this room open while studying with your group.
          </Text>

          <View style={styles.status}>
            <View
              style={[
                styles.dot,
                { backgroundColor: connected ? "#49D17D" : "#888A99" },
              ]}
            />
            <Text style={styles.statusText}>
              {connected ? "Connected" : "Connecting"}
            </Text>
          </View>

          <Text style={styles.muted}>
            Microphone: {connected ? "Enabled" : "Not connected"}
          </Text>
        </View>

        <Pressable
          style={[styles.button, ending && styles.disabled]}
          onPress={leaveCall}
          disabled={ending}
        >
          <Text style={styles.buttonText}>
            {ending ? "Leaving..." : "Leave Call"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: "100%",
    backgroundColor: "#11121C",
  },
  center: {
    flex: 1,
    minHeight: 400,
    backgroundColor: "#11121C",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14,
  },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: 24,
    flex: 1,
  },
  eyebrow: {
    color: "#8B8DFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    marginTop: 8,
  },
  room: {
    color: "#A9ABB9",
    fontSize: 12,
    marginTop: 6,
  },
  muted: {
    color: "#A9ABB9",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },
  card: {
    flex: 1,
    minHeight: 300,
    marginTop: 28,
    marginBottom: 20,
    borderRadius: 24,
    backgroundColor: "#1A1B27",
    borderWidth: 1,
    borderColor: "#292B3A",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
  },
  callTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  button: {
    minHeight: 52,
    backgroundColor: "#EF4444",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.6,
  },
});

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getCurrentUser } from "../../services/authService";
import {
  getStudyStatistics,
  StudyStatistics,
} from "../../services/statisticsService";

function formatMinutes(minutes: number): string {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

export default function Statistics() {
  const [statistics, setStatistics] = useState<StudyStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        setError("Please sign in again to view your study statistics.");
        setStatistics(null);
        return;
      }

      const result = await getStudyStatistics();
      setStatistics(result);
      setError(null);
    } catch (loadError) {
      console.error("Failed to load study statistics:", loadError);
      setError("We couldn't load your study data. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  const topSubject = statistics?.subjectStats[0];
  const maxSubjectMinutes = Math.max(
    1,
    ...(statistics?.subjectStats.map((subject) => subject.minutes) ?? [])
  );

  if (loading && !statistics) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#5B5CE2" />
        <Text style={styles.muted}>Loading your progress…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadStatistics();
            }}
            tintColor="#5B5CE2"
            colors={["#5B5CE2"]}
          />
        }
      >
        <Text style={styles.eyebrow}>YOUR PROGRESS</Text>
        <Text style={styles.title}>Study insights</Text>
        <Text style={styles.subtitle}>
          Real progress, calculated from your saved study sessions.
        </Text>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Statistics unavailable</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.totalCard}>
          <View style={styles.totalIcon}>
            <Text style={styles.totalIconText}>✦</Text>
          </View>
          <Text style={styles.totalLabel}>TOTAL STUDY TIME</Text>
          <Text style={styles.totalValue}>
            {statistics ? formatMinutes(statistics.totalStudyMinutes) : "—"}
          </Text>
          <Text style={styles.totalSubtext}>
            {statistics
              ? `${statistics.totalStudySessions} saved study ${statistics.totalStudySessions === 1 ? "session" : "sessions"}`
              : "Your study history will appear here."}
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{statistics?.totalStudySessions ?? "—"}</Text>
            <Text style={styles.cardLabel}>All sessions</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>
              {statistics ? formatMinutes(statistics.weeklyStudyMinutes) : "—"}
            </Text>
            <Text style={styles.cardLabel}>Last 7 days</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>
              {statistics ? formatMinutes(statistics.todayStudyMinutes) : "—"}
            </Text>
            <Text style={styles.cardLabel}>Studied today</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>
              {statistics ? `${statistics.currentStreak} day${statistics.currentStreak === 1 ? "" : "s"}` : "—"}
            </Text>
            <Text style={styles.cardLabel}>Current streak</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your last seven days</Text>
        <View style={styles.activityCard}>
          {statistics?.dailyActivity.some((day) => day.minutes > 0) ? (
            <View style={styles.chart}>
              {statistics.dailyActivity.map((day) => {
                const height = day.minutes > 0
                  ? Math.max(8, (day.minutes / Math.max(1, ...statistics.dailyActivity.map((item) => item.minutes))) * 88)
                  : 4;
                return (
                  <View key={day.key} style={styles.chartColumn}>
                    <Text style={styles.chartMinutes}>
                      {day.minutes > 0 ? formatMinutes(day.minutes) : ""}
                    </Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.bar, { height }]} />
                    </View>
                    <Text style={styles.chartLabel}>{day.label}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.muted}>
              No study time recorded this week yet. Your activity will appear here after your next session.
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Most studied subject</Text>
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>{topSubject?.name || "Your next goal starts here"}</Text>
          <Text style={styles.featureText}>
            {topSubject
              ? `${formatMinutes(topSubject.minutes)} across ${topSubject.sessions} ${topSubject.sessions === 1 ? "session" : "sessions"}`
              : "Start a session linked to a subject to see where your time goes."}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Study time by subject</Text>
        <View style={styles.subjectCard}>
          {!statistics || statistics.subjectStats.length === 0 ? (
            <Text style={styles.muted}>Subject breakdown will appear after you save a study session.</Text>
          ) : (
            statistics.subjectStats.map((subject, index) => (
              <View key={subject.name} style={styles.subjectItem}>
                <View style={styles.row}>
                  <Text style={styles.subjectName} numberOfLines={1}>
                    {index + 1}. {subject.name}
                  </Text>
                  <Text style={styles.subjectTime}>{formatMinutes(subject.minutes)}</Text>
                </View>
                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${Math.min(100, (subject.minutes / maxSubjectMinutes) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.sessionCount}>
                  {subject.sessions} {subject.sessions === 1 ? "session" : "sessions"}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F7FB" },
  content: { padding: 20, paddingBottom: 112, maxWidth: 760, width: "100%", alignSelf: "center" },
  loading: { flex: 1, backgroundColor: "#F6F7FB", alignItems: "center", justifyContent: "center" },
  muted: { color: "#77798A", fontSize: 13, lineHeight: 19 },
  eyebrow: { fontSize: 11, fontWeight: "800", color: "#5B5CE2", letterSpacing: 1.1 },
  title: { fontSize: 30, fontWeight: "800", color: "#191B2D", marginTop: 4 },
  subtitle: { fontSize: 13, color: "#77798A", lineHeight: 19, marginTop: 6, marginBottom: 22 },
  totalCard: { backgroundColor: "#202644", borderRadius: 24, padding: 22, marginBottom: 14 },
  totalIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: "rgba(217,249,157,0.16)", alignItems: "center", justifyContent: "center", marginBottom: 17 },
  totalIconText: { color: "#D9F99D", fontSize: 20, fontWeight: "800" },
  totalLabel: { color: "#BFC4D8", fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  totalValue: { color: "#FFFFFF", fontSize: 34, fontWeight: "800", marginTop: 5 },
  totalSubtext: { color: "#D1D5E5", fontSize: 12, marginTop: 5 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 25 },
  card: { flexGrow: 1, width: "47%", minWidth: 130, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E8E9F1", borderRadius: 17, padding: 16 },
  cardValue: { fontSize: 22, fontWeight: "800", color: "#202238" },
  cardLabel: { fontSize: 11, color: "#77798A", marginTop: 5 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#202238", marginBottom: 11, marginTop: 2 },
  activityCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E8E9F1", borderRadius: 18, padding: 15, marginBottom: 24 },
  chart: { flexDirection: "row", justifyContent: "space-between", gap: 7, minHeight: 125 },
  chartColumn: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  chartMinutes: { color: "#77798A", fontSize: 9, minHeight: 14, marginBottom: 4 },
  barTrack: { height: 90, width: "100%", justifyContent: "flex-end", alignItems: "center", backgroundColor: "#F3F3FF", borderRadius: 8, overflow: "hidden" },
  bar: { width: "62%", borderTopLeftRadius: 7, borderTopRightRadius: 7, backgroundColor: "#7778F0" },
  chartLabel: { color: "#77798A", fontSize: 10, marginTop: 8 },
  featureCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E8E9F1", borderRadius: 18, padding: 17, marginBottom: 24 },
  featureTitle: { fontSize: 17, fontWeight: "800", color: "#202238" },
  featureText: { fontSize: 12, color: "#77798A", lineHeight: 18, marginTop: 5 },
  subjectCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E8E9F1", borderRadius: 18, padding: 16 },
  subjectItem: { marginBottom: 18 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  subjectName: { flex: 1, fontSize: 13, fontWeight: "700", color: "#202238" },
  subjectTime: { fontSize: 12, fontWeight: "800", color: "#5B5CE2" },
  progressBackground: { height: 7, borderRadius: 4, backgroundColor: "#EEEEF5", overflow: "hidden", marginTop: 8 },
  progressBar: { height: "100%", backgroundColor: "#5B5CE2", borderRadius: 4 },
  sessionCount: { fontSize: 10, color: "#8B8FA3", marginTop: 5 },
  errorCard: { backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FED7AA", borderRadius: 16, padding: 14, marginBottom: 16 },
  errorTitle: { color: "#9A3412", fontSize: 13, fontWeight: "800", marginBottom: 4 },
  errorText: { color: "#9A3412", fontSize: 12, lineHeight: 18 },
});

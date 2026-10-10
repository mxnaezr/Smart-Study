import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { getCurrentUser } from "../../services/authService";
import { getStudyStatistics, StudyStatistics } from "../../services/statisticsService";


function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMinutes(minutes: number): string {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const [statisticsData, setStatisticsData] = useState<StudyStatistics | null>(null);
  const [userName, setUserName] = useState("Student");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      const name = user?.name?.trim();
      setUserName(name || "Student");

      if (!user?.id) {
        setError("We couldn't find your signed-in profile. Please sign in again to sync your study data.");
        return;
      }

      const savedStatistics = await getStudyStatistics(user.id);
      setStatisticsData(savedStatistics);
      setHasLoaded(true);
      setError(null);
    } catch (loadError) {
      console.error("Failed to load dashboard statistics:", loadError);
      setError("We couldn't refresh your study data. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard])
  );

  const statistics: StudyStatistics = statisticsData ?? {
    totalStudySessions: 0,
    totalStudyMinutes: 0,
    todayStudyMinutes: 0,
    todaySessions: 0,
    weeklyStudyMinutes: 0,
    weeklySessions: 0,
    currentStreak: 0,
    dailyActivity: [],
    subjectStats: [],
  };

  const firstName = userName.split(/\s+/)[0] || "Student";
  const maxDailyMinutes = Math.max(
    1,
    ...statistics.dailyActivity.map((day) => day.minutes)
  );

  const refresh = () => {
    setRefreshing(true);
    void loadDashboard();
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#5B5CE2"
            colors={["#5B5CE2"]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              }).toUpperCase()}
            </Text>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{firstName} ✨</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
            style={styles.profileButton}
            onPress={() => router.push("/tabs/profile")}
          >
            <Text style={styles.profileLetter}>
              {firstName.charAt(0).toUpperCase() || "S"}
            </Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="cloud-offline-outline" size={20} color="#B45309" />
            <View style={styles.errorCopy}>
              <Text style={styles.errorTitle}>Study data unavailable</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setLoading(true);
                  void loadDashboard();
                }}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={13} color="#D9F99D" />
              <Text style={styles.heroBadgeText}>YOUR STUDY SPACE</Text>
            </View>
            <Ionicons name="sunny-outline" size={27} color="#D9F99D" />
          </View>
          <Text style={styles.heroTitle}>Small steps.{ "\n" }Big progress.</Text>
          <Text style={styles.heroSubtitle}>
            {hasLoaded
              ? `You've studied ${formatMinutes(statistics.todayStudyMinutes)} today. Keep your momentum going.`
              : "Make a little time for your goals today. Your next study session is a great place to start."}
          </Text>
          <Pressable
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={() => router.push("/study-session/create")}
          >
            <Ionicons name="play" size={15} color="#172033" />
            <Text style={styles.primaryButtonText}>Start studying</Text>
            <Ionicons name="arrow-forward" size={17} color="#172033" />
          </Pressable>
          <View pointerEvents="none" style={styles.heroOrb} />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Your progress</Text>
            <Text style={styles.sectionSubtitle}>Built from your saved study sessions</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open detailed statistics"
            onPress={() => router.push("/tabs/statistics")}
            style={styles.viewAllButton}
          >
            <Text style={styles.viewAllText}>Details</Text>
            <Ionicons name="chevron-forward" size={15} color="#5B5CE2" />
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <View style={styles.statIconPrimary}>
              <Ionicons name="time-outline" size={20} color="#5B5CE2" />
            </View>
            <Text style={styles.statValue}>
              {hasLoaded ? formatMinutes(statistics.totalStudyMinutes) : "—"}
            </Text>
            <Text style={styles.statLabel}>Total study time</Text>
            <Text style={styles.statHint}>All sessions</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconSoft}>
              <Ionicons name="book-outline" size={20} color="#0F766E" />
            </View>
            <Text style={styles.statValue}>
              {hasLoaded ? statistics.totalStudySessions : "—"}
            </Text>
            <Text style={styles.statLabel}>Study sessions</Text>
            <Text style={styles.statHint}>Saved in your account</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconSoft}>
              <Ionicons name="calendar-outline" size={20} color="#B45309" />
            </View>
            <Text style={styles.statValue}>
              {hasLoaded ? formatMinutes(statistics.weeklyStudyMinutes) : "—"}
            </Text>
            <Text style={styles.statLabel}>Last 7 days</Text>
            <Text style={styles.statHint}>
              {hasLoaded
                ? `${statistics.weeklySessions} ${statistics.weeklySessions === 1 ? "session" : "sessions"}`
                : "Loading activity"}
            </Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconSoft}>
              <Ionicons name="flash-outline" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.statValue}>
              {hasLoaded ? formatMinutes(statistics.todayStudyMinutes) : "—"}
            </Text>
            <Text style={styles.statLabel}>Studied today</Text>
            <Text style={styles.statHint}>
              {hasLoaded
                ? `${statistics.todaySessions} ${statistics.todaySessions === 1 ? "session" : "sessions"} today`
                : "Loading activity"}
            </Text>
          </View>
        </View>

        <View style={styles.streakBanner}>
          <View style={styles.streakIcon}>
            <Ionicons name="flame" size={20} color="#C2410C" />
          </View>
          <View style={styles.streakCopy}>
            <Text style={styles.streakTitle}>
              {hasLoaded ? `${statistics.currentStreak}-day study streak` : "Build your study streak"}
            </Text>
            <Text style={styles.streakSubtitle}>
              {statistics.currentStreak > 0
                ? "Consistency matters more than long sessions."
                : "A little study time today is a great start."}
            </Text>
          </View>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <View>
              <Text style={styles.activityTitle}>Weekly activity</Text>
              <Text style={styles.activitySubtitle}>Your last seven days</Text>
            </View>
            <View style={styles.weekTotal}>
              <Text style={styles.weekTotalValue}>
                {hasLoaded ? formatMinutes(statistics.weeklyStudyMinutes) : "—"}
              </Text>
              <Text style={styles.weekTotalLabel}>THIS WEEK</Text>
            </View>
          </View>

          {loading && !hasLoaded ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color="#5B5CE2" />
              <Text style={styles.loadingText}>Loading your progress…</Text>
            </View>
          ) : !hasLoaded ? (
            <Text style={styles.emptyActivityText}>
              Your study activity will appear here once your account is connected.
            </Text>
          ) : statistics.totalStudySessions === 0 ? (
            <View style={styles.emptyActivity}>
              <View style={styles.emptyActivityIcon}>
                <Ionicons name="bar-chart-outline" size={23} color="#5B5CE2" />
              </View>
              <Text style={styles.emptyActivityTitle}>Your progress starts here</Text>
              <Text style={styles.emptyActivityText}>
                Complete your first study session and your activity will show up here.
              </Text>
            </View>
          ) : (
            <View style={styles.chart}>
              {statistics.dailyActivity.map((day) => {
                const barHeight =
                  day.minutes > 0
                    ? Math.max(9, (day.minutes / maxDailyMinutes) * 76)
                    : 5;
                const isToday = day.key === dateKey(new Date());

                return (
                  <View key={day.key} style={styles.chartColumn}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight,
                            backgroundColor: isToday ? "#5B5CE2" : "#BFC1FF",
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartLabel, isToday && styles.chartLabelToday]}>
                      {day.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Make it a good study day</Text>
            <Text style={styles.sectionSubtitle}>Everything you need, one tap away</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.featureCard}
          onPress={() => router.push("/tabs/subjects")}
        >
          <View style={[styles.featureIcon, { backgroundColor: "#EDEBFF" }]}>
            <Ionicons name="library-outline" size={22} color="#5B5CE2" />
          </View>
          <View style={styles.featureCopy}>
            <Text style={styles.featureTitle}>Your subjects</Text>
            <Text style={styles.featureSubtitle}>Organize what you're learning</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8B8FA3" />
        </Pressable>

        <View style={styles.quickGrid}>
          <Pressable
            accessibilityRole="button"
            style={styles.quickCard}
            onPress={() => router.push("/tabs/friends")}
          >
            <View style={[styles.quickIcon, { backgroundColor: "#DDF7EF" }]}>
              <Ionicons name="people-outline" size={21} color="#0F766E" />
            </View>
            <Text style={styles.quickTitle}>Study together</Text>
            <Text style={styles.quickSubtitle}>Friends & rooms</Text>
            <Ionicons name="arrow-up-right" size={18} color="#8B8FA3" style={styles.quickArrow} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={styles.quickCard}
            onPress={() => router.push("/ai")}
          >
            <View style={[styles.quickIcon, { backgroundColor: "#FCE7F3" }]}>
              <Ionicons name="sparkles-outline" size={21} color="#BE185D" />
            </View>
            <Text style={styles.quickTitle}>AI study helper</Text>
            <Text style={styles.quickSubtitle}>Get unstuck faster</Text>
            <Ionicons name="arrow-up-right" size={18} color="#8B8FA3" style={styles.quickArrow} />
          </Pressable>
        </View>

        <Text style={styles.footerText}>One focused session at a time. You've got this.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 112,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  headerCopy: {
    flex: 1,
  },
  dateText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.25,
    color: "#8B8FA3",
    marginBottom: 9,
  },
  greeting: {
    color: "#666B80",
    fontSize: 15,
    fontWeight: "500",
  },
  userName: {
    color: "#191B2D",
    fontSize: 29,
    fontWeight: "800",
    letterSpacing: -0.7,
    marginTop: 1,
  },
  profileButton: {
    width: 49,
    height: 49,
    borderRadius: 17,
    backgroundColor: "#E5E7FF",
    borderWidth: 1,
    borderColor: "#D7D9FF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  profileLetter: {
    color: "#4F46E5",
    fontSize: 20,
    fontWeight: "800",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
    borderWidth: 1,
    marginBottom: 16,
  },
  errorCopy: {
    flex: 1,
  },
  errorTitle: {
    color: "#92400E",
    fontWeight: "800",
    fontSize: 13,
  },
  errorText: {
    color: "#92400E",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  retryButton: {
    alignSelf: "flex-start",
    paddingVertical: 7,
    marginTop: 2,
  },
  retryText: {
    color: "#92400E",
    fontWeight: "800",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  heroCard: {
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#202644",
    borderRadius: 26,
    padding: 22,
    marginBottom: 27,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },
  heroBadgeText: {
    color: "#F3F4F6",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.7,
    marginTop: 24,
  },
  heroSubtitle: {
    color: "#D1D5E5",
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 310,
    marginTop: 10,
    marginBottom: 20,
  },
  primaryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#D9F99D",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 13,
    zIndex: 1,
  },
  primaryButtonText: {
    color: "#172033",
    fontSize: 13,
    fontWeight: "800",
  },
  heroOrb: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 28,
    borderColor: "rgba(217,249,157,0.08)",
    right: -88,
    bottom: -90,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  sectionTitle: {
    color: "#202238",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.25,
  },
  sectionSubtitle: {
    color: "#85899D",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 8,
    paddingLeft: 8,
  },
  viewAllText: {
    color: "#5B5CE2",
    fontSize: 12,
    fontWeight: "800",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 11,
    marginBottom: 22,
  },
  statCard: {
    width: "48%",
    flexGrow: 1,
    minWidth: 135,
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    padding: 15,
    borderWidth: 1,
    borderColor: "#EAEBF3",
  },
  statCardPrimary: {
    backgroundColor: "#F0F0FF",
    borderColor: "#DEDEFF",
  },
  statIconPrimary: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  statIconSoft: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: "#F5F6FA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  statValue: {
    color: "#202238",
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statLabel: {
    color: "#4D5269",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },
  statHint: {
    color: "#9397A9",
    fontSize: 10,
    marginTop: 5,
  },
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF7ED",
    borderColor: "#FFEDD5",
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    marginBottom: 22,
  },
  streakIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
  },
  streakCopy: { flex: 1 },
  streakTitle: { color: "#9A3412", fontSize: 14, fontWeight: "800" },
  streakSubtitle: { color: "#9A3412", fontSize: 11, lineHeight: 16, marginTop: 3 },
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EAEBF3",
    marginBottom: 27,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityTitle: {
    color: "#202238",
    fontSize: 15,
    fontWeight: "800",
  },
  activitySubtitle: {
    color: "#8B8FA3",
    fontSize: 11,
    marginTop: 4,
  },
  weekTotal: {
    alignItems: "flex-end",
  },
  weekTotalValue: {
    color: "#5B5CE2",
    fontSize: 17,
    fontWeight: "800",
  },
  weekTotalLabel: {
    color: "#A0A3B3",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 3,
  },
  loadingState: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingVertical: 35,
  },
  loadingText: {
    color: "#85899D",
    fontSize: 12,
  },
  emptyActivity: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 26,
  },
  emptyActivityIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "#F0F0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },
  emptyActivityTitle: {
    color: "#202238",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyActivityText: {
    color: "#85899D",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 6,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 23,
    paddingTop: 2,
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
    gap: 9,
  },
  barTrack: {
    width: 19,
    height: 82,
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "#F5F5FC",
    borderRadius: 10,
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderRadius: 10,
  },
  chartLabel: {
    color: "#A0A3B3",
    fontSize: 9,
    fontWeight: "700",
  },
  chartLabelToday: {
    color: "#5B5CE2",
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "#EAEBF3",
    marginBottom: 12,
  },
  featureIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    color: "#202238",
    fontSize: 13,
    fontWeight: "800",
  },
  featureSubtitle: {
    color: "#85899D",
    fontSize: 11,
    marginTop: 4,
  },
  quickGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickCard: {
    flex: 1,
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAEBF3",
    minHeight: 143,
  },
  quickIcon: {
    width: 41,
    height: 41,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  quickTitle: {
    color: "#202238",
    fontSize: 12,
    fontWeight: "800",
  },
  quickSubtitle: {
    color: "#85899D",
    fontSize: 10,
    marginTop: 5,
  },
  quickArrow: {
    position: "absolute",
    right: 12,
    top: 13,
  },
  footerText: {
    textAlign: "center",
    color: "#A0A3B3",
    fontSize: 11,
    marginTop: 24,
    marginBottom: 4,
  },
});

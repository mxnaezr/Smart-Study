package com.studyflow.controller;

import com.studyflow.entity.StudySession;
import com.studyflow.repository.StudySessionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final StudySessionRepository studySessionRepository;

    public StatisticsController(StudySessionRepository studySessionRepository) {
        this.studySessionRepository = studySessionRepository;
    }

    /**
     * Returns statistics calculated from the signed-in user's saved study sessions.
     * The existing root endpoint is retained for compatibility with older clients.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserStatistics(@PathVariable Long userId) {
        List<StudySession> sessions = studySessionRepository.findByUserId(userId);
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        LocalDate weekStart = today.minusDays(6);

        int totalMinutes = 0;
        int todayMinutes = 0;
        int todaySessions = 0;
        int weeklyMinutes = 0;
        int weeklySessions = 0;

        Map<LocalDate, Integer> minutesByDay = new TreeMap<>();
        Map<String, SubjectTotals> subjectTotals = new HashMap<>();
        Set<LocalDate> activeDays = new HashSet<>();

        for (StudySession session : sessions) {
            int minutes = getSessionMinutes(session);
            totalMinutes += minutes;

            LocalDateTime start = session.getStartTime();
            if (start == null) {
                continue;
            }

            LocalDate sessionDay = start.toLocalDate();
            activeDays.add(sessionDay);

            if (sessionDay.equals(today)) {
                todayMinutes += minutes;
                todaySessions++;
            }

            if (!sessionDay.isBefore(weekStart) && !start.isAfter(now)) {
                weeklyMinutes += minutes;
                weeklySessions++;
                minutesByDay.merge(sessionDay, minutes, Integer::sum);
            }

            String subjectName = session.getSubject() != null
                    && session.getSubject().getName() != null
                    ? session.getSubject().getName()
                    : "Other";
            SubjectTotals subject = subjectTotals.computeIfAbsent(
                    subjectName, name -> new SubjectTotals(name));
            subject.minutes += minutes;
            subject.sessions++;
        }

        List<Map<String, Object>> dailyActivity = new ArrayList<>();
        for (int offset = 6; offset >= 0; offset--) {
            LocalDate day = today.minusDays(offset);
            Map<String, Object> activity = new LinkedHashMap<>();
            activity.put("key", day.toString());
            activity.put("label", day.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.getDefault()));
            activity.put("minutes", minutesByDay.getOrDefault(day, 0));
            dailyActivity.add(activity);
        }

        List<Map<String, Object>> subjects = subjectTotals.values().stream()
                .sorted(Comparator.comparingInt((SubjectTotals subject) -> subject.minutes).reversed())
                .map(subject -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("name", subject.name);
                    item.put("minutes", subject.minutes);
                    item.put("sessions", subject.sessions);
                    return item;
                })
                .toList();

        Map<String, Object> statistics = new LinkedHashMap<>();
        statistics.put("totalStudySessions", sessions.size());
        statistics.put("totalStudyMinutes", totalMinutes);
        statistics.put("todayStudyMinutes", todayMinutes);
        statistics.put("todaySessions", todaySessions);
        statistics.put("weeklyStudyMinutes", weeklyMinutes);
        statistics.put("weeklySessions", weeklySessions);
        statistics.put("currentStreak", calculateCurrentStreak(activeDays, today));
        statistics.put("dailyActivity", dailyActivity);
        statistics.put("subjectStats", subjects);

        return ResponseEntity.ok(statistics);
    }

    private int getSessionMinutes(StudySession session) {
        Integer savedMinutes = session.getDurationMinutes();
        if (savedMinutes != null && savedMinutes > 0) {
            return savedMinutes;
        }

        LocalDateTime start = session.getStartTime();
        LocalDateTime end = session.getEndTime();
        if (start != null && end != null && end.isAfter(start)) {
            return (int) ChronoUnit.MINUTES.between(start, end);
        }

        return 0;
    }

    private int calculateCurrentStreak(Set<LocalDate> activeDays, LocalDate today) {
        LocalDate streakDay = activeDays.contains(today) ? today : today.minusDays(1);
        if (!activeDays.contains(streakDay)) {
            return 0;
        }

        int streak = 0;
        while (activeDays.contains(streakDay)) {
            streak++;
            streakDay = streakDay.minusDays(1);
        }
        return streak;
    }

    private static final class SubjectTotals {
        private final String name;
        private int minutes;
        private int sessions;

        private SubjectTotals(String name) {
            this.name = name;
        }
    }

    @GetMapping
    public ResponseEntity<?> getStatistics() {
        Map<String, Object> statistics = Map.of(
                "totalStudySessions", 0,
                "totalStudyMinutes", 0,
                "completedTasks", 0,
                "currentStreak", 0
        );
        return ResponseEntity.ok(statistics);
    }
}

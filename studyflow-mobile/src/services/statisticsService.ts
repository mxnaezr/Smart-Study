import { apiRequest } from "./api";

export interface DailyStudyActivity {
  key: string;
  label: string;
  minutes: number;
}

export interface SubjectStudyStatistic {
  name: string;
  minutes: number;
  sessions: number;
}

export interface StudyStatistics {
  totalStudySessions: number;
  totalStudyMinutes: number;
  todayStudyMinutes: number;
  todaySessions: number;
  weeklyStudyMinutes: number;
  weeklySessions: number;
  currentStreak: number;
  dailyActivity: DailyStudyActivity[];
  subjectStats: SubjectStudyStatistic[];
}

const toNumber = (value: unknown): number => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

export async function getStudyStatistics(userId: number): Promise<StudyStatistics> {
  const data = await apiRequest(`/api/statistics/user/${userId}`);

  return {
    totalStudySessions: toNumber(data?.totalStudySessions),
    totalStudyMinutes: toNumber(data?.totalStudyMinutes),
    todayStudyMinutes: toNumber(data?.todayStudyMinutes),
    todaySessions: toNumber(data?.todaySessions),
    weeklyStudyMinutes: toNumber(data?.weeklyStudyMinutes),
    weeklySessions: toNumber(data?.weeklySessions),
    currentStreak: toNumber(data?.currentStreak),
    dailyActivity: Array.isArray(data?.dailyActivity)
      ? data.dailyActivity.map((day: any) => ({
          key: String(day.key ?? ""),
          label: String(day.label ?? ""),
          minutes: toNumber(day.minutes),
        }))
      : [],
    subjectStats: Array.isArray(data?.subjectStats)
      ? data.subjectStats.map((subject: any) => ({
          name: String(subject.name ?? "Other"),
          minutes: toNumber(subject.minutes),
          sessions: toNumber(subject.sessions),
        }))
      : [],
  };
}

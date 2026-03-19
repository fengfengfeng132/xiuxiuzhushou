export type MembershipType = "free" | "monthly" | "quarterly" | "yearly";
export type MembershipStatus = "inactive" | "active" | "expired";

export interface UserProfile {
  id: string;
  name: string;
  role: "student" | "parent" | "teacher";
  isDefault?: boolean;
}

export interface PlanTask {
  id: string;
  title: string;
  dueDate: string;
  stars: number;
  done: boolean;
}

export interface LearningPlan {
  id: string;
  profileId: string;
  title: string;
  subject: string;
  frequency: "daily" | "weekly";
  createdAt: string;
  tasks: PlanTask[];
}

export interface TodoItem {
  id: string;
  profileId: string;
  title: string;
  note: string;
  done: boolean;
  createdAt: string;
}

export interface HabitCheckin {
  date: string;
  done: boolean;
}

export interface HabitItem {
  id: string;
  profileId: string;
  name: string;
  stars: number;
  rule: string;
  checkins: HabitCheckin[];
}

export interface ExamSubject {
  id: string;
  profileId: string;
  name: string;
  maxScore: number;
}

export interface ExamRecord {
  id: string;
  profileId: string;
  subjectId: string;
  score: number;
  examDate: string;
  note: string;
}

export interface WeaknessItem {
  id: string;
  profileId: string;
  subject: string;
  point: string;
  reason: string;
  wrongCount: number;
  updatedAt: string;
}

export interface RewardWish {
  id: string;
  profileId: string;
  title: string;
  cost: number;
  redeemedCount: number;
}

export interface StarTransaction {
  id: string;
  profileId: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface MembershipInfo {
  status: MembershipStatus;
  type: MembershipType;
  expiresAt: string | null;
}

export interface ChildModeConfig {
  enabled: boolean;
  password: string;
  disabledFeatures: string[];
}

export interface SystemSettings {
  dailyGoalMinutes: number;
  soundEnabled: boolean;
}

export interface AppState {
  version: string;
  profiles: UserProfile[];
  activeProfileId: string;
  plans: LearningPlan[];
  todos: TodoItem[];
  habits: HabitItem[];
  examSubjects: ExamSubject[];
  examRecords: ExamRecord[];
  weaknesses: WeaknessItem[];
  rewards: RewardWish[];
  starTransactions: StarTransaction[];
  membership: MembershipInfo;
  childMode: ChildModeConfig;
  settings: SystemSettings;
  accountPassword: string;
}

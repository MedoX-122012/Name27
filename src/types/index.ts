export type Severity = 'MILD' | 'MEDIUM' | 'SEVERE' | 'EXTREME';
export const severityPoints: Record<Severity, number> = { MILD: 1, MEDIUM: 2, SEVERE: 4, EXTREME: 7 };
export const severityTimeout: Record<Severity, number> = { MILD: 60_000, MEDIUM: 300_000, SEVERE: 1_800_000, EXTREME: 7_200_000 };
export const severityColor: Record<Severity, number> = { MILD: 0xF1C40F, MEDIUM: 0xE67E22, SEVERE: 0xE74C3C, EXTREME: 0x8E44AD };
export const severityArabic: Record<Severity, string> = { MILD: 'بسيط', MEDIUM: 'متوسط', SEVERE: 'شديد', EXTREME: 'خطر جداً' };
export interface DetectionResult { word: string; severity: Severity; matched: string; }
export interface EscalationConfig { pointsThreshold: number; timeoutMs: number; }
export const defaultEscalation: EscalationConfig[] = [
  { pointsThreshold: 1, timeoutMs: 60_000 },
  { pointsThreshold: 3, timeoutMs: 300_000 },
  { pointsThreshold: 6, timeoutMs: 900_000 },
  { pointsThreshold: 10, timeoutMs: 1_800_000 },
  { pointsThreshold: 15, timeoutMs: 3_600_000 },
  { pointsThreshold: 22, timeoutMs: 21_600_000 },
  { pointsThreshold: 30, timeoutMs: 86_400_000 },
];
export function getEscalationTimeout(points: number, table = defaultEscalation): number {
  let t = table[0].timeoutMs;
  for (const r of table) if (points >= r.pointsThreshold) t = r.timeoutMs; else break;
  return t;
}
export interface SpamState { timestamps: number[]; lastContent: string; repeatCount: number; }

export const DEFAULT_TIMEOUTS = { MILD: 60_000, MEDIUM: 300_000, SEVERE: 1_800_000, EXTREME: 7_200_000 };
export const WARN_EXPIRE_DAYS = 30;
export const SPAM_CONFIG = { windowMs: 5000, maxMessages: 5, repeatThreshold: 3, capsThreshold: 0.7, emojiThreshold: 8 };
export const MENTION_LIMIT = 5;
export const CACHE_TTL_MS = 60_000;
export const USER_MESSAGE = `⚠️ تم حذف رسالتك

السبب: استخدام ألفاظ غير مسموحة.

تم تسجيل Warn تلقائي.
العقوبة: Timeout لمدة {duration}.

يرجى الالتزام بقوانين السيرفر.`;

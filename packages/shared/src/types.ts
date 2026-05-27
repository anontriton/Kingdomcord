export type Snowflake = string;

export interface KpConfig {
  /** KP awarded for reacting to the daily verse (default: 5) */
  reactionAmount: number;
  /** KP awarded for a correct trivia answer (default: 10) */
  triviaAmount: number;
  /** KP awarded for submitting a reflection response (default: 8) */
  reflectionAmount: number;
  /** Streak bonus multiplier applied at 7-day and 30-day streaks (default: 1.5) */
  streakBonusMultiplier: number;
}

export interface GuildConfig {
  timezone: string;
  bibleId?: string;
  kp: KpConfig;
  channels: {
    dailyWord?: Snowflake;
    store?: Snowflake;
    leaderboard?: Snowflake;
    bibleStudyNotes?: Snowflake;
  };
  season: {
    lengthDays: number;
    resetDate?: string;
  };
}

export type RewardType = 'TITLE' | 'BADGE' | 'EMOJI' | 'BOOST' | 'ROLE';

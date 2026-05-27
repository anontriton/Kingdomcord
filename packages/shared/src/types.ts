export type Snowflake = string;

export interface GuildConfig {
  timezone: string;
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

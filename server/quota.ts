export interface QuotaState {
  date: string; // YYYY-MM-DD
  userId: string;
  picsUsed: number;
  picsLimit: number; // 10
  videosUsed: number;
  videosLimit: number; // 5
  picsRemaining: number;
  videosRemaining: number;
  resetAt: string;
}

interface UserUsage {
  date: string;
  picsUsed: number;
  videosUsed: number;
}

class DailyQuotaManager {
  private picsLimit = 10;
  private videosLimit = 5;
  private userQuotas = new Map<string, UserUsage>();

  private getTodayDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  private getNextResetIso(): string {
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    return tomorrow.toISOString();
  }

  private getUserUsage(userId: string = 'default'): UserUsage {
    const today = this.getTodayDateString();
    let usage = this.userQuotas.get(userId);
    if (!usage || usage.date !== today) {
      usage = { date: today, picsUsed: 0, videosUsed: 0 };
      this.userQuotas.set(userId, usage);
    }
    return usage;
  }

  public getQuota(userId: string = 'default'): QuotaState {
    const usage = this.getUserUsage(userId);
    return {
      date: usage.date,
      userId,
      picsUsed: usage.picsUsed,
      picsLimit: this.picsLimit,
      videosUsed: usage.videosUsed,
      videosLimit: this.videosLimit,
      picsRemaining: Math.max(0, this.picsLimit - usage.picsUsed),
      videosRemaining: Math.max(0, this.videosLimit - usage.videosUsed),
      resetAt: this.getNextResetIso(),
    };
  }

  public consumePic(userId: string = 'default'): { success: boolean; quota: QuotaState; error?: string } {
    const usage = this.getUserUsage(userId);
    if (usage.picsUsed >= this.picsLimit) {
      return {
        success: false,
        quota: this.getQuota(userId),
        error: `Daily image generation limit of ${this.picsLimit} photos reached. Resets at midnight UTC.`
      };
    }
    usage.picsUsed += 1;
    return {
      success: true,
      quota: this.getQuota(userId)
    };
  }

  public consumeVideo(userId: string = 'default'): { success: boolean; quota: QuotaState; error?: string } {
    const usage = this.getUserUsage(userId);
    if (usage.videosUsed >= this.videosLimit) {
      return {
        success: false,
        quota: this.getQuota(userId),
        error: `Daily video generation limit of ${this.videosLimit} videos reached. Resets at midnight UTC.`
      };
    }
    usage.videosUsed += 1;
    return {
      success: true,
      quota: this.getQuota(userId)
    };
  }

  public resetQuota(userId: string = 'default'): QuotaState {
    const today = this.getTodayDateString();
    this.userQuotas.set(userId, { date: today, picsUsed: 0, videosUsed: 0 });
    return this.getQuota(userId);
  }
}

export const dailyQuotaManager = new DailyQuotaManager();

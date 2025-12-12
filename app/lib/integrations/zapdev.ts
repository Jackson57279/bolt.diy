/**
 * Zapdev Integration for Agent Notifications
 * Handles notifications and communications for agent improvements
 */

export interface ZapdevConfig {
  webhookUrl?: string;
  apiKey?: string;
  channels: {
    improvements: string;
    audit: string;
    research: string;
  };
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: 'improvement' | 'audit' | 'research' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
  timestamp: number;
}

export class ZapdevIntegration {
  private config: ZapdevConfig;

  constructor(config: ZapdevConfig) {
    this.config = config;
  }

  /**
   * Send notification to improvement channel
   */
  async notifyImprovement(payload: Omit<NotificationPayload, 'type'>): Promise<void> {
    await this.sendNotification({
      ...payload,
      type: 'improvement',
    }, this.config.channels.improvements);
  }

  /**
   * Send notification to audit channel
   */
  async notifyAudit(payload: Omit<NotificationPayload, 'type'>): Promise<void> {
    await this.sendNotification({
      ...payload,
      type: 'audit',
    }, this.config.channels.audit);
  }

  /**
   * Send notification to research channel
   */
  async notifyResearch(payload: Omit<NotificationPayload, 'type'>): Promise<void> {
    await this.sendNotification({
      ...payload,
      type: 'research',
    }, this.config.channels.research);
  }

  /**
   * Send urgent alert to all channels
   */
  async sendAlert(payload: Omit<NotificationPayload, 'type' | 'priority'>): Promise<void> {
    const alertPayload: NotificationPayload = {
      ...payload,
      type: 'alert',
      priority: 'urgent',
    };

    await Promise.all([
      this.sendNotification(alertPayload, this.config.channels.improvements),
      this.sendNotification(alertPayload, this.config.channels.audit),
      this.sendNotification(alertPayload, this.config.channels.research),
    ]);
  }

  /**
   * Send notification to specific channel
   */
  private async sendNotification(payload: NotificationPayload, channel: string): Promise<void> {
    try {
      const message = this.formatMessage(payload);

      if (this.config.webhookUrl) {
        await this.sendWebhook(message, channel);
      } else {
        // Fallback to console logging for development
        console.log(`[Zapdev:${channel}] ${message}`);
      }
    } catch (error) {
      console.error('Failed to send Zapdev notification:', error);
    }
  }

  /**
   * Format notification message
   */
  private formatMessage(payload: NotificationPayload): string {
    const priorityEmoji = {
      low: '📝',
      medium: '📋',
      high: '⚡',
      urgent: '🚨',
    };

    const typeEmoji = {
      improvement: '✨',
      audit: '🔍',
      research: '🧪',
      alert: '🚨',
    };

    let message = `${priorityEmoji[payload.priority]} ${typeEmoji[payload.type]} **${payload.title}**\n\n`;
    message += `${payload.message}\n\n`;

    if (payload.metadata) {
      message += `**Details:**\n`;
      Object.entries(payload.metadata).forEach(([key, value]) => {
        message += `• ${key}: ${value}\n`;
      });
    }

    message += `\n_Timestamp: ${new Date(payload.timestamp).toISOString()}_`;

    return message;
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(message: string, channel: string): Promise<void> {
    const response = await fetch(this.config.webhookUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify({
        channel,
        message,
        source: 'bolt-agent-improvements',
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  }
}

// Global Zapdev instance
let zapdevInstance: ZapdevIntegration | null = null;

/**
 * Initialize Zapdev integration
 */
export function initializeZapdev(config: ZapdevConfig): ZapdevIntegration {
  zapdevInstance = new ZapdevIntegration(config);
  return zapdevInstance;
}

/**
 * Get Zapdev instance
 */
export function getZapdev(): ZapdevIntegration {
  if (!zapdevInstance) {
    // Initialize with default config for development
    zapdevInstance = new ZapdevIntegration({
      channels: {
        improvements: 'agent-improvements',
        audit: 'agent-audit',
        research: 'agent-research',
      },
    });
  }
  return zapdevInstance;
}

/**
 * Quick notification helpers
 */
export const zapdev = {
  improvement: (title: string, message: string, metadata?: Record<string, any>) =>
    getZapdev().notifyImprovement({
      title,
      message,
      priority: 'medium',
      metadata,
      timestamp: Date.now(),
    }),

  audit: (title: string, message: string, metadata?: Record<string, any>) =>
    getZapdev().notifyAudit({
      title,
      message,
      priority: 'high',
      metadata,
      timestamp: Date.now(),
    }),

  research: (title: string, message: string, metadata?: Record<string, any>) =>
    getZapdev().notifyResearch({
      title,
      message,
      priority: 'low',
      metadata,
      timestamp: Date.now(),
    }),

  alert: (title: string, message: string, metadata?: Record<string, any>) =>
    getZapdev().sendAlert({
      title,
      message,
      metadata,
      timestamp: Date.now(),
    }),
};
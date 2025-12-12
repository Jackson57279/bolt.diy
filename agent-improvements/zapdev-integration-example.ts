/**
 * Zapdev Integration Example
 * Demonstrates how to use @Zapdev for agent improvement notifications
 */

import { initializeZapdev, zapdev } from '../app/lib/integrations/zapdev';

// Initialize Zapdev with your configuration
const zapdevConfig = {
  webhookUrl: process.env.ZAPDEV_WEBHOOK_URL,
  apiKey: process.env.ZAPDEV_API_KEY,
  channels: {
    improvements: 'bolt-agent-improvements',
    audit: 'bolt-agent-audit',
    research: 'bolt-agent-research',
  },
};

// Initialize the integration
const zapdevClient = initializeZapdev(zapdevConfig);

/**
 * Example usage in agent improvement workflow
 */
export class AgentImprovementsNotifier {
  /**
   * Notify about new agent capability
   */
  async notifyNewCapability(capability: {
    name: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    implementation: string;
  }): Promise<void> {
    await zapdev.improvement(
      `New Agent Capability: ${capability.name}`,
      `Added ${capability.name} to enhance agent capabilities.\n\n${capability.description}`,
      {
        impact: capability.impact,
        implementation: capability.implementation,
        category: 'capability-enhancement',
      }
    );
  }

  /**
   * Notify about performance improvement
   */
  async notifyPerformanceImprovement(improvement: {
    metric: string;
    before: number;
    after: number;
    percentage: number;
  }): Promise<void> {
    await zapdev.audit(
      `Performance Improvement: ${improvement.metric}`,
      `Improved ${improvement.metric} from ${improvement.before} to ${improvement.after} (${improvement.percentage}% improvement)`,
      {
        metric: improvement.metric,
        improvement: `${improvement.percentage}%`,
        category: 'performance-optimization',
      }
    );
  }

  /**
   * Notify about research findings
   */
  async notifyResearchFinding(finding: {
    topic: string;
    insight: string;
    source: string;
    confidence: 'low' | 'medium' | 'high';
  }): Promise<void> {
    await zapdev.research(
      `Research Insight: ${finding.topic}`,
      finding.insight,
      {
        source: finding.source,
        confidence: finding.confidence,
        category: 'competitor-analysis',
      }
    );
  }

  /**
   * Notify about critical issues
   */
  async notifyCriticalIssue(issue: {
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium';
    affected: string[];
  }): Promise<void> {
    await zapdev.alert(
      `🚨 ${issue.title}`,
      `${issue.description}\n\nAffected areas: ${issue.affected.join(', ')}`,
      {
        severity: issue.severity,
        affected: issue.affected,
        requires_immediate_attention: true,
      }
    );
  }
}

/**
 * Integration with Agent Orchestrator
 * Automatically notify about agent activities
 */
export class AgentActivityMonitor {
  private notifier = new AgentImprovementsNotifier();

  async onAgentTaskCompleted(task: {
    id: string;
    type: string;
    description: string;
    duration: number;
    success: boolean;
  }): Promise<void> {
    if (task.success) {
      await this.notifier.notifyPerformanceImprovement({
        metric: `Task Completion Time (${task.type})`,
        before: 10000, // baseline in ms
        after: task.duration,
        percentage: Math.round((1 - task.duration / 10000) * 100),
      });
    } else {
      await this.notifier.notifyCriticalIssue({
        title: `Agent Task Failed: ${task.description}`,
        description: `Task ${task.id} failed after ${task.duration}ms`,
        severity: 'high',
        affected: ['agent-reliability', 'user-experience'],
      });
    }
  }

  async onNewFeatureImplemented(feature: {
    name: string;
    description: string;
    userBenefit: string;
  }): Promise<void> {
    await this.notifier.notifyNewCapability({
      name: feature.name,
      description: feature.description,
      impact: 'high',
      implementation: 'Automated via agent orchestrator',
    });
  }
}

/**
 * Usage Examples
 */

// Initialize the monitor
const monitor = new AgentActivityMonitor();

// Example: Notify about a new agent capability
await monitor.onNewFeatureImplemented({
  name: 'Smart Context Pruning',
  description: 'Automatically optimizes conversation context to improve response times',
  userBenefit: 'Faster responses and better context retention',
});

// Example: Notify about performance improvement
await monitor.onAgentTaskCompleted({
  id: 'task-123',
  type: 'reasoning',
  description: 'Analyze user requirements',
  duration: 2500,
  success: true,
});

// Example: Notify about research finding
const researchNotifier = new AgentImprovementsNotifier();
await researchNotifier.notifyResearchFinding({
  topic: 'User Engagement Patterns',
  insight: 'Users prefer agents with personality over pure functionality by 3:1 ratio',
  source: 'User behavior analytics',
  confidence: 'high',
});

/**
 * Environment Variables Required:
 *
 * ZAPDEV_WEBHOOK_URL=https://your-zapdev-webhook-url
 * ZAPDEV_API_KEY=your-api-key
 *
 * Or omit for console logging in development
 */
import { Automation, AutomationTrigger, AutomationAction } from './types';

export class AutomationBuilder {
  static create(name: string, trigger: AutomationTrigger, action: AutomationAction): Automation {
    return {
      id: `a-${Date.now()}`,
      name,
      trigger,
      action,
      enabled: true
    };
  }
}

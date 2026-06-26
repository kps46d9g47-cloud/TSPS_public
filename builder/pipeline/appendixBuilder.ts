import type { PublicationPlan } from '../publication';
import type { AppendixEntry } from './types';

export class AppendixBuilder {
  buildSourceAppendix(plan: PublicationPlan): AppendixEntry[] {
    return plan.sections
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((section) => ({
        id: `appendix-${section.sourceEntityId}`,
        title: section.title,
        sourcePath: section.sourcePath,
        sourceEntityId: section.sourceEntityId,
      }));
  }
}

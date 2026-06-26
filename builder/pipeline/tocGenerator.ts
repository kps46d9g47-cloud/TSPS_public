import type { PublicationPlan } from '../publication';
import type { TOCEntry } from './types';

export class TOCGenerator {
  generate(plan: PublicationPlan): TOCEntry[] {
    return plan.sections
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((section) => ({
        level: 1,
        title: section.title,
        sectionId: section.id,
        order: section.order,
      }));
  }
}

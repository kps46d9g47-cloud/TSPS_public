import type { PublicationPlan, PublicationQAItem, PublicationQAReport } from './types';

export class QABuilder {
  validatePublicationPlan(plan: PublicationPlan): PublicationQAReport {
    const items: PublicationQAItem[] = [];
    const seenSectionIds = new Set<string>();
    const seenEntityIds = new Set<string>();

    for (const section of plan.sections) {
      if (seenSectionIds.has(section.id)) {
        items.push({ severity: 'error', code: 'DUPLICATE_SECTION_ID', message: `Duplicate section id ${section.id}.`, sourceEntityId: section.sourceEntityId });
      }
      seenSectionIds.add(section.id);

      if (seenEntityIds.has(section.sourceEntityId)) {
        items.push({ severity: 'warning', code: 'DUPLICATE_SOURCE_ENTITY', message: `Source entity ${section.sourceEntityId} appears in multiple sections.`, sourceEntityId: section.sourceEntityId });
      }
      seenEntityIds.add(section.sourceEntityId);

      if (!section.sourcePath.startsWith('canonical/')) {
        items.push({ severity: 'error', code: 'NON_CANONICAL_SOURCE_PATH', message: `Section ${section.id} does not trace to a canonical source path.`, sourceEntityId: section.sourceEntityId });
      }
    }

    if (plan.sections.length === 0) {
      items.push({ severity: 'error', code: 'EMPTY_PUBLICATION_PLAN', message: 'Publication plan contains no sections.' });
    }

    return {
      ok: !items.some((item) => item.severity === 'error'),
      itemCount: items.length,
      items,
    };
  }
}

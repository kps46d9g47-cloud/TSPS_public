import type { KnowledgeGraph } from '../graph';
import type { PublicationPlan } from '../publication';
import type { TraceabilityEntry } from './types';

export class TraceabilityEngine {
  build(plan: PublicationPlan, graph: KnowledgeGraph): TraceabilityEntry[] {
    const integrityByEntityId = new Map(graph.entities.map((entity) => [entity.id, entity.integrity_hash]));

    return plan.sections
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((section) => ({
        sectionId: section.id,
        sourceEntityId: section.sourceEntityId,
        sourcePath: section.sourcePath,
        integrityHash: integrityByEntityId.get(section.sourceEntityId),
      }));
  }
}

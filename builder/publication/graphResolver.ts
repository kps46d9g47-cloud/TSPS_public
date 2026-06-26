import { KnowledgeGraphCore } from '../graph';
import type { GraphEntity, KnowledgeGraph } from '../graph';
import type { ResolvedGraphPublicationContext } from './types';

export class GraphResolver {
  resolve(graph: KnowledgeGraph): ResolvedGraphPublicationContext {
    const core = new KnowledgeGraphCore(graph);
    const entities = core.getEntities().sort((a, b) => a.id.localeCompare(b.id));

    return {
      graph,
      entities,
      sections: [],
    };
  }

  findEntityById(context: ResolvedGraphPublicationContext, entityId: string): GraphEntity | undefined {
    return context.entities.find((entity) => entity.id === entityId);
  }

  requireEntityById(context: ResolvedGraphPublicationContext, entityId: string): GraphEntity {
    const entity = this.findEntityById(context, entityId);
    if (!entity) throw new Error(`Missing graph entity: ${entityId}`);
    return entity;
  }
}

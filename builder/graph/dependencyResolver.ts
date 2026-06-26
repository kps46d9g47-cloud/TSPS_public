import { KnowledgeGraphCore } from './graph';
import type { DependencyResolution, GraphEntity } from './types';

const DEPENDENCY_RELATIONSHIP_TYPES = new Set(['depends_on', 'depends_on_group_member']);

export class DependencyResolver {
  constructor(private readonly core: KnowledgeGraphCore) {}

  resolveDirect(entityId: string): DependencyResolution | undefined {
    const entity = this.core.getEntity(entityId);
    if (!entity) return undefined;

    const directDependencies: GraphEntity[] = [];
    const missingDependencies: string[] = [];

    for (const relationship of this.core.getOutgoing(entityId)) {
      if (!DEPENDENCY_RELATIONSHIP_TYPES.has(relationship.type)) continue;
      const target = this.core.getEntity(relationship.to);
      if (target) directDependencies.push(target);
      else missingDependencies.push(relationship.to);
    }

    return { entity, directDependencies, missingDependencies };
  }

  resolveTransitive(entityId: string): GraphEntity[] {
    const visited = new Set<string>();
    const result: GraphEntity[] = [];

    const visit = (currentId: string): void => {
      for (const relationship of this.core.getOutgoing(currentId)) {
        if (!DEPENDENCY_RELATIONSHIP_TYPES.has(relationship.type)) continue;
        if (visited.has(relationship.to)) continue;
        visited.add(relationship.to);
        const target = this.core.getEntity(relationship.to);
        if (target) {
          result.push(target);
          visit(target.id);
        }
      }
    };

    visit(entityId);
    return result;
  }
}

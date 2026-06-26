import type { GraphEntity, GraphRelationship, KnowledgeGraph } from './types';

export class KnowledgeGraphCore {
  private readonly entitiesById: Map<string, GraphEntity>;
  private readonly outgoingById: Map<string, GraphRelationship[]>;
  private readonly incomingById: Map<string, GraphRelationship[]>;

  constructor(public readonly graph: KnowledgeGraph) {
    this.entitiesById = new Map(graph.entities.map((entity) => [entity.id, entity]));
    this.outgoingById = new Map();
    this.incomingById = new Map();

    for (const relationship of graph.relationships) {
      const outgoing = this.outgoingById.get(relationship.from) ?? [];
      outgoing.push(relationship);
      this.outgoingById.set(relationship.from, outgoing);

      const incoming = this.incomingById.get(relationship.to) ?? [];
      incoming.push(relationship);
      this.incomingById.set(relationship.to, incoming);
    }
  }

  getEntity(id: string): GraphEntity | undefined {
    return this.entitiesById.get(id);
  }

  getEntities(): GraphEntity[] {
    return [...this.entitiesById.values()];
  }

  getRelationships(): GraphRelationship[] {
    return [...this.graph.relationships];
  }

  getOutgoing(entityId: string): GraphRelationship[] {
    return [...(this.outgoingById.get(entityId) ?? [])];
  }

  getIncoming(entityId: string): GraphRelationship[] {
    return [...(this.incomingById.get(entityId) ?? [])];
  }

  hasEntity(entityId: string): boolean {
    return this.entitiesById.has(entityId);
  }
}

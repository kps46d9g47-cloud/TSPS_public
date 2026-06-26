import { KnowledgeGraphCore } from './graph';
import type { GraphValidationIssue, GraphValidationResult, KnowledgeGraph } from './types';

const ENTITY_ID_PATTERN = /^CM-[0-9]{2}$/;
const INTEGRITY_HASH_PATTERN = /^CM-[0-9]{2}-LOCKED-v2\.0$/;
const ALLOWED_RELATIONSHIP_TYPES = new Set([
  'depends_on',
  'depends_on_group_member',
  'references',
  'supports',
  'derived_from',
]);

export class GraphValidator {
  validate(graph: KnowledgeGraph): GraphValidationResult {
    const issues: GraphValidationIssue[] = [];
    const core = new KnowledgeGraphCore(graph);
    const seenEntityIds = new Set<string>();

    if (graph.project !== 'TSPS') {
      issues.push({ severity: 'error', code: 'INVALID_PROJECT', message: 'Graph project must be TSPS.' });
    }

    for (const entity of graph.entities) {
      if (!ENTITY_ID_PATTERN.test(entity.id)) {
        issues.push({ severity: 'error', code: 'INVALID_ENTITY_ID', message: `Invalid entity id ${entity.id}.`, entityId: entity.id });
      }

      if (seenEntityIds.has(entity.id)) {
        issues.push({ severity: 'error', code: 'DUPLICATE_ENTITY_ID', message: `Duplicate entity id ${entity.id}.`, entityId: entity.id });
      }
      seenEntityIds.add(entity.id);

      if (!entity.path.startsWith('canonical/') || !entity.path.endsWith('.md')) {
        issues.push({ severity: 'error', code: 'INVALID_ENTITY_PATH', message: `Entity ${entity.id} must trace to a canonical Markdown file.`, entityId: entity.id });
      }

      if (!INTEGRITY_HASH_PATTERN.test(entity.integrity_hash)) {
        issues.push({ severity: 'error', code: 'INVALID_INTEGRITY_HASH', message: `Entity ${entity.id} has invalid integrity hash.`, entityId: entity.id });
      }
    }

    for (const relationship of graph.relationships) {
      if (!ALLOWED_RELATIONSHIP_TYPES.has(relationship.type)) {
        issues.push({ severity: 'error', code: 'INVALID_RELATIONSHIP_TYPE', message: `Invalid relationship type ${relationship.type}.`, relationship });
      }

      if (!core.hasEntity(relationship.from)) {
        issues.push({ severity: 'error', code: 'MISSING_RELATIONSHIP_SOURCE', message: `Relationship source ${relationship.from} is missing.`, relationship });
      }

      if (!core.hasEntity(relationship.to)) {
        issues.push({ severity: 'error', code: 'MISSING_RELATIONSHIP_TARGET', message: `Relationship target ${relationship.to} is missing.`, relationship });
      }
    }

    return {
      ok: !issues.some((issue) => issue.severity === 'error'),
      entityCount: graph.entities.length,
      relationshipCount: graph.relationships.length,
      issues,
    };
  }
}

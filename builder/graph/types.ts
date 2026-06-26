export type GraphEntityType =
  | 'canonical_module'
  | 'country_module'
  | 'framework_module'
  | 'roadmap_module'
  | 'conclusion_module';

export type GraphRelationshipType =
  | 'depends_on'
  | 'depends_on_group_member'
  | 'references'
  | 'supports'
  | 'derived_from';

export interface GraphEntity {
  id: string;
  type: GraphEntityType | string;
  name: string;
  path: string;
  integrity_hash: string;
  country?: string;
  [key: string]: unknown;
}

export interface GraphRelationship {
  from: string;
  to: string;
  type: GraphRelationshipType | string;
}

export interface GraphTraceability {
  canonical_index?: string;
  module_files?: string;
  generated_from?: string;
  [key: string]: unknown;
}

export interface KnowledgeGraph {
  project: 'TSPS';
  phase: string;
  graph_version: string;
  source_policy: string;
  entities: GraphEntity[];
  relationships: GraphRelationship[];
  traceability: GraphTraceability;
}

export interface DependencyResolution {
  entity: GraphEntity;
  directDependencies: GraphEntity[];
  missingDependencies: string[];
}

export interface GraphValidationIssue {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  entityId?: string;
  relationship?: GraphRelationship;
}

export interface GraphValidationResult {
  ok: boolean;
  entityCount: number;
  relationshipCount: number;
  issues: GraphValidationIssue[];
}

import type { GraphEntity, KnowledgeGraph } from '../graph';

export interface PublicationSection {
  id: string;
  title: string;
  sourceEntityId: string;
  sourcePath: string;
  sectionType: 'canonical' | 'country' | 'framework' | 'roadmap' | 'qa' | 'summary';
  order: number;
}

export interface PublicationPlan {
  project: 'TSPS';
  sourceGraphVersion: string;
  sections: PublicationSection[];
}

export interface ResolvedGraphPublicationContext {
  graph: KnowledgeGraph;
  entities: GraphEntity[];
  sections: PublicationSection[];
}

export interface PublicationQAItem {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  sourceEntityId?: string;
}

export interface PublicationQAReport {
  ok: boolean;
  itemCount: number;
  items: PublicationQAItem[];
}

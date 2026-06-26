import type { PublicationPlan, PublicationSection } from '../publication';

export interface LayoutBlock {
  id: string;
  sectionId: string;
  sourceEntityId: string;
  sourcePath: string;
  title: string;
  order: number;
  layoutType: 'cover' | 'section' | 'country' | 'framework' | 'roadmap' | 'appendix' | 'qa';
}

export interface LayoutPlan {
  project: 'TSPS';
  sourcePlanSections: number;
  blocks: LayoutBlock[];
}

export interface TOCEntry {
  level: number;
  title: string;
  sectionId: string;
  order: number;
}

export interface AppendixEntry {
  id: string;
  title: string;
  sourcePath: string;
  sourceEntityId: string;
}

export interface TraceabilityEntry {
  sectionId: string;
  sourceEntityId: string;
  sourcePath: string;
  integrityHash?: string;
}

export interface GraphPublicationPipelineResult {
  publicationPlan: PublicationPlan;
  layoutPlan: LayoutPlan;
  toc: TOCEntry[];
  appendices: AppendixEntry[];
  traceability: TraceabilityEntry[];
}

export type PipelineSectionSelector = (section: PublicationSection) => boolean;

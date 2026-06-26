import type { KnowledgeGraph } from '../graph';
import type { GraphPublicationPipelineResult } from './types';
import { AppendixBuilder } from './appendixBuilder';
import { LayoutPlanEngine } from './layoutPlanEngine';
import { PublicationPlanBuilder } from './publicationPlanBuilder';
import { TOCGenerator } from './tocGenerator';
import { TraceabilityEngine } from './traceabilityEngine';

export class GraphPublicationPipeline {
  private readonly publicationPlanBuilder = new PublicationPlanBuilder();
  private readonly layoutPlanEngine = new LayoutPlanEngine();
  private readonly tocGenerator = new TOCGenerator();
  private readonly appendixBuilder = new AppendixBuilder();
  private readonly traceabilityEngine = new TraceabilityEngine();

  build(graph: KnowledgeGraph): GraphPublicationPipelineResult {
    const publicationPlan = this.publicationPlanBuilder.build(graph);
    const layoutPlan = this.layoutPlanEngine.build(publicationPlan);
    const toc = this.tocGenerator.generate(publicationPlan);
    const appendices = this.appendixBuilder.buildSourceAppendix(publicationPlan);
    const traceability = this.traceabilityEngine.build(publicationPlan, graph);

    return {
      publicationPlan,
      layoutPlan,
      toc,
      appendices,
      traceability,
    };
  }
}

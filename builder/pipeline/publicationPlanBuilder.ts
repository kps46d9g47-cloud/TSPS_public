import { GraphResolver, SectionBuilder } from '../publication';
import type { KnowledgeGraph } from '../graph';
import type { PublicationPlan } from '../publication';

export class PublicationPlanBuilder {
  private readonly resolver = new GraphResolver();
  private readonly sectionBuilder = new SectionBuilder();

  build(graph: KnowledgeGraph): PublicationPlan {
    const context = this.resolver.resolve(graph);
    const sections = this.sectionBuilder.buildSections(context.entities);

    return {
      project: 'TSPS',
      sourceGraphVersion: graph.graph_version,
      sections,
    };
  }
}

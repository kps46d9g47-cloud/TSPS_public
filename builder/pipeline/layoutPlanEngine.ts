import type { LayoutBlock, LayoutPlan } from './types';
import type { PublicationPlan, PublicationSection } from '../publication';

export class LayoutPlanEngine {
  build(plan: PublicationPlan): LayoutPlan {
    const blocks: LayoutBlock[] = plan.sections.map((section) => this.mapSectionToBlock(section));

    return {
      project: 'TSPS',
      sourcePlanSections: plan.sections.length,
      blocks,
    };
  }

  private mapSectionToBlock(section: PublicationSection): LayoutBlock {
    return {
      id: `layout-${section.id}`,
      sectionId: section.id,
      sourceEntityId: section.sourceEntityId,
      sourcePath: section.sourcePath,
      title: section.title,
      order: section.order,
      layoutType: this.mapLayoutType(section.sectionType),
    };
  }

  private mapLayoutType(sectionType: PublicationSection['sectionType']): LayoutBlock['layoutType'] {
    if (sectionType === 'country') return 'country';
    if (sectionType === 'framework') return 'framework';
    if (sectionType === 'roadmap') return 'roadmap';
    if (sectionType === 'qa') return 'qa';
    return 'section';
  }
}

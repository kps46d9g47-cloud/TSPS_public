import type { GraphEntity } from '../graph';
import type { PublicationSection } from './types';
import { SectionBuilder } from './sectionBuilder';

export class RoadmapBuilder {
  private readonly sectionBuilder = new SectionBuilder();

  buildRoadmapSections(entities: GraphEntity[], startOrder = 1): PublicationSection[] {
    const roadmapEntities = entities
      .filter((entity) => entity.type === 'roadmap_module' || entity.id === 'CM-22')
      .sort((a, b) => a.id.localeCompare(b.id));

    return roadmapEntities.map((entity, index) => this.sectionBuilder.buildSection(entity, startOrder + index));
  }

  getRoadmapEntity(entities: GraphEntity[]): GraphEntity | undefined {
    return entities.find((entity) => entity.id === 'CM-22');
  }
}

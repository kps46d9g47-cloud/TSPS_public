import type { GraphEntity } from '../graph';
import type { PublicationSection } from './types';

export class SectionBuilder {
  buildSection(entity: GraphEntity, order: number): PublicationSection {
    return {
      id: `section-${entity.id}`,
      title: entity.name,
      sourceEntityId: entity.id,
      sourcePath: entity.path,
      sectionType: this.mapSectionType(entity.type),
      order,
    };
  }

  buildSections(entities: GraphEntity[]): PublicationSection[] {
    return entities.map((entity, index) => this.buildSection(entity, index + 1));
  }

  private mapSectionType(entityType: string): PublicationSection['sectionType'] {
    if (entityType === 'country_module') return 'country';
    if (entityType === 'framework_module') return 'framework';
    if (entityType === 'roadmap_module') return 'roadmap';
    if (entityType === 'conclusion_module') return 'summary';
    return 'canonical';
  }
}

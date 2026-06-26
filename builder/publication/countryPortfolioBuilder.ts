import type { GraphEntity } from '../graph';
import type { PublicationSection } from './types';
import { SectionBuilder } from './sectionBuilder';

export class CountryPortfolioBuilder {
  private readonly sectionBuilder = new SectionBuilder();

  buildCountryPortfolio(entities: GraphEntity[], startOrder = 1): PublicationSection[] {
    return entities
      .filter((entity) => entity.type === 'country_module')
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((entity, index) => this.sectionBuilder.buildSection(entity, startOrder + index));
  }

  listCountries(entities: GraphEntity[]): string[] {
    return entities
      .filter((entity) => entity.type === 'country_module')
      .map((entity) => entity.country ?? entity.name)
      .sort((a, b) => a.localeCompare(b));
  }
}

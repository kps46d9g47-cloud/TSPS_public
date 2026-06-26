export interface DesignedSection {
  order: number;
  title: string;
  sourceEntityId: string;
  sourcePath: string;
  sectionType: string;
  content: string;
}

export interface DesignedPublication {
  title: string;
  subtitle: string;
  version: string;
  classification: string;
  sourcePolicy: string;
  sections: DesignedSection[];
}

const TECHNICAL_PREFIXES = [
  'CANONICAL MODULE ',
  'Module ID:',
  'Module Name:',
  'Version:',
  'Status:',
  'Classification:',
  'Integrity Hash:',
  'End of Canonical Module',
];

function isSeparator(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === '⸻' || /^-{3,}$/.test(trimmed);
}

function isTechnicalLine(line: string): boolean {
  const trimmed = line.trim();
  return TECHNICAL_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

function stripDependenciesBlock(lines: string[]): string[] {
  const cleaned: string[] = [];
  let skippingDependencies = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === 'Dependencies:') {
      skippingDependencies = true;
      continue;
    }

    if (skippingDependencies) {
      if (isSeparator(line) || trimmed.length === 0) {
        skippingDependencies = false;
        continue;
      }
      continue;
    }

    cleaned.push(line);
  }

  return cleaned;
}

function normalizeWhitespace(lines: string[]): string[] {
  const result: string[] = [];
  let previousBlank = false;

  for (const line of lines) {
    const trimmed = line.trimEnd();
    const isBlank = trimmed.trim().length === 0;

    if (isBlank && previousBlank) continue;
    result.push(trimmed);
    previousBlank = isBlank;
  }

  while (result.length > 0 && result[0].trim().length === 0) result.shift();
  while (result.length > 0 && result[result.length - 1].trim().length === 0) result.pop();

  return result;
}

function removeDuplicateLeadingTitle(lines: string[], title: string): string[] {
  const result = [...lines];
  while (result.length > 0 && result[0].trim().length === 0) result.shift();

  if (result[0]?.trim() === title.trim()) {
    result.shift();
    if (result[0]?.trim().length === 0) result.shift();
  }

  return result;
}

export function cleanCanonicalModuleForPublication(rawModuleText: string, title: string): string {
  const withoutDependencies = stripDependenciesBlock(rawModuleText.split(/\r?\n/));
  const publicLines = withoutDependencies
    .filter((line) => !isTechnicalLine(line))
    .filter((line) => !isSeparator(line));

  return normalizeWhitespace(removeDuplicateLeadingTitle(publicLines, title)).join('\n');
}

export function renderDesignedMasterEdition(publication: DesignedPublication): string {
  const toc = publication.sections.map((section) => `${section.order}. ${section.title}`).join('\n');
  const sections = publication.sections.map((section) => {
    return [
      `# ${section.title}`,
      '',
      section.content.trim(),
    ].join('\n');
  }).join('\n\n---\n\n');

  return [
    '# Tramplin Electronics',
    '',
    '## International Expansion Strategy',
    '',
    publication.subtitle,
    '',
    `Version: ${publication.version}`,
    '',
    publication.classification,
    '',
    publication.sourcePolicy,
    '',
    '---',
    '',
    '# Table of Contents',
    '',
    toc,
    '',
    '---',
    '',
    sections,
    '',
  ].join('\n');
}

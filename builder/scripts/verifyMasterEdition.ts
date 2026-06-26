import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { KnowledgeGraph } from '../graph/index.js';

const REPO_ROOT = new URL('../../', import.meta.url);
const BUILD_DIR = new URL('build/', REPO_ROOT);
const REPORTS_DIR = new URL('reports/', REPO_ROOT);

interface CanonicalModuleIndexEntry {
  module_id: string;
  module_name: string;
  version: string;
  status: string;
  classification: string;
  path: string;
  integrity_hash: string;
}

interface CanonicalIndex {
  project: 'TSPS';
  modules: CanonicalModuleIndexEntry[];
}

interface MasterStructureSection {
  order: number;
  sectionId: string;
  title: string;
  sourceEntityId: string;
  sourcePath: string;
  sectionType: string;
}

interface MasterStructure {
  project: 'TSPS';
  phase: string;
  artifact: string;
  version: string;
  sectionCount: number;
  sections: MasterStructureSection[];
}

async function readJson<T>(url: URL): Promise<T> {
  return JSON.parse(await readFile(url, 'utf8')) as T;
}

async function writeJson(url: URL, value: unknown): Promise<void> {
  await mkdir(dirname(fileURLToPath(url)), { recursive: true });
  await writeFile(url, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function normalize(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

async function main(): Promise<void> {
  const canonicalIndex = await readJson<CanonicalIndex>(new URL('canonical/canonical_index.json', REPO_ROOT));
  const graph = await readJson<KnowledgeGraph>(new URL('knowledge_graph/knowledge_graph.json', REPO_ROOT));
  const masterStructure = await readJson<MasterStructure>(new URL('master_edition_structure.json', BUILD_DIR));
  const masterMarkdown = await readFile(new URL('master_edition.md', BUILD_DIR), 'utf8');

  const issues: Array<{ code: string; message: string; moduleId?: string }> = [];
  const canonicalModules = canonicalIndex.modules.slice().sort((a, b) => a.module_id.localeCompare(b.module_id));
  const sections = masterStructure.sections.slice().sort((a, b) => a.order - b.order);

  if (canonicalModules.length !== 23) {
    issues.push({ code: 'CANONICAL_MODULE_COUNT', message: `Expected 23 canonical modules, got ${canonicalModules.length}.` });
  }

  if (sections.length !== 23) {
    issues.push({ code: 'MASTER_SECTION_COUNT', message: `Expected 23 master sections, got ${sections.length}.` });
  }

  const structuralResults = canonicalModules.map((module, index) => {
    const expectedEntityId = `CM-${module.module_id}`;
    const section = sections[index];
    const pass = Boolean(section)
      && section.sourceEntityId === expectedEntityId
      && section.sourcePath === module.path
      && section.order === index + 1;

    if (!pass) {
      issues.push({ code: 'STRUCTURAL_MISMATCH', message: `Structural mismatch at order ${index + 1}.`, moduleId: module.module_id });
    }

    return {
      moduleId: module.module_id,
      expectedEntityId,
      expectedPath: module.path,
      actualEntityId: section?.sourceEntityId,
      actualPath: section?.sourcePath,
      order: index + 1,
      status: pass ? 'PASS' : 'FAIL',
    };
  });

  const contentResults = [];
  for (const module of canonicalModules) {
    const canonicalText = normalize(await readFile(new URL(module.path, REPO_ROOT), 'utf8'));
    const occurrences = countOccurrences(normalize(masterMarkdown), canonicalText);
    const pass = occurrences === 1;
    if (!pass) {
      issues.push({ code: 'CONTENT_OCCURRENCE_MISMATCH', message: `Expected canonical module ${module.module_id} to occur once in master, got ${occurrences}.`, moduleId: module.module_id });
    }
    contentResults.push({ moduleId: module.module_id, sourcePath: module.path, occurrences, status: pass ? 'PASS' : 'FAIL' });
  }

  const graphEntitiesById = new Map(graph.entities.map((entity) => [entity.id, entity]));
  const dependencyResults = canonicalModules.map((module) => {
    const entityId = `CM-${module.module_id}`;
    const dependencyCount = graph.relationships.filter((relationship) => relationship.from === entityId && relationship.type.startsWith('depends_on')).length;
    const pass = graphEntitiesById.has(entityId);
    if (!pass) issues.push({ code: 'MISSING_GRAPH_ENTITY', message: `Missing graph entity ${entityId}.`, moduleId: module.module_id });
    return { moduleId: module.module_id, entityId, dependencyCount, status: pass ? 'PASS' : 'FAIL' };
  });

  const traceabilityResults = canonicalModules.map((module) => {
    const entityId = `CM-${module.module_id}`;
    const entity = graphEntitiesById.get(entityId);
    const pass = Boolean(entity) && entity?.integrity_hash === module.integrity_hash && entity?.path === module.path;
    if (!pass) issues.push({ code: 'TRACEABILITY_MISMATCH', message: `Traceability mismatch for ${entityId}.`, moduleId: module.module_id });
    return {
      moduleId: module.module_id,
      entityId,
      sourcePath: module.path,
      integrityHash: module.integrity_hash,
      status: pass ? 'PASS' : 'FAIL',
    };
  });

  const verificationReport = {
    project: 'TSPS',
    phase: 'Phase D Sprint 5B',
    artifact: 'Master Edition RC',
    status: issues.length === 0 ? 'PASS' : 'FAIL',
    checks: {
      structuralVerification: structuralResults.every((result) => result.status === 'PASS') ? 'PASS' : 'FAIL',
      contentVerification: contentResults.every((result) => result.status === 'PASS') ? 'PASS' : 'FAIL',
      dependencyVerification: dependencyResults.every((result) => result.status === 'PASS') ? 'PASS' : 'FAIL',
      traceabilityVerification: traceabilityResults.every((result) => result.status === 'PASS') ? 'PASS' : 'FAIL',
      completenessVerification: issues.length === 0 ? 'PASS' : 'FAIL',
    },
    structuralResults,
    contentResults,
    dependencyResults,
    traceabilityResults,
    issues,
  };

  const releaseCandidateManifest = {
    project: 'TSPS',
    phase: 'Phase D Sprint 5B',
    releaseCandidate: 'Master Edition v1.0 RC',
    status: issues.length === 0 ? 'FROZEN_FOR_RELEASE_V1_0' : 'NOT_FROZEN',
    canonicalRepositoryState: issues.length === 0 ? 'Frozen for Release v1.0' : 'Open due to verification issues',
    canonicalModulesModified: false,
    sourcePolicy: 'Canonical Repository is the sole source of truth.',
    artifacts: [
      'build/master_edition.md',
      'build/master_edition_structure.json',
      'reports/master_build_report.json',
      'reports/master_traceability_report.json',
      'reports/master_qa_report.json',
      'reports/master_verification_report.json',
      'reports/release_candidate_manifest.json'
    ],
    verificationStatus: verificationReport.status,
    moduleCount: canonicalModules.length,
    sectionCount: sections.length,
  };

  await writeJson(new URL('master_verification_report.json', REPORTS_DIR), verificationReport);
  await writeJson(new URL('release_candidate_manifest.json', REPORTS_DIR), releaseCandidateManifest);

  console.log(JSON.stringify({
    ok: issues.length === 0,
    status: verificationReport.status,
    canonicalRepositoryState: releaseCandidateManifest.canonicalRepositoryState,
    generatedArtifacts: [
      'reports/master_verification_report.json',
      'reports/release_candidate_manifest.json'
    ],
  }, null, 2));

  if (issues.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

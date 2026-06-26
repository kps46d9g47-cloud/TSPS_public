import { readFile } from 'node:fs/promises';
import { GraphValidator, type KnowledgeGraph } from '../graph/index.js';
import { GraphPublicationPipeline } from '../pipeline/index.js';

const GRAPH_PATH = new URL('../../knowledge_graph/knowledge_graph.json', import.meta.url);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const rawGraph = await readFile(GRAPH_PATH, 'utf8');
  const graph = JSON.parse(rawGraph) as KnowledgeGraph;

  const validation = new GraphValidator().validate(graph);
  assert(validation.ok, 'Knowledge Graph validation failed.');

  const result = new GraphPublicationPipeline().build(graph);

  assert(result.publicationPlan.sections.length === graph.entities.length, 'Publication section count must match graph entity count.');
  assert(result.layoutPlan.blocks.length === result.publicationPlan.sections.length, 'Layout block count must match publication section count.');
  assert(result.toc.length === result.publicationPlan.sections.length, 'TOC count must match publication section count.');
  assert(result.traceability.length === result.publicationPlan.sections.length, 'Traceability count must match publication section count.');

  console.log(JSON.stringify({
    ok: true,
    sections: result.publicationPlan.sections.length,
    layoutBlocks: result.layoutPlan.blocks.length,
    tocEntries: result.toc.length,
    traceabilityEntries: result.traceability.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

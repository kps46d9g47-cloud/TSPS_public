import { readFile } from 'node:fs/promises';
import { GraphValidator, type KnowledgeGraph } from '../graph/index.js';

const GRAPH_PATH = new URL('../../knowledge_graph/knowledge_graph.json', import.meta.url);

async function main(): Promise<void> {
  const rawGraph = await readFile(GRAPH_PATH, 'utf8');
  const graph = JSON.parse(rawGraph) as KnowledgeGraph;
  const validator = new GraphValidator();
  const result = validator.validate(graph);

  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

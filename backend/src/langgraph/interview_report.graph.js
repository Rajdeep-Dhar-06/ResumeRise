import { StateGraph, Annotation } from '@langchain/langgraph';
import { MongoClient } from 'mongodb';
import { MongoDBSaver } from '@langchain/langgraph-checkpoint-mongodb';
import {
  startAgent,
  assembleFinalReport,
  persistInterviewReport
} from '../nodes/graph_nodes.js';

// --- State Definition ---
export const GraphState = Annotation.Root({
  userId: Annotation(),

  // Intermediate values
  resumeId: Annotation(),
  resumeText: Annotation(),
  jobDescriptionId: Annotation(),
  jobDescriptionText: Annotation(),
  jobDescriptionSkills: Annotation(),
  jobDescriptionRequirements: Annotation(),
  jobDescriptionCompany: Annotation(),
  jobDescriptionRole: Annotation(),
  matchedSkills: Annotation(),
  matchedRequirements: Annotation(),
  matchScore: Annotation(),
  skillGaps: Annotation(),
  preparationPlan: Annotation(),
  roadmapTitle: Annotation(),
  technicalQuestions: Annotation(),
  behavioralQuestions: Annotation(),
  learningResources: Annotation(),

  // Outputs
  savedReport: Annotation()
});

// --- StateGraph Setup ---
const workflow = new StateGraph(GraphState)
  .addNode("startAgent", startAgent)
  .addNode("assembleFinalReport", assembleFinalReport)
  .addNode("persistInterviewReport", persistInterviewReport)

  // Linear Pipeline (Concurrency handled inside assembleFinalReport)
  .addEdge("__start__", "startAgent")
  .addEdge("startAgent", "assembleFinalReport")
  .addEdge("assembleFinalReport", "persistInterviewReport")
  .addEdge("persistInterviewReport", "__end__");

import { randomUUID } from 'crypto';

// --- Lazy Graph Compilation with MongoDB Saver ---
let graphPromise = null;

function getGraph() {
  if (!graphPromise) {
    graphPromise = (async () => {
      let checkpointer = null;
      if (process.env.MONGO_URI) {
        console.log('[Graph] Initializing MongoDB Saver Checkpointer...');
        try {
          const client = new MongoClient(process.env.MONGO_URI);
          checkpointer = new MongoDBSaver({ client });
          await checkpointer.setup();
          console.log('[Graph] MongoDB Saver Checkpointer setup completed.');
        } catch (e) {
          console.error('[Graph] Failed to setup MongoDB checkpointer, compiling without checkpointing:', e);
        }
      }
      return workflow.compile({ checkpointer });
    })();
  }
  return graphPromise;
}

/**
 * Executes the LangGraph Interview Preparation pipeline.
 *
 * @param {object} initialContext - Inputs for report generation
 * @param {string} threadId - Conversation session thread ID for database checkpointing
 * @returns {Promise<object>} Final execution state including savedReport
 */
export async function runInterviewReportGraph(initialContext, threadId) {
  const graph = await getGraph();
  const actualThreadId = threadId || randomUUID();
  const config = { configurable: { thread_id: actualThreadId } };
  const finalState = await graph.invoke(initialContext, config);
  return finalState;
}

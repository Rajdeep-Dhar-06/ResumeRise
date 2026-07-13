import { StateGraph } from '@langchain/langgraph';
import { GraphState } from './state.js';
import { setupEdges } from './edges.js';
import { startAgent } from '../nodes/start_agent.js';
import { assembleFinalReport } from '../nodes/assemble_final_report.js';
import { persistInterviewReport } from '../nodes/persist_interview_report.js';

// StateGraph compilation workflow setup
const workflow = new StateGraph(GraphState)
  .addNode("startAgent", startAgent)
  .addNode("assembleFinalReport", assembleFinalReport)
  .addNode("persistInterviewReport", persistInterviewReport);

// Configure edge routes
setupEdges(workflow);

const graph = workflow.compile();

/**
 * Entry point to execute the full LangGraph pipeline
 * @param {Object} initialContext - Initial context of the execution state
 * @returns {Promise<Object>} - Final resolved state keys and values
 */
export async function runInterviewReportGraph(initialContext) {
  const finalState = await graph.invoke(initialContext);
  return finalState;
}

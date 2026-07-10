import { StateGraph, Annotation } from '@langchain/langgraph';
import {
  startAgent,
  assembleFinalReport,
  persistInterviewReport
} from '../nodes/graph_nodes.js';

//  State Definition 
export const GraphState = Annotation.Root({
  userId: Annotation(),
  resumeBuffer: Annotation(),
  jobDescriptionUrl: Annotation(),

  // Intermediate values
  resumeId: Annotation(),
  resumeText: Annotation(),
  resumeHash: Annotation(),

  jobDescriptionId: Annotation(),
  jobDescriptionText: Annotation(),
  jobDescriptionTechnicalRequirements: Annotation(),
  jobDescriptionNonTechnicalRequirements: Annotation(),
  jobDescriptionCompany: Annotation(),
  jobDescriptionRole: Annotation(),

  evaluatedTechnicalRequirements: Annotation(),
  evaluatedNonTechnicalRequirements: Annotation(),
  daysLimit: Annotation(),

  reportTitle: Annotation(),
  matchScore: Annotation(),
  preparationGaps: Annotation(),
  technicalQuestions: Annotation(),
  nonTechnicalQuestions: Annotation(),
  preparationPlan: Annotation(),
  learningResources: Annotation(),

  // Outputs
  savedReport: Annotation()
});

// StateGraph Setup
const workflow = new StateGraph(GraphState)
  .addNode("startAgent", startAgent)
  .addNode("assembleFinalReport", assembleFinalReport)
  .addNode("persistInterviewReport", persistInterviewReport)

  // Linear Pipeline
  .addEdge("__start__", "startAgent")
  .addEdge("startAgent", "assembleFinalReport")
  .addEdge("assembleFinalReport", "persistInterviewReport")
  .addEdge("persistInterviewReport", "__end__");

const graph = workflow.compile();

export async function runInterviewReportGraph(initialContext) {
  const finalState = await graph.invoke(initialContext);
  return finalState;
}

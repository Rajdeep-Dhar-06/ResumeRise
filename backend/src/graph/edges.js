// Edges definition and setup function for the LangGraph workflow
export function setupEdges(workflow) {
  workflow.addEdge("__start__", "documentExtraction");
  workflow.addEdge("documentExtraction", "requirementEvaluation");
  workflow.addEdge("requirementEvaluation", "assembleFinalReport");
  workflow.addEdge("assembleFinalReport", "persistInterviewReport");
  workflow.addEdge("persistInterviewReport", "__end__");
}

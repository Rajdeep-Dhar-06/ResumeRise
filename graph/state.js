import { Annotation } from '@langchain/langgraph';

// State Definition for the LangGraph workflow
export const GraphState = Annotation.Root({
  userId: Annotation(),
  resumeBuffer: Annotation(),
  jobDescriptionUrl: Annotation(),

  resumeId: Annotation(),
  techResumeText: Annotation(),
  nonTechResumeText: Annotation(),
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

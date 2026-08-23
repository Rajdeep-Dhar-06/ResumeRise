"""
Evaluation module utilizing Batch Prompting.

Instead of hitting the LLM once for every individual requirement (which causes severe Rate Limit exhaustion), 
this module batches all technical or non-technical requirements into a single prompt.
The LLM evaluates them all simultaneously with full visibility into the candidate's background.
"""
from config import llm
from schemas.report import JobRequirement
from schemas.evaluation import RequirementEvaluation, BatchEvaluationResult
from prompts.prompts import BATCH_EVALUATION_PROMPT

async def evaluate_requirements_batch(
    requirements: list[JobRequirement], 
    candidate_text: str, 
    requirement_type: str
) -> list[RequirementEvaluation]:
    """
    Evaluates a batch of job requirements holistically against the full candidate transcript.

    Args:
        requirements (list[JobRequirement]): The list of requirements (Technical or Non-Technical) to evaluate.
        candidate_text (str): The full anonymized text of the candidate's resume/profile.
        requirement_type (str): Either "Technical" or "Non-Technical" for prompt context.

    Returns:
        list[RequirementEvaluation]: A list of evaluated results (Match Tier, Reasoning, Evidence) for each requirement.
    """
    if not requirements:
        return []

    # Format the requirements into a clear string list for the LLM
    req_lines = []
    for req in requirements:
        req_lines.append(f"- Name: {req.requirement_name} | Priority: {req.priority.value} | Context: {req.source_context}")
    
    requirements_list_str = "\n".join(req_lines)
    
    chain = BATCH_EVALUATION_PROMPT | llm.with_structured_output(BatchEvaluationResult)
    
    result: BatchEvaluationResult = await chain.ainvoke({  # type: ignore
        "requirement_type": requirement_type,
        "requirements_list": requirements_list_str,
        "candidate_text": candidate_text
    })
    
    # Ensure requirement names match exactly if the LLM hallucinated
    for i, req in enumerate(result.evaluations):
        if i < len(requirements):
            req.requirement_name = requirements[i].requirement_name
            
    return result.evaluations

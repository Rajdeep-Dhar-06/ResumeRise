from langchain_community.vectorstores import FAISS
from config import llm
from schemas.report import JobRequirement
from schemas.evaluation import RequirementEvaluation
from prompts.prompts import EVALUATION_PROMPT

async def evaluate_requirement(requirement: JobRequirement, vector_store: FAISS) -> RequirementEvaluation:
    """
    Evaluates a single job requirement against a vector store of candidate profile chunks.
    """
    search_query = f"{requirement.canonical_name} {requirement.source_context}"
    retrieved_docs = vector_store.similarity_search(search_query, k=4)
    resume_chunks = "\n---\n".join([doc.page_content for doc in retrieved_docs])
    
    chain = EVALUATION_PROMPT | llm.with_structured_output(RequirementEvaluation)
    
    result: RequirementEvaluation = await chain.ainvoke({  # type: ignore
        "req_name": requirement.requirement_name,
        "req_context": requirement.source_context,
        "req_priority": requirement.priority,
        "resume_chunks": resume_chunks or "No relevant information found."
    })
    
    result.requirement_name = requirement.requirement_name
    return result

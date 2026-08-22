from fastapi import APIRouter, HTTPException
from schemas.requests import AnalyzeRequest
from schemas.final_report import FinalReport
from orchestrator import analyze_candidate

router = APIRouter(tags=["Analysis"])

@router.post("/analyze", response_model=FinalReport)
async def analyze_candidate_endpoint(request: AnalyzeRequest) -> FinalReport:
    """
    Main evaluation endpoint:
    Accepts candidate profile text, scrapes target JD URL, evaluates requirements in parallel via FAISS RAG,
    calculates match score, identifies gaps, queries Tavily for tutorials, and generates interview questions & study roadmap.
    """
    try:
        report = await analyze_candidate(
            candidate_text=request.candidate_profile,
            jd_url=request.jd_url,
            days_limit=request.days_limit
        )
        return report
    except ValueError as val_err:
        raise HTTPException(status_code=422, detail=str(val_err))
    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"Candidate analysis pipeline failed: {str(err)}"
        )

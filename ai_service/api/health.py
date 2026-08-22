from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    """Liveness probe returning health status of the AI microservice."""
    return {
        "status": "healthy",
        "service": "ResumeRise AI Microservice",
        "version": "1.0.0"
    }

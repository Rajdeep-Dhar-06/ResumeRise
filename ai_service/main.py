from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.health import router as health_router
from api.analyze import router as analyze_router

app = FastAPI(
    title="ResumeRise AI Microservice",
    description="Production-grade AI intelligence service powering semantic candidate evaluation, gap analysis, and study roadmap generation.",
    version="1.0.0"
)

# CORS configuration for React frontend / Express backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router)
app.include_router(analyze_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "Welcome to ResumeRise AI Microservice",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    from config import HOST, PORT
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)

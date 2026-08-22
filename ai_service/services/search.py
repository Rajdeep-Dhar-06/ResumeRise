import asyncio
from langchain_community.tools.tavily_search import TavilySearchResults
from config import TAVILY_API_KEY
from schemas.evaluation import RequirementEvaluation
from schemas.final_report import LearningResource


async def get_learning_resources(
    critical_gaps: list[RequirementEvaluation], role_name: str = "Software Engineer"
) -> list[LearningResource]:
    """
    Searches Tavily for high-quality tutorials and courses targeting critical skill gaps.
    Capped at top 3 gaps to optimize latency and API credits.
    """
    if not TAVILY_API_KEY or not critical_gaps:
        return []

    # Focus on top 3 gaps
    target_gaps = critical_gaps[:3]
    tool = TavilySearchResults(max_results=2, tavily_api_key=TAVILY_API_KEY)

    async def _search_for_gap(gap: RequirementEvaluation) -> list[LearningResource]:
        query = f"Best tutorials and documentation to learn {gap.requirement_name} for {role_name}"
        try:
            results = await tool.ainvoke({"query": query})
            resources = []
            for r in results:
                if isinstance(r, dict):
                    resources.append(
                        LearningResource(
                            requirement_name=gap.requirement_name,
                            title=r.get("title", f"Learn {gap.requirement_name}"),
                            url=r.get("url", ""),
                            description=r.get("content", "")[:200],
                        )
                    )
            return resources
        except Exception:
            return []

    search_tasks = [_search_for_gap(gap) for gap in target_gaps]
    results_nested = await asyncio.gather(*search_tasks)

    # Flatten the list of resources
    return [resource for group in results_nested for resource in group]

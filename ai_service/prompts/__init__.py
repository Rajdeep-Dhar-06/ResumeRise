try:
    from ai_service.prompts.prompts import (
        SCRAPE_JD_PROMPT,
        get_scrape_job_description_prompt,
        EVALUATION_PROMPT,
        TECH_QUESTIONS_PROMPT,
        NON_TECH_QUESTIONS_PROMPT,
        STUDY_PLAN_PROMPT,
    )
except ModuleNotFoundError:
    from prompts.prompts import (
        SCRAPE_JD_PROMPT,
        get_scrape_job_description_prompt,
        EVALUATION_PROMPT,
        TECH_QUESTIONS_PROMPT,
        NON_TECH_QUESTIONS_PROMPT,
        STUDY_PLAN_PROMPT,
    )

__all__ = [
    "SCRAPE_JD_PROMPT",
    "get_scrape_job_description_prompt",
    "EVALUATION_PROMPT",
    "TECH_QUESTIONS_PROMPT",
    "NON_TECH_QUESTIONS_PROMPT",
    "STUDY_PLAN_PROMPT",
]

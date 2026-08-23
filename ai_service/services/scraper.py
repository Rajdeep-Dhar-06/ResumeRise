import httpx
from config import JINA_API_KEY, llm
from schemas.report import JobDescription
from prompts.prompts import SCRAPE_JD_PROMPT

async def scrape_job_description(url: str) -> str:
    """
    Scrapes raw web page text using the Jina Reader API.
    
    Args:
        url (str): The URL of the job posting.
        
    Returns:
        str: The raw text content extracted from the webpage.
        
    Raises:
        ValueError: If the extracted text is too short (indicating a failed scrape).
    """
    url = url.strip()
    headers = {"Authorization": f"Bearer {JINA_API_KEY}"} if JINA_API_KEY else {}
    
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(f"https://r.jina.ai/{url}", headers=headers)
        response.raise_for_status()
        jd_text = response.text
        
    if len(jd_text.strip()) < 50:
        raise ValueError("No sufficient text content could be extracted from this URL.")
        
    return jd_text

async def extract_job_description(jd_text: str) -> JobDescription:
    """
    Extracts structured job requirements from raw scraped text using Gemini.
    
    This uses LangChain's Expression Language (LCEL) to pipe the prompt 
    directly into the Gemini LLM. The `.with_structured_output()` forces 
    the LLM to return a strictly typed JSON object matching our 
    JobDescription Pydantic model, rather than a raw text string.

    Args:
        jd_text (str): The raw, unstructured text scraped from the job URL.

    Returns:
        JobDescription: A validated Pydantic object containing the role, 
                        company, and technical/non-technical requirements.
    """
    # The '|' operator pipes the prompt template into the LLM
    chain = SCRAPE_JD_PROMPT | llm.with_structured_output(JobDescription)
    
    result: JobDescription = await chain.ainvoke({"raw_text": jd_text})  # type: ignore
    return result

async def get_job_description(url: str) -> JobDescription:
    """
    Full scraper pipeline: fetches web page via Jina and returns structured extraction.
    """
    jd_text = await scrape_job_description(url)
    return await extract_job_description(jd_text)

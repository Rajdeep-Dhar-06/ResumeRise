import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.globals import set_llm_cache
from langchain_community.cache import RedisCache
from redis import Redis

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

try:
    redis_client = Redis.from_url(REDIS_URL)
    set_llm_cache(RedisCache(redis_=redis_client))
except Exception as e:
    print(f"Warning: Failed to connect to Redis cache: {e}")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
JINA_API_KEY = os.getenv("JINA_API_KEY", "")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

llm = ChatGoogleGenerativeAI(
    model=GEMINI_MODEL,
    temperature=0.1,
    google_api_key=GEMINI_API_KEY,
    max_retries=3
)

creative_llm = ChatGoogleGenerativeAI(
    model=GEMINI_MODEL,
    temperature=0.6,
    google_api_key=GEMINI_API_KEY,
    max_retries=3
)


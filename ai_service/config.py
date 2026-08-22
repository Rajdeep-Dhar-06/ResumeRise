import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
JINA_API_KEY = os.getenv("JINA_API_KEY", "")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

llm = ChatGoogleGenerativeAI(
    model="gemini-3.6-flash",
    temperature=0.1,
    google_api_key=GEMINI_API_KEY,
    max_retries=3
)

creative_llm = ChatGoogleGenerativeAI(
    model="gemini-3.6-flash",
    temperature=0.6,
    google_api_key=GEMINI_API_KEY,
    max_retries=3
)

embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2",
    google_api_key=GEMINI_API_KEY
)

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from config import embeddings

def create_vector_store(text: str) -> FAISS:
    """
    Chunks a candidate career profile / transcript and creates an in-memory FAISS vector store.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
    )
    chunks = text_splitter.split_text(text)
    
    if not chunks:
        chunks = [text] if text and text.strip() else ["No candidate profile provided."]

    vector_store = FAISS.from_texts(
        texts=chunks, 
        embedding=embeddings
    )
    
    return vector_store

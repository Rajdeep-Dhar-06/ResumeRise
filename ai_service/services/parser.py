import scrubadub

def anonymize_text(text: str) -> str:
    """
    Removes PII (emails, phones) from candidate profile text.
    
    We use the scrubadub library to detect and remove sensitive 
    information before sending the text to the LLM for analysis.
    
    Args:
        text (str): The candidate's raw profile text.
        
    Returns:
        str: The anonymized text with PII scrubbed.
        
    Raises:
        ValueError: If the input text is too short or invalid.
    """
    if not text or len(text.strip()) < 20:
        raise ValueError("Candidate profile text must be at least 20 characters long.")
    return scrubadub.clean(text)

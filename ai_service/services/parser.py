import scrubadub

def anonymize_text(text: str) -> str:
    """Removes PII (emails, phones) from candidate profile text."""
    if not text or len(text.strip()) < 20:
        raise ValueError("Candidate profile text must be at least 20 characters long.")
    return scrubadub.clean(text)

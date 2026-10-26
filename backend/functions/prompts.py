profile_extraction_prompt = """
    Extract the user's professional profile from the following data.

    Preserve names, email addresses, capitalization, and technical terms.
    Do not invent information that is not present in the source.
    Assign a confidence level to each skill based on the evidence.

    Source data:
    {data}
    """
jd_extraction_prompt = """
    You are an expert technical recruiter. Analyze the provided Job Description (JD). 
    Extract a structured list of skills and technologies. 
    Map the requirements onto the 12 RADIX skill categories plus any named technologies[cite: 1]. 
    Because this is written in natural prose, rely on semantic understanding rather than plain keyword-matching[cite: 1]. 
    The skill signal is heavily concentrated in sections like 'Key Responsibilities' and 'What We're Looking For' — start your analysis there[cite: 1].\n\n
    
    data:
    {data}
"""

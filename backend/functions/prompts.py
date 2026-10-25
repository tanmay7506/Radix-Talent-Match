profile_extraction_prompt = """
    Extract the user's professional profile from the following data.

    Preserve names, email addresses, capitalization, and technical terms.
    Do not invent information that is not present in the source.
    Assign a confidence level to each skill based on the evidence.

    Source data:
    {data}
    """

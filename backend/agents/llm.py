import os
from typing import Optional


async def generate_text(
    system_prompt: str,
    user_prompt: str,
    *,
    temperature: float = 0.2,
) -> Optional[str]:
    groq_key = os.getenv("GROQ_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    if groq_key:
        from langchain_groq import ChatGroq

        client = ChatGroq(
            api_key=groq_key,
            model="llama-3.3-70b-versatile",
            temperature=temperature,
        )
        response = await client.ainvoke(
            [
                ("system", system_prompt),
                ("human", user_prompt),
            ]
        )
        return getattr(response, "content", None)

    if gemini_key:
        from langchain_google_genai import ChatGoogleGenerativeAI

        client = ChatGoogleGenerativeAI(
            google_api_key=gemini_key,
            model="gemini-1.5-flash",
            temperature=temperature,
        )
        response = await client.ainvoke(
            [
                ("system", system_prompt),
                ("human", user_prompt),
            ]
        )
        return getattr(response, "content", None)

    return None


def stream_chunks(text: str, chunk_size: int = 80) -> list[str]:
    if not text:
        return []
    return [text[index : index + chunk_size] for index in range(0, len(text), chunk_size)]

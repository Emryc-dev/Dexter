from datetime import datetime
import json
from pathlib import Path

from langchain_community.utilities import DuckDuckGoSearchAPIWrapper, WikipediaAPIWrapper
from langchain_core.tools import Tool


OUTPUT_FILE = Path(__file__).with_name("research_output.txt")


def save_to_txt(data: str) -> str:
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_text = f"--- Research Output ---\nTimestamp: {timestamp}\n\n{data}\n\n"
    with OUTPUT_FILE.open("a", encoding="utf-8") as file:
        file.write(formatted_text)
    return f"Data successfully saved to {OUTPUT_FILE.name} at {timestamp}"


search_client = DuckDuckGoSearchAPIWrapper(max_results=5)
wikipedia_client = WikipediaAPIWrapper(top_k_results=1, doc_content_chars_max=2_000)


def safe_web_search(query: str) -> str:
    try:
        results = search_client.results(query, max_results=5, source="text")
        return json.dumps(results, ensure_ascii=False)
    except Exception as exc:
        return f"Web search unavailable ({type(exc).__name__}). Continue without it."


def safe_wikipedia_search(query: str) -> str:
    try:
        documents = wikipedia_client.load(query)
        results = [
            {
                "title": document.metadata.get("title", ""),
                "url": document.metadata.get("source", ""),
                "summary": document.metadata.get("summary", ""),
            }
            for document in documents
        ]
        return json.dumps(results, ensure_ascii=False)
    except Exception as exc:
        return f"Wikipedia unavailable ({type(exc).__name__}). Continue without it."


save_tool = Tool(
    name="save_text_to_file",
    func=save_to_txt,
    description="Save the final research text to the local research output file.",
)

search_tool = Tool(
    name="search",
    func=safe_web_search,
    description="Search the web for current information.",
)

wiki_tool = Tool(
    name="wikipedia",
    func=safe_wikipedia_search,
    description="Search Wikipedia for concise encyclopedic background.",
)

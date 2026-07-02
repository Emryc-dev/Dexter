from dotenv import load_dotenv
import re
from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.agents import AgentExecutor, create_tool_calling_agent

from tools import save_tool, search_tool, wiki_tool


load_dotenv()


class ResearchResponse(BaseModel):
    topic: str = ""
    summary: str
    sources: list[str] = Field(default_factory=list)
    tools_used: list[str] = Field(default_factory=list)

    @field_validator("sources", mode="before")
    @classmethod
    def keep_only_source_urls(cls, sources):
        """Prevent tool errors, snippets, and search queries from becoming sources."""
        if not isinstance(sources, list):
            return []

        normalized = []
        for source in sources:
            if not isinstance(source, str):
                continue

            candidates = re.findall(r"https?://[^\s<>\])}]+", source)
            if not candidates and source.startswith(("http://", "https://")):
                candidates = [source]

            for candidate in candidates:
                url = candidate.rstrip(".,;:'\"")
                parsed = urlparse(url)
                if parsed.scheme in {"http", "https"} and parsed.netloc:
                    normalized.append(url)

        return list(dict.fromkeys(normalized))[:10]


parser = PydanticOutputParser(pydantic_object=ResearchResponse)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
            You are Dexter, a helpful research assistant.
            Answer the user's question clearly and use tools only when useful.
            Return the final answer in the requested JSON format and no other text.
            If a tool fails, continue with the information available and mention the limitation.
            The sources field must contain only direct http:// or https:// URLs copied from
            successful tool results. Never put search queries, snippets, status messages,
            tool errors, or explanations in sources. Use an empty list if no URL is available.

            {format_instructions}
            """,
        ),
        ("placeholder", "{chat_history}"),
        ("human", "{query}"),
        ("placeholder", "{agent_scratchpad}"),
    ]
).partial(format_instructions=parser.get_format_instructions())

llm = ChatOpenAI(model="gpt-5.4-mini", timeout=120, max_retries=1)
tools = [search_tool, wiki_tool, save_tool]

agent = create_tool_calling_agent(llm=llm, prompt=prompt, tools=tools)
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=False,
    max_iterations=8,
    handle_parsing_errors=True,
)


def run_research(query: str) -> ResearchResponse:
    """Run Dexter for one web/API request and normalize its response."""
    raw_response = agent_executor.invoke({"query": query, "chat_history": []})
    output = raw_response.get("output", "")

    if not isinstance(output, str):
        output = str(output)

    try:
        return parser.parse(output)
    except Exception:
        # Keep the API useful even if the model returns valid prose instead of JSON.
        return ResearchResponse(summary=output or "Dexter n'a renvoyé aucune réponse.")

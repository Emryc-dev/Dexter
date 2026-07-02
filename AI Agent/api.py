from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from main import run_research


app = FastAPI(title="Dexter API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class QueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=10_000)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "Dexter"}


@app.post("/research")
def research(request: QueryRequest) -> dict:
    query = request.query.strip()
    if not query:
        raise HTTPException(status_code=422, detail="La question ne peut pas être vide.")

    try:
        result = run_research(query)
        return result.model_dump()
    except Exception as exc:
        # Keep internal details in the server logs without exposing secrets to clients.
        print(f"Dexter research error: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail="Dexter n'a pas pu terminer cette recherche.",
        ) from exc

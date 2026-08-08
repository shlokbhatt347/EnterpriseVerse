from datetime import datetime, timezone
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="EnterpriseVerse API", version="0.1.0")

class FounderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)

class BusinessCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    structure: str
    founder_names: list[str] = Field(min_length=1, max_length=6)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "enterpriseverse-api"}

@app.get("/api/v1/world")
def world() -> dict[str, str]:
    return {"status": "prototype", "server_time": datetime.now(timezone.utc).isoformat()}

@app.post("/api/v1/businesses")
def create_business(payload: BusinessCreate) -> dict:
    if payload.structure not in {"sole_trader", "partnership", "trio", "team"}:
        return {"error": "Unsupported business structure"}
    return {
        "name": payload.name,
        "structure": payload.structure,
        "founders": payload.founder_names,
        "status": "created",
    }

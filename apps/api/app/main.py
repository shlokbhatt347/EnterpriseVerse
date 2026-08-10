from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

app = FastAPI(title="EnterpriseVerse API", version="0.2.0")
CompetitionType = Literal["quick_match", "friends_only", "private", "classroom"]

class FounderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)

class BusinessCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    structure: str
    founder_names: list[str] = Field(min_length=1, max_length=6)

class CompetitionRoomCreate(BaseModel):
    host_id: str = Field(min_length=1, max_length=120)
    display_name: str = Field(min_length=1, max_length=80)
    type: CompetitionType = "friends_only"
    max_players: int = Field(default=4, ge=2, le=8)
    duration_days: int = Field(default=30, ge=5, le=90)
    world_seed: int = Field(default=0, ge=0)

class JoinRoom(BaseModel):
    player_id: str = Field(min_length=1, max_length=120)
    display_name: str = Field(min_length=1, max_length=80)

class ReadyRequest(BaseModel):
    player_id: str = Field(min_length=1, max_length=120)
    ready: bool

class DecisionRequest(BaseModel):
    player_id: str = Field(min_length=1, max_length=120)
    day: int = Field(ge=1)
    decision_id: str = Field(min_length=1, max_length=120)

rooms: dict[str, dict] = {}
connections: dict[str, set[WebSocket]] = {}

def now() -> str:
    return datetime.now(timezone.utc).isoformat()

def public_room(room: dict) -> dict:
    return {key: value for key, value in room.items() if key != "decisions"}

async def broadcast(room_id: str, event: str, payload: dict) -> None:
    room = rooms[room_id]
    message = {"event": event, "room": public_room(room), "data": payload}
    dead: list[WebSocket] = []
    for socket in connections.get(room_id, set()):
        try:
            await socket.send_json(message)
        except Exception:
            dead.append(socket)
    for socket in dead:
        connections.get(room_id, set()).discard(socket)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "enterpriseverse-api"}

@app.get("/api/v1/world")
def world() -> dict[str, str]:
    return {"status": "prototype", "server_time": now()}

@app.post("/api/v1/businesses")
def create_business(payload: BusinessCreate) -> dict:
    if payload.structure not in {"sole_trader", "partnership", "trio", "team"}:
        raise HTTPException(status_code=422, detail="Unsupported business structure")
    return {"name": payload.name, "structure": payload.structure, "founders": payload.founder_names, "status": "created"}

@app.post("/api/v1/competitions/rooms")
def create_competition_room(payload: CompetitionRoomCreate) -> dict:
    room_id = str(uuid4())
    seed = payload.world_seed or (int(datetime.now(timezone.utc).timestamp() * 1000) & 0xFFFFFFFF)
    rooms[room_id] = {"id": room_id, "status": "lobby", "type": payload.type, "max_players": payload.max_players, "duration_days": payload.duration_days, "world_seed": seed, "current_day": 1, "host_id": payload.host_id, "created_at": now(), "players": [{"id": payload.host_id, "display_name": payload.display_name, "ready": False, "connected": False, "score": 0.0}], "decisions": {}}
    connections[room_id] = set()
    return public_room(rooms[room_id])

@app.get("/api/v1/competitions/rooms/{room_id}")
def get_competition_room(room_id: str) -> dict:
    room = rooms.get(room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Competition room not found")
    return public_room(room)

@app.post("/api/v1/competitions/rooms/{room_id}/join")
def join_competition_room(room_id: str, payload: JoinRoom) -> dict:
    room = rooms.get(room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Competition room not found")
    if room["status"] != "lobby":
        raise HTTPException(status_code=409, detail="Competition has already started")
    if any(player["id"] == payload.player_id for player in room["players"]):
        return public_room(room)
    if len(room["players"]) >= room["max_players"]:
        raise HTTPException(status_code=409, detail="Competition room is full")
    room["players"].append({"id": payload.player_id, "display_name": payload.display_name, "ready": False, "connected": False, "score": 0.0})
    return public_room(room)

@app.post("/api/v1/competitions/rooms/{room_id}/ready")
def set_ready(room_id: str, payload: ReadyRequest) -> dict:
    room = rooms.get(room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Competition room not found")
    player = next((item for item in room["players"] if item["id"] == payload.player_id), None)
    if player is None:
        raise HTTPException(status_code=404, detail="Player is not in this room")
    if room["status"] != "lobby":
        raise HTTPException(status_code=409, detail="Lobby is closed")
    player["ready"] = payload.ready
    return public_room(room)

@app.post("/api/v1/competitions/rooms/{room_id}/start")
def start_competition(room_id: str, payload: ReadyRequest) -> dict:
    room = rooms.get(room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Competition room not found")
    if payload.player_id != room["host_id"]:
        raise HTTPException(status_code=403, detail="Only the host can start the competition")
    if room["status"] != "lobby":
        raise HTTPException(status_code=409, detail="Competition cannot be started from its current state")
    if len(room["players"]) < 2 or not all(player["ready"] for player in room["players"]):
        raise HTTPException(status_code=409, detail="At least two ready players are required")
    room["status"] = "active"
    return public_room(room)

@app.post("/api/v1/competitions/rooms/{room_id}/decisions")
def submit_decision(room_id: str, payload: DecisionRequest) -> dict:
    room = rooms.get(room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Competition room not found")
    if room["status"] != "active":
        raise HTTPException(status_code=409, detail="Competition is not active")
    if payload.day != room["current_day"]:
        raise HTTPException(status_code=409, detail="Decision belongs to a different simulation day")
    if not any(player["id"] == payload.player_id for player in room["players"]):
        raise HTTPException(status_code=403, detail="Player is not in this room")
    room["decisions"][payload.player_id] = {"day": payload.day, "decision_id": payload.decision_id, "submitted_at": now()}
    submitted = len(room["decisions"])
    resolved = submitted == len(room["players"])
    if resolved:
        room["current_day"] += 1
        room["decisions"] = {}
        if room["current_day"] > room["duration_days"]:
            room["status"] = "completed"
    return {**public_room(room), "submitted": submitted, "round_resolved": resolved}

@app.websocket("/api/v1/competitions/rooms/{room_id}/ws")
async def competition_socket(websocket: WebSocket, room_id: str) -> None:
    room = rooms.get(room_id)
    player_id = websocket.query_params.get("player_id")
    if room is None:
        await websocket.close(code=4404, reason="Competition room not found")
        return
    if not player_id or not any(player["id"] == player_id for player in room["players"]):
        await websocket.close(code=4403, reason="Player is not in this room")
        return
    await websocket.accept()
    connections.setdefault(room_id, set()).add(websocket)
    player = next(item for item in room["players"] if item["id"] == player_id)
    player["connected"] = True
    await websocket.send_json({"event": "room_state", "room": public_room(room), "data": {}})
    await broadcast(room_id, "player_presence", {"player_id": player_id, "connected": True})
    try:
        while True:
            message = await websocket.receive_json()
            if message.get("type") == "ping":
                await websocket.send_json({"event": "pong", "room": public_room(room), "data": {}})
    except WebSocketDisconnect:
        connections.get(room_id, set()).discard(websocket)
        player["connected"] = False
        await broadcast(room_id, "player_presence", {"player_id": player_id, "connected": False})

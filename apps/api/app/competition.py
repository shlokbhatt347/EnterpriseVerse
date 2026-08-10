from datetime import datetime, timezone
from uuid import uuid4


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_room(host_id: str, display_name: str, competition_type: str, max_players: int, duration_days: int, world_seed: int) -> dict:
    return {
        "id": str(uuid4()),
        "status": "lobby",
        "type": competition_type,
        "max_players": max_players,
        "duration_days": duration_days,
        "world_seed": world_seed,
        "current_day": 1,
        "host_id": host_id,
        "created_at": utc_now(),
        "players": [{"id": host_id, "display_name": display_name, "ready": False, "connected": False, "score": 0.0}],
        "decisions": {},
    }


def public_room(room: dict) -> dict:
    return {key: value for key, value in room.items() if key != "decisions"}


def submit_round_decision(room: dict, player_id: str, day: int, decision_id: str) -> tuple[int, bool]:
    room["decisions"][player_id] = {"day": day, "decision_id": decision_id, "submitted_at": utc_now()}
    submitted = len(room["decisions"])
    resolved = submitted == len(room["players"])
    if resolved:
        room["current_day"] += 1
        room["decisions"] = {}
        if room["current_day"] > room["duration_days"]:
            room["status"] = "completed"
    return submitted, resolved

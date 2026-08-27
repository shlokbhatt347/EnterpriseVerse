"""Phase 2 authority helpers.

The production competition path is implemented by Supabase RPCs. These small
helpers define the same validation contract for API-side integrations without
accepting client-owned player identity or economic outcomes.
"""

from dataclasses import dataclass


ALLOWED_DECISIONS = frozenset({
    "balanced_growth",
    "aggressive_growth",
    "defensive_cash",
})


@dataclass(frozen=True)
class AuthorizedDecision:
    user_id: str
    room_id: str
    round: int
    decision_id: str
    request_id: str


def validate_decision(
    *,
    authenticated_user_id: str | None,
    room_id: str,
    round: int,
    decision_id: str,
    request_id: str,
) -> AuthorizedDecision:
    if not authenticated_user_id:
        raise ValueError("Authentication required")
    if not room_id.strip() or not request_id.strip():
        raise ValueError("Room and request IDs are required")
    if round < 1:
        raise ValueError("Invalid round")
    normalized = decision_id.strip().lower()
    if normalized not in ALLOWED_DECISIONS:
        raise ValueError("Unsupported competition decision")
    return AuthorizedDecision(authenticated_user_id, room_id.strip(), round, normalized, request_id.strip())

import pytest

from phase2_authority import validate_decision


def test_validate_decision_uses_authenticated_identity():
    result = validate_decision(
        authenticated_user_id="user-1",
        room_id="room-1",
        round=2,
        decision_id=" BALANCED_GROWTH ",
        request_id="request-1",
    )
    assert result.user_id == "user-1"
    assert result.room_id == "room-1"
    assert result.decision_id == "balanced_growth"
    assert result.request_id == "request-1"


@pytest.mark.parametrize(
    "kwargs",
    [
        {"authenticated_user_id": None, "room_id": "r", "round": 1, "decision_id": "balanced_growth", "request_id": "q"},
        {"authenticated_user_id": "u", "room_id": "", "round": 1, "decision_id": "balanced_growth", "request_id": "q"},
        {"authenticated_user_id": "u", "room_id": "r", "round": 1, "decision_id": "balanced_growth", "request_id": ""},
        {"authenticated_user_id": "u", "room_id": "r", "round": 0, "decision_id": "balanced_growth", "request_id": "q"},
        {"authenticated_user_id": "u", "room_id": "r", "round": 1, "decision_id": "", "request_id": "q"},
        {"authenticated_user_id": "u", "room_id": "r", "round": 1, "decision_id": "unknown_decision", "request_id": "q"},
        {"authenticated_user_id": "u", "room_id": "r", "round": 1, "decision_id": "x" * 121, "request_id": "q"},
    ],
)
def test_validate_decision_rejects_invalid_input(kwargs):
    with pytest.raises(ValueError):
        validate_decision(**kwargs)

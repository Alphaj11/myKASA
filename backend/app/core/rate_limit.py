import time
from collections import defaultdict

from fastapi import HTTPException, status

MAX_ATTEMPTS = 5
WINDOW_SECONDS = 15 * 60

# Limiteur en memoire simple (suffisant pour un seul process de dev / MVP).
# A remplacer par un compteur partage (Redis) si l'API tourne en plusieurs workers.
_attempts: dict[str, list[float]] = defaultdict(list)


def check_rate_limit(key: str) -> None:
    now = time.monotonic()
    recent = [t for t in _attempts[key] if now - t < WINDOW_SECONDS]
    _attempts[key] = recent
    if len(recent) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Trop de tentatives. Réessayez dans quelques minutes.",
        )


def record_failed_attempt(key: str) -> None:
    _attempts[key].append(time.monotonic())


def reset_attempts(key: str) -> None:
    _attempts.pop(key, None)

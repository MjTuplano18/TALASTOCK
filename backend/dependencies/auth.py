import os
from fastapi import HTTPException, Header
from supabase import create_client

_auth_client = None


def _get_auth_client():
    global _auth_client
    if _auth_client is None:
        _auth_client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY"),
        )
    return _auth_client


async def verify_token(authorization: str = Header(...)) -> dict:
    try:
        token = authorization.replace("Bearer ", "").strip()
        client = _get_auth_client()
        response = client.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": response.user.id, "email": response.user.email}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")

import os
from fastapi import HTTPException, Header
from supabase import create_client

_auth_client = None


def _get_auth_client():
    """Get Supabase client for auth verification using anon key"""
    global _auth_client
    if _auth_client is None:
        # Use anon key for verifying user tokens from frontend
        _auth_client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_ANON_KEY"),
        )
    return _auth_client


async def verify_token(authorization: str = Header(...)) -> dict:
    """Verify JWT token from frontend and return user info"""
    try:
        token = authorization.replace("Bearer ", "").strip()
        client = _get_auth_client()
        response = client.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": response.user.id, "email": response.user.email}
    except HTTPException:
        raise
    except Exception as e:
        # Log the error for debugging
        print(f"Auth error: {str(e)}")
        raise HTTPException(status_code=401, detail="Unauthorized")

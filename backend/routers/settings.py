from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Any
from database.supabase import get_supabase
from dependencies.auth import verify_token

router = APIRouter(prefix="/settings", tags=["settings"])


class SettingUpdate(BaseModel):
    value: Any


@router.get("/{key}")
async def get_setting(
    key: str,
    supabase=Depends(get_supabase),
    user=Depends(verify_token)
):
    """Get a setting by key"""
    try:
        print(f"[GET] Fetching setting: {key}")
        result = supabase.table("settings").select("*").eq("key", key).execute()
        print(f"[GET] Result: {result.data}")
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")
        
        return {"success": True, "data": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GET] Error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{key}")
async def update_setting(
    key: str,
    payload: SettingUpdate,
    supabase=Depends(get_supabase),
    user=Depends(verify_token)
):
    """Update a setting by key"""
    try:
        print(f"[PUT] Updating setting: {key} with value: {payload.value}")
        
        # Check if setting exists
        existing = supabase.table("settings").select("id").eq("key", key).execute()
        print(f"[PUT] Existing check: {existing.data}")
        
        if not existing.data or len(existing.data) == 0:
            raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")
        
        # Update the setting (value is stored as JSONB, so it can be any type)
        result = supabase.table("settings").update({
            "value": payload.value
        }).eq("key", key).execute()
        
        print(f"[PUT] Update result: {result.data}")
        
        if not result.data or len(result.data) == 0:
            # Fetch the updated record
            updated = supabase.table("settings").select("*").eq("key", key).execute()
            if updated.data and len(updated.data) > 0:
                return {"success": True, "data": updated.data[0]}
            raise HTTPException(status_code=500, detail="Update failed")
        
        return {"success": True, "data": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PUT] Error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/")
async def get_all_settings(
    supabase=Depends(get_supabase),
    user=Depends(verify_token)
):
    """Get all settings"""
    try:
        result = supabase.table("settings").select("*").execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

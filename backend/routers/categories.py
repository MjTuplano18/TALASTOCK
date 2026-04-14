from fastapi import APIRouter, Depends
from database.supabase import get_supabase
from dependencies.auth import verify_token
from models.schemas import CategoryCreate
from lib.cache import get_cached, set_cached, invalidate

router = APIRouter(prefix="/categories", tags=["categories"])

CACHE_KEY = "categories:list"
CACHE_TTL = 60  # categories change rarely


@router.get("/")
async def list_categories(user=Depends(verify_token)):
    cached = await get_cached(CACHE_KEY)
    if cached:
        return {"success": True, "data": cached, "message": "OK"}

    db = get_supabase()
    result = db.table("categories").select("*").order("name").execute()
    await set_cached(CACHE_KEY, result.data, CACHE_TTL)
    return {"success": True, "data": result.data, "message": "OK"}


@router.post("/", status_code=201)
async def create_category(payload: CategoryCreate, user=Depends(verify_token)):
    db = get_supabase()
    result = db.table("categories").insert({"name": payload.name}).execute()
    await invalidate(CACHE_KEY)
    return {"success": True, "data": result.data[0], "message": "Category created"}


@router.put("/{category_id}")
async def update_category(
    category_id: str, payload: CategoryCreate, user=Depends(verify_token)
):
    db = get_supabase()
    result = (
        db.table("categories")
        .update({"name": payload.name})
        .eq("id", category_id)
        .execute()
    )
    await invalidate(CACHE_KEY)
    return {"success": True, "data": result.data[0], "message": "Category updated"}


@router.delete("/{category_id}", status_code=204)
async def delete_category(category_id: str, user=Depends(verify_token)):
    db = get_supabase()
    db.table("categories").delete().eq("id", category_id).execute()
    await invalidate(CACHE_KEY)

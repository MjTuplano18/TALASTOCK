from fastapi import APIRouter, Depends, HTTPException
from database.supabase import get_supabase
from dependencies.auth import verify_token
from models.schemas import ProductCreate, ProductUpdate, APIResponse
from lib.cache import get_cached, set_cached, invalidate_pattern

router = APIRouter(prefix="/products", tags=["products"])

CACHE_TTL = 30  # seconds


@router.get("/")
async def list_products(
    page: int = 1,
    per_page: int = 20,
    category_id: str | None = None,
    user=Depends(verify_token),
):
    cache_key = f"products:list:{page}:{per_page}:{category_id}"
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached, "message": "OK"}

    db = get_supabase()
    query = (
        db.table("products")
        .select("*, categories(name), inventory(quantity, low_stock_threshold)")
        .eq("is_active", True)
        .order("created_at", desc=True)
        .range((page - 1) * per_page, page * per_page - 1)
    )
    if category_id:
        query = query.eq("category_id", category_id)

    result = query.execute()
    await set_cached(cache_key, result.data, CACHE_TTL)
    return {"success": True, "data": result.data, "message": "OK"}


@router.post("/", status_code=201)
async def create_product(payload: ProductCreate, user=Depends(verify_token)):
    db = get_supabase()
    result = db.table("products").insert(payload.model_dump()).execute()
    await invalidate_pattern("products:*")
    return {"success": True, "data": result.data[0], "message": "Product created"}


@router.put("/{product_id}")
async def update_product(
    product_id: str, payload: ProductUpdate, user=Depends(verify_token)
):
    db = get_supabase()
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    result = db.table("products").update(data).eq("id", product_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    await invalidate_pattern("products:*")
    return {"success": True, "data": result.data[0], "message": "Product updated"}


@router.delete("/{product_id}", status_code=204)
async def delete_product(product_id: str, user=Depends(verify_token)):
    db = get_supabase()
    db.table("products").update({"is_active": False}).eq("id", product_id).execute()
    await invalidate_pattern("products:*")

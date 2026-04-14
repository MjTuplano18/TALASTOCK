from fastapi import APIRouter, Depends
from database.supabase import get_supabase
from dependencies.auth import verify_token
from models.schemas import InventoryAdjustment
from lib.cache import get_cached, set_cached, invalidate_pattern

router = APIRouter(prefix="/inventory", tags=["inventory"])

CACHE_TTL = 15  # shorter TTL — inventory changes frequently


@router.get("/")
async def list_inventory(user=Depends(verify_token)):
    cache_key = "inventory:list"
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached, "message": "OK"}

    db = get_supabase()
    result = (
        db.table("inventory")
        .select("*, products(name, sku, cost_price)")
        .order("updated_at", desc=True)
        .execute()
    )
    await set_cached(cache_key, result.data, CACHE_TTL)
    return {"success": True, "data": result.data, "message": "OK"}


@router.get("/low-stock")
async def low_stock(user=Depends(verify_token)):
    db = get_supabase()
    result = (
        db.table("inventory")
        .select("*, products(name, sku)")
        .execute()
    )
    low = [
        item for item in result.data
        if item["quantity"] <= item["low_stock_threshold"]
    ]
    return {"success": True, "data": low, "message": "OK"}


@router.post("/{product_id}/adjust")
async def adjust_inventory(
    product_id: str,
    payload: InventoryAdjustment,
    user=Depends(verify_token),
):
    db = get_supabase()
    db.table("inventory").update({"quantity": payload.quantity}).eq(
        "product_id", product_id
    ).execute()
    db.table("stock_movements").insert(
        {
            "product_id": product_id,
            "type": "adjustment",
            "quantity": payload.quantity,
            "note": payload.note,
            "created_by": user["id"],
        }
    ).execute()
    await invalidate_pattern("inventory:*")
    return {"success": True, "data": None, "message": "Inventory adjusted"}

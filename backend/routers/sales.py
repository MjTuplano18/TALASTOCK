from fastapi import APIRouter, Depends, HTTPException
from database.supabase import get_supabase
from dependencies.auth import verify_token
from models.schemas import SaleCreate
from lib.cache import get_cached, set_cached, invalidate_pattern

router = APIRouter(prefix="/sales", tags=["sales"])

CACHE_TTL = 30


@router.get("/")
async def list_sales(page: int = 1, per_page: int = 20, user=Depends(verify_token)):
    cache_key = f"sales:list:{page}:{per_page}"
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached, "message": "OK"}

    db = get_supabase()
    result = (
        db.table("sales")
        .select("*, sale_items(*, products(name, sku))")
        .order("created_at", desc=True)
        .range((page - 1) * per_page, page * per_page - 1)
        .execute()
    )
    await set_cached(cache_key, result.data, CACHE_TTL)
    return {"success": True, "data": result.data, "message": "OK"}


@router.post("/", status_code=201)
async def create_sale(payload: SaleCreate, user=Depends(verify_token)):
    db = get_supabase()

    # Check stock for each item
    for item in payload.items:
        inv = (
            db.table("inventory")
            .select("quantity, products(name)")
            .eq("product_id", item.product_id)
            .single()
            .execute()
        )
        if not inv.data or inv.data["quantity"] < item.quantity:
            name = inv.data["products"]["name"] if inv.data else item.product_id
            raise HTTPException(
                status_code=409,
                detail=f"Insufficient stock for: {name}",
            )

    total = sum(item.quantity * float(item.unit_price) for item in payload.items)

    sale = (
        db.table("sales")
        .insert({"total_amount": total, "notes": payload.notes, "created_by": user["id"]})
        .execute()
    )
    sale_id = sale.data[0]["id"]

    # Insert sale items
    db.table("sale_items").insert(
        [
            {
                "sale_id": sale_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
            }
            for item in payload.items
        ]
    ).execute()

    # Decrease inventory + record movements
    for item in payload.items:
        current = (
            db.table("inventory")
            .select("quantity")
            .eq("product_id", item.product_id)
            .single()
            .execute()
        )
        new_qty = current.data["quantity"] - item.quantity
        db.table("inventory").update({"quantity": new_qty}).eq(
            "product_id", item.product_id
        ).execute()
        db.table("stock_movements").insert(
            {
                "product_id": item.product_id,
                "type": "sale",
                "quantity": item.quantity,
                "note": f"Sale {sale_id}",
                "created_by": user["id"],
            }
        ).execute()

    await invalidate_pattern("sales:*")
    await invalidate_pattern("inventory:*")
    return {"success": True, "data": sale.data[0], "message": "Sale recorded"}

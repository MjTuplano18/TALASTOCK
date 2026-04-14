# API Standards

## Base Structure
All API endpoints follow REST conventions.
Base URL: `http://localhost:8000/api/v1`

## URL Naming Conventions
- Use lowercase, hyphen-separated resource names
- Always use plural nouns for collections
- Never use verbs in URLs — use HTTP methods instead

```
✅ GET    /api/v1/products
✅ POST   /api/v1/products
✅ PUT    /api/v1/products/{id}
✅ DELETE /api/v1/products/{id}
✅ GET    /api/v1/products/{id}/stock-movements
❌ GET    /api/v1/getProducts
❌ POST   /api/v1/createProduct
```

## Standard Response Format
Every API response must follow this exact structure:

```json
{
  "success": true,
  "data": {},
  "message": "Products fetched successfully",
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

Error response:
```json
{
  "success": false,
  "data": null,
  "message": "Product not found",
  "error_code": "PRODUCT_NOT_FOUND"
}
```

## HTTP Status Codes
- `200` — Success (GET, PUT)
- `201` — Created (POST)
- `204` — Deleted (DELETE)
- `400` — Bad request / validation error
- `401` — Unauthenticated
- `403` — Unauthorized (no permission)
- `404` — Resource not found
- `500` — Internal server error

## FastAPI Router Pattern
```python
# backend/routers/products.py
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models.schemas import ProductCreate, ProductResponse
from database.supabase import get_supabase

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/", response_model=List[ProductResponse])
async def get_products(
    page: int = 1,
    per_page: int = 20,
    category_id: str = None,
    supabase=Depends(get_supabase)
):
    try:
        query = supabase.table("products").select("*, categories(*)")
        if category_id:
            query = query.eq("category_id", category_id)
        result = query.range((page-1)*per_page, page*per_page-1).execute()
        return {"success": True, "data": result.data, "message": "OK"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Authentication
- All protected routes require Bearer token in Authorization header
- Token is obtained from Supabase Auth
- Use `Depends(verify_token)` on all protected routes

```python
# Frontend API call pattern
const response = await fetch('/api/v1/products', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
})
```

## Pagination
- Default page size: 20 items
- Max page size: 100 items
- Always include `meta.total` in list responses

## Versioning
- Current version: v1
- Always prefix routes with `/api/v1/`
- Never break existing endpoints — add new versions if needed

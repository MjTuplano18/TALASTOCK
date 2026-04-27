from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from database.supabase import get_supabase
from dependencies.auth import verify_token
from models.schemas import CustomerCreate, CustomerUpdate, CustomerResponse
from lib.cache import get_cached, set_cached, invalidate
from datetime import datetime

router = APIRouter(prefix="/customers", tags=["customers"])

CACHE_KEY_PREFIX = "customers"
CACHE_TTL = 300  # 5 minutes


def get_cache_key(suffix: str = "list") -> str:
    return f"{CACHE_KEY_PREFIX}:{suffix}"


@router.get("/")
async def list_customers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    user=Depends(verify_token),
):
    """
    List customers with pagination, filtering, and search.
    
    - **page**: Page number (default: 1)
    - **per_page**: Items per page (default: 20, max: 100)
    - **is_active**: Filter by active status (optional)
    - **search**: Search by customer name (optional)
    """
    # Build cache key based on query params
    cache_key = get_cache_key(f"list:p{page}:pp{per_page}:a{is_active}:s{search}")
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached["data"], "message": "OK", "meta": cached["meta"]}

    db = get_supabase()
    
    # Build query
    query = db.table("customers").select("*", count="exact")
    
    # Apply filters
    if is_active is not None:
        query = query.eq("is_active", is_active)
    
    if search:
        query = query.ilike("name", f"%{search}%")
    
    # Apply pagination
    start = (page - 1) * per_page
    end = start + per_page - 1
    query = query.range(start, end).order("created_at", desc=True)
    
    result = query.execute()
    
    # Calculate total count
    total = result.count if hasattr(result, 'count') else len(result.data)
    
    response_data = {
        "data": result.data,
        "meta": {
            "total": total,
            "page": page,
            "per_page": per_page,
        }
    }
    
    await set_cached(cache_key, response_data, CACHE_TTL)
    
    return {
        "success": True,
        "data": result.data,
        "message": "OK",
        "meta": response_data["meta"]
    }


@router.get("/overdue")
async def get_overdue_customers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user=Depends(verify_token)
):
    """List customers with overdue balances."""
    cache_key = get_cache_key(f"overdue:p{page}:pp{per_page}")
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached["data"], "message": "OK", "meta": cached["meta"]}

    db = get_supabase()
    today = datetime.utcnow().date().isoformat()
    overdue_sales_result = (
        db.table("credit_sales")
        .select("customer_id, amount, due_date")
        .in_("status", ["pending", "partially_paid", "overdue"])
        .lt("due_date", today)
        .execute()
    )

    customer_overdue: dict = {}
    for sale in overdue_sales_result.data:
        cid = sale["customer_id"]
        amount = float(sale["amount"])
        due_date = sale["due_date"]
        if cid not in customer_overdue:
            customer_overdue[cid] = {"total_overdue": 0, "oldest_due_date": due_date}
        customer_overdue[cid]["total_overdue"] += amount
        if due_date < customer_overdue[cid]["oldest_due_date"]:
            customer_overdue[cid]["oldest_due_date"] = due_date

    if not customer_overdue:
        return {"success": True, "data": [], "message": "OK",
                "meta": {"total": 0, "page": page, "per_page": per_page}}

    customers_result = (
        db.table("customers")
        .select("id, name, business_name, contact_number, current_balance, credit_limit, is_active")
        .in_("id", list(customer_overdue.keys()))
        .eq("is_active", True)
        .execute()
    )

    overdue_customers = []
    for customer in customers_result.data:
        cid = customer["id"]
        info = customer_overdue[cid]
        oldest = datetime.fromisoformat(info["oldest_due_date"]).date()
        days_overdue = (datetime.utcnow().date() - oldest).days
        overdue_customers.append({
            "id": cid,
            "customer_id": cid,
            "name": customer["name"],
            "business_name": customer.get("business_name"),
            "contact_number": customer.get("contact_number"),
            "current_balance": float(customer.get("current_balance", 0)),
            "overdue_balance": info["total_overdue"],
            "overdue_amount": info["total_overdue"],
            "days_overdue": days_overdue,
            "oldest_due_date": info["oldest_due_date"],
        })

    overdue_customers.sort(key=lambda x: x["days_overdue"], reverse=True)
    total = len(overdue_customers)
    start = (page - 1) * per_page
    paginated = overdue_customers[start:start + per_page]
    response_data = {"data": paginated, "meta": {"total": total, "page": page, "per_page": per_page}}
    await set_cached(cache_key, response_data, CACHE_TTL)
    return {"success": True, "data": paginated, "message": "OK", "meta": response_data["meta"]}


@router.get("/near-limit")
async def get_customers_near_limit(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    threshold: float = Query(0.8, ge=0.0, le=1.0),
    user=Depends(verify_token)
):
    """List customers near their credit limit (default threshold: 80%)."""
    cache_key = get_cache_key(f"near-limit:p{page}:pp{per_page}:t{threshold}")
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached["data"], "message": "OK", "meta": cached["meta"]}

    db = get_supabase()
    customers_result = (
        db.table("customers")
        .select("id, name, business_name, contact_number, current_balance, credit_limit")
        .eq("is_active", True)
        .gt("credit_limit", 0)
        .execute()
    )

    near_limit = []
    for customer in customers_result.data:
        balance = float(customer.get("current_balance", 0))
        limit = float(customer.get("credit_limit", 0))
        if limit > 0 and balance / limit >= threshold:
            near_limit.append({
                "customer_id": customer["id"],
                "name": customer["name"],
                "business_name": customer.get("business_name"),
                "contact_number": customer.get("contact_number"),
                "current_balance": balance,
                "credit_limit": limit,
                "available_credit": limit - balance,
                "utilization_percent": round(balance / limit * 100, 2),
            })

    near_limit.sort(key=lambda x: x["utilization_percent"], reverse=True)
    total = len(near_limit)
    start = (page - 1) * per_page
    paginated = near_limit[start:start + per_page]
    response_data = {"data": paginated, "meta": {"total": total, "page": page, "per_page": per_page}}
    await set_cached(cache_key, response_data, CACHE_TTL)
    return {"success": True, "data": paginated, "message": "OK", "meta": response_data["meta"]}


@router.get("/{customer_id}")
async def get_customer(customer_id: str, user=Depends(verify_token)):
    """
    Get customer details by ID.
    """
    cache_key = get_cache_key(f"detail:{customer_id}")
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached, "message": "OK"}

    db = get_supabase()
    result = db.table("customers").select("*").eq("id", customer_id).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )
    
    customer = result.data[0]
    await set_cached(cache_key, customer, CACHE_TTL)
    
    return {"success": True, "data": customer, "message": "OK"}


@router.post("/", status_code=201)
async def create_customer(payload: CustomerCreate, user=Depends(verify_token)):
    """
    Create a new customer.
    
    - **name**: Customer name (required)
    - **contact_number**: Contact number (optional)
    - **address**: Address (optional)
    - **business_name**: Business name (optional)
    - **credit_limit**: Credit limit in pesos (default: 0)
    - **payment_terms_days**: Payment terms in days (default: 30)
    - **notes**: Additional notes (optional)
    """
    db = get_supabase()
    
    # Prepare customer data
    customer_data = {
        "name": payload.name,
        "contact_number": payload.contact_number,
        "address": payload.address,
        "business_name": payload.business_name,
        "credit_limit": float(payload.credit_limit),
        "payment_terms_days": payload.payment_terms_days,
        "notes": payload.notes,
        "current_balance": 0,
        "is_active": True,
        "created_by": user["id"],
    }
    
    result = db.table("customers").insert(customer_data).execute()
    
    # Invalidate list cache
    await invalidate(f"{CACHE_KEY_PREFIX}:list*")
    
    return {
        "success": True,
        "data": result.data[0],
        "message": "Customer created successfully"
    }


@router.put("/{customer_id}")
async def update_customer(
    customer_id: str,
    payload: CustomerUpdate,
    user=Depends(verify_token)
):
    """
    Update customer information.
    
    All fields are optional. Only provided fields will be updated.
    """
    db = get_supabase()
    
    # Check if customer exists
    existing = db.table("customers").select("id").eq("id", customer_id).execute()
    if not existing.data:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )
    
    # Build update data (only include non-None fields)
    update_data = {}
    if payload.name is not None:
        update_data["name"] = payload.name
    if payload.contact_number is not None:
        update_data["contact_number"] = payload.contact_number
    if payload.address is not None:
        update_data["address"] = payload.address
    if payload.business_name is not None:
        update_data["business_name"] = payload.business_name
    if payload.credit_limit is not None:
        update_data["credit_limit"] = float(payload.credit_limit)
    if payload.payment_terms_days is not None:
        update_data["payment_terms_days"] = payload.payment_terms_days
    if payload.notes is not None:
        update_data["notes"] = payload.notes
    if payload.is_active is not None:
        update_data["is_active"] = payload.is_active
    
    # Add updated_at timestamp
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = (
        db.table("customers")
        .update(update_data)
        .eq("id", customer_id)
        .execute()
    )
    
    # Invalidate caches
    await invalidate(f"{CACHE_KEY_PREFIX}:list*")
    await invalidate(get_cache_key(f"detail:{customer_id}"))
    
    return {
        "success": True,
        "data": result.data[0],
        "message": "Customer updated successfully"
    }


@router.delete("/{customer_id}", status_code=200)
async def delete_customer(customer_id: str, user=Depends(verify_token)):
    """
    Soft delete a customer (mark as inactive).
    
    This does not permanently delete the customer from the database,
    but marks them as inactive to preserve historical data.
    """
    db = get_supabase()
    
    # Check if customer exists
    existing = db.table("customers").select("id").eq("id", customer_id).execute()
    if not existing.data:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )
    
    # Soft delete by marking as inactive
    result = (
        db.table("customers")
        .update({
            "is_active": False,
            "updated_at": datetime.utcnow().isoformat()
        })
        .eq("id", customer_id)
        .execute()
    )
    
    # Invalidate caches
    await invalidate(f"{CACHE_KEY_PREFIX}:list*")
    await invalidate(get_cache_key(f"detail:{customer_id}"))
    
    return {
        "success": True,
        "data": result.data[0],
        "message": "Customer deactivated successfully"
    }


@router.get("/{customer_id}/balance")
async def get_customer_balance(customer_id: str, user=Depends(verify_token)):
    """
    Get current balance for a customer.
    
    Returns:
    - current_balance: Total outstanding balance
    - credit_limit: Customer's credit limit
    - available_credit: Remaining credit (credit_limit - current_balance)
    - overdue_balance: Amount that is past due date
    """
    cache_key = get_cache_key(f"balance:{customer_id}")
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached, "message": "OK"}

    db = get_supabase()
    
    # Get customer details
    customer_result = db.table("customers").select("*").eq("id", customer_id).execute()
    
    if not customer_result.data:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )
    
    customer = customer_result.data[0]
    current_balance = float(customer.get("current_balance", 0))
    credit_limit = float(customer.get("credit_limit", 0))
    available_credit = credit_limit - current_balance
    
    # Calculate overdue balance
    today = datetime.utcnow().date().isoformat()
    overdue_sales_result = (
        db.table("credit_sales")
        .select("amount")
        .eq("customer_id", customer_id)
        .in_("status", ["pending", "partially_paid", "overdue"])
        .lt("due_date", today)
        .execute()
    )
    
    overdue_balance = sum(float(sale["amount"]) for sale in overdue_sales_result.data)
    
    balance_data = {
        "customer_id": customer_id,
        "customer_name": customer.get("name"),
        "current_balance": current_balance,
        "credit_limit": credit_limit,
        "available_credit": available_credit,
        "overdue_balance": overdue_balance,
        "is_active": customer.get("is_active", True),
    }
    
    await set_cached(cache_key, balance_data, CACHE_TTL)
    
    return {"success": True, "data": balance_data, "message": "OK"}


@router.get("/{customer_id}/statement")
async def get_customer_statement(
    customer_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user=Depends(verify_token)
):
    """
    Get customer statement showing all transactions (credit sales and payments).
    
    - **customer_id**: Customer ID (required)
    - **start_date**: Filter transactions >= start_date (ISO format) (optional)
    - **end_date**: Filter transactions <= end_date (ISO format) (optional)
    
    Returns a chronological list of all credit sales and payments with running balance.
    """
    cache_key = get_cache_key(f"statement:{customer_id}:sd{start_date}:ed{end_date}")
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached, "message": "OK"}

    db = get_supabase()
    
    # Get customer details
    customer_result = db.table("customers").select("*").eq("id", customer_id).execute()
    
    if not customer_result.data:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )
    
    customer = customer_result.data[0]
    
    # Get credit sales
    credit_sales_query = (
        db.table("credit_sales")
        .select("id, amount, due_date, status, notes, created_at")
        .eq("customer_id", customer_id)
    )
    
    if start_date:
        credit_sales_query = credit_sales_query.gte("created_at", start_date)
    if end_date:
        credit_sales_query = credit_sales_query.lte("created_at", end_date)
    
    credit_sales_result = credit_sales_query.order("created_at", desc=False).execute()
    
    # Get payments
    payments_query = (
        db.table("payments")
        .select("id, amount, payment_method, payment_date, notes, created_at")
        .eq("customer_id", customer_id)
    )
    
    if start_date:
        payments_query = payments_query.gte("payment_date", start_date)
    if end_date:
        payments_query = payments_query.lte("payment_date", end_date)
    
    payments_result = payments_query.order("payment_date", desc=False).execute()
    
    # Combine and sort transactions
    transactions = []
    
    for sale in credit_sales_result.data:
        transactions.append({
            "type": "credit_sale",
            "id": sale["id"],
            "date": sale["created_at"],
            "due_date": sale.get("due_date"),
            "description": f"Credit Sale - {sale.get('notes', 'N/A')}",
            "debit": float(sale["amount"]),
            "credit": 0,
            "status": sale.get("status"),
        })
    
    for payment in payments_result.data:
        transactions.append({
            "type": "payment",
            "id": payment["id"],
            "date": payment["payment_date"],
            "description": f"Payment ({payment['payment_method']}) - {payment.get('notes', 'N/A')}",
            "debit": 0,
            "credit": float(payment["amount"]),
        })
    
    # Sort by date
    transactions.sort(key=lambda x: x["date"])
    
    # Calculate running balance
    running_balance = 0
    for transaction in transactions:
        running_balance += transaction["debit"] - transaction["credit"]
        transaction["balance"] = running_balance
    
    statement_data = {
        "customer": {
            "id": customer["id"],
            "name": customer["name"],
            "business_name": customer.get("business_name"),
            "contact_number": customer.get("contact_number"),
        },
        "period": {
            "start_date": start_date,
            "end_date": end_date,
        },
        "current_balance": float(customer.get("current_balance", 0)),
        "credit_limit": float(customer.get("credit_limit", 0)),
        "transactions": transactions,
    }
    
    await set_cached(cache_key, statement_data, CACHE_TTL)
    
    return {"success": True, "data": statement_data, "message": "OK"}

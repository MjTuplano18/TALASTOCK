from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from database.supabase import get_supabase
from dependencies.auth import verify_token
from models.schemas import CreditSaleCreate, CreditSaleResponse
from lib.cache import get_cached, set_cached, invalidate
from datetime import datetime, timedelta
from decimal import Decimal
import logging

router = APIRouter(prefix="/credit-sales", tags=["credit-sales"])

CACHE_KEY_PREFIX = "credit_sales"
CACHE_TTL = 300  # 5 minutes

logger = logging.getLogger(__name__)


def get_cache_key(suffix: str = "list") -> str:
    return f"{CACHE_KEY_PREFIX}:{suffix}"


@router.post("", status_code=201)
async def create_credit_sale(payload: CreditSaleCreate, user=Depends(verify_token)):
    """
    Record a credit sale for a customer.
    
    - **customer_id**: Customer ID (required)
    - **sale_id**: Related sale ID (optional)
    - **amount**: Credit sale amount (required, must be positive)
    - **notes**: Additional notes (optional)
    - **override_credit_limit**: Override credit limit check (default: False)
    
    Business Rules:
    - Credit sale will be rejected if it exceeds customer's credit limit (unless override is True)
    - Due date is calculated based on customer's payment_terms_days
    - Customer balance is automatically updated
    - Returns warning if customer is near credit limit (>80%)
    """
    db = get_supabase()
    
    # Fetch customer details
    customer_result = db.table("customers").select("*").eq("id", payload.customer_id).execute()
    
    if not customer_result.data:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )
    
    customer = customer_result.data[0]
    
    # Check if customer is active
    if not customer.get("is_active", True):
        raise HTTPException(
            status_code=400,
            detail="Cannot create credit sale for inactive customer"
        )
    
    # Calculate new balance
    current_balance = Decimal(str(customer.get("current_balance", 0)))
    new_balance = current_balance + payload.amount
    credit_limit = Decimal(str(customer.get("credit_limit", 0)))
    
    # Credit limit enforcement
    warning_message = None
    if new_balance > credit_limit:
        if not payload.override_credit_limit:
            raise HTTPException(
                status_code=400,
                detail=f"Credit limit exceeded. Customer limit: ₱{credit_limit}, Current balance: ₱{current_balance}, New balance would be: ₱{new_balance}. Set override_credit_limit=true to proceed."
            )
        else:
            # Log override for audit
            logger.warning(f"Credit limit override: customer_id={payload.customer_id}, user_id={user.id}, amount={payload.amount}, new_balance={new_balance}, limit={credit_limit}")
            warning_message = f"Credit limit override applied. New balance (₱{new_balance}) exceeds limit (₱{credit_limit})."
    
    # Check if near credit limit (>80%)
    elif new_balance > (credit_limit * Decimal("0.8")) and credit_limit > 0:
        utilization = (new_balance / credit_limit * 100).quantize(Decimal("0.01"))
        warning_message = f"Customer is near credit limit ({utilization}% utilized)."
    
    # Calculate due date
    payment_terms_days = customer.get("payment_terms_days", 30)
    due_date = (datetime.utcnow() + timedelta(days=payment_terms_days)).date()
    
    # Create credit sale record
    credit_sale_data = {
        "customer_id": payload.customer_id,
        "sale_id": payload.sale_id,
        "amount": float(payload.amount),
        "due_date": due_date.isoformat(),
        "status": "pending",
        "notes": payload.notes,
        "created_by": user.id,
    }
    
    credit_sale_result = db.table("credit_sales").insert(credit_sale_data).execute()
    
    if not credit_sale_result.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to create credit sale"
        )
    
    credit_sale_id = credit_sale_result.data[0]["id"]
    
    # Log credit limit override to audit table if override was used
    if new_balance > credit_limit and payload.override_credit_limit:
        override_data = {
            "customer_id": payload.customer_id,
            "credit_sale_id": credit_sale_id,
            "previous_balance": float(current_balance),
            "sale_amount": float(payload.amount),
            "new_balance": float(new_balance),
            "credit_limit": float(credit_limit),
            "override_reason": payload.notes,
            "created_by": user.id,
        }
        
        try:
            db.table("credit_limit_overrides").insert(override_data).execute()
            logger.info(f"Credit limit override logged: credit_sale_id={credit_sale_id}, customer_id={payload.customer_id}")
        except Exception as e:
            # Log error but don't fail the transaction
            logger.error(f"Failed to log credit limit override: {str(e)}")
    
    # Update customer balance
    update_result = (
        db.table("customers")
        .update({
            "current_balance": float(new_balance),
            "updated_at": datetime.utcnow().isoformat()
        })
        .eq("id", payload.customer_id)
        .execute()
    )
    
    # Invalidate caches
    await invalidate(f"{CACHE_KEY_PREFIX}:list*")
    await invalidate(f"customers:detail:{payload.customer_id}")
    await invalidate(f"customers:list*")
    
    response_data = {
        "success": True,
        "data": credit_sale_result.data[0],
        "message": "Credit sale recorded successfully"
    }
    
    if warning_message:
        response_data["warning"] = warning_message
    
    return response_data


@router.get("")
async def list_credit_sales(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user=Depends(verify_token),
):
    """
    List credit sales with pagination and filtering.
    
    - **page**: Page number (default: 1)
    - **per_page**: Items per page (default: 20, max: 100)
    - **customer_id**: Filter by customer ID (optional)
    - **status**: Filter by status (pending, paid, overdue, partially_paid) (optional)
    - **start_date**: Filter by created date >= start_date (ISO format) (optional)
    - **end_date**: Filter by created date <= end_date (ISO format) (optional)
    """
    # Build cache key based on query params
    cache_key = get_cache_key(f"list:p{page}:pp{per_page}:c{customer_id}:s{status}:sd{start_date}:ed{end_date}")
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached["data"], "message": "OK", "meta": cached["meta"]}

    db = get_supabase()
    
    # Build query with customer details
    query = db.table("credit_sales").select("*, customers(name, business_name)", count="exact")
    
    # Apply filters
    if customer_id:
        query = query.eq("customer_id", customer_id)
    
    if status:
        query = query.eq("status", status)
    
    if start_date:
        query = query.gte("created_at", start_date)
    
    if end_date:
        query = query.lte("created_at", end_date)
    
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


@router.get("/{credit_sale_id}")
async def get_credit_sale(credit_sale_id: str, user=Depends(verify_token)):
    """
    Get credit sale details by ID.
    """
    cache_key = get_cache_key(f"detail:{credit_sale_id}")
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached, "message": "OK"}

    db = get_supabase()
    result = (
        db.table("credit_sales")
        .select("*, customers(name, business_name, contact_number)")
        .eq("id", credit_sale_id)
        .execute()
    )
    
    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Credit sale not found"
        )
    
    credit_sale = result.data[0]
    await set_cached(cache_key, credit_sale, CACHE_TTL)
    
    return {"success": True, "data": credit_sale, "message": "OK"}


@router.get("/customers/{customer_id}/credit-sales")
async def get_customer_credit_sales(
    customer_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    user=Depends(verify_token),
):
    """
    Get all credit sales for a specific customer.
    
    - **customer_id**: Customer ID (required)
    - **page**: Page number (default: 1)
    - **per_page**: Items per page (default: 20, max: 100)
    - **status**: Filter by status (pending, paid, overdue, partially_paid) (optional)
    """
    cache_key = get_cache_key(f"customer:{customer_id}:p{page}:pp{per_page}:s{status}")
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached["data"], "message": "OK", "meta": cached["meta"]}

    db = get_supabase()
    
    # Verify customer exists
    customer_result = db.table("customers").select("id").eq("id", customer_id).execute()
    if not customer_result.data:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )
    
    # Build query
    query = db.table("credit_sales").select("*", count="exact").eq("customer_id", customer_id)
    
    # Apply status filter
    if status:
        query = query.eq("status", status)
    
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

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from database.supabase import get_supabase
from dependencies.auth import verify_token
from models.schemas import CreditSaleCreate, CreditSaleResponse, PaymentCreate
from lib.cache import get_cached, set_cached, invalidate, invalidate_pattern
from datetime import datetime, timedelta, date
from decimal import Decimal
import logging

router = APIRouter(prefix="/credit-sales", tags=["credit-sales"])

CACHE_KEY_PREFIX = "credit_sales"
CACHE_TTL = 300  # 5 minutes

logger = logging.getLogger(__name__)


def get_cache_key(suffix: str = "list") -> str:
    return f"{CACHE_KEY_PREFIX}:{suffix}"


def _range_to_days(range_str: str) -> int:
    """Convert range string to number of days."""
    mapping = {"7d": 7, "30d": 30, "3m": 90, "6m": 180}
    return mapping.get(range_str, 30)


@router.get("/trend")
async def get_credit_sales_trend(
    start_date: Optional[str] = Query(None, description="Start date (ISO format YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format YYYY-MM-DD)"),
    user=Depends(verify_token)
):
    """
    Get credit sales trend grouped by date.
    
    Returns daily aggregated credit sales for the specified date range.
    If no dates provided, defaults to last 30 days.
    """
    db = get_supabase()
    
    # Calculate date range
    if start_date and end_date:
        start = datetime.fromisoformat(start_date).date()
        end = datetime.fromisoformat(end_date).date()
    else:
        # Default to last 30 days
        end = datetime.utcnow().date()
        start = end - timedelta(days=30)
    
    # Add one day to end date to include the entire end date (up to 23:59:59)
    end_inclusive = end + timedelta(days=1)
    
    # Query credit sales
    result = db.table("credit_sales").select("created_at, amount").gte(
        "created_at", start.isoformat()
    ).lt(
        "created_at", end_inclusive.isoformat()
    ).execute()
    
    # Group by date
    daily_sales: dict[str, float] = {}
    for sale in result.data:
        sale_date = sale["created_at"][:10]  # Extract YYYY-MM-DD
        if sale_date not in daily_sales:
            daily_sales[sale_date] = 0
        daily_sales[sale_date] += float(sale["amount"])
    
    # Convert to list and sort
    trend_data = [
        {"date": date, "amount": round(amount, 2)}
        for date, amount in sorted(daily_sales.items())
    ]
    
    return {"success": True, "data": trend_data, "message": "OK"}


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
    new_credit_limit = None
    if new_balance > credit_limit:
        if not payload.override_credit_limit:
            raise HTTPException(
                status_code=400,
                detail=f"Credit limit exceeded. Customer limit: ₱{credit_limit}, Current balance: ₱{current_balance}, New balance would be: ₱{new_balance}. Set override_credit_limit=true to proceed."
            )
        else:
            # Calculate new credit limit (new balance + 20% buffer)
            new_credit_limit = new_balance * Decimal("1.2")
            # Log override for audit
            logger.warning(f"Credit limit override: customer_id={payload.customer_id}, user_id={user['id']}, amount={payload.amount}, new_balance={new_balance}, old_limit={credit_limit}, new_limit={new_credit_limit}")
            warning_message = f"Credit limit override applied. Customer credit limit automatically increased from ₱{credit_limit} to ₱{new_credit_limit}."
    
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
        "created_by": user["id"],
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
        # new_credit_limit was already calculated above
        if new_credit_limit is None:
            new_credit_limit = new_balance * Decimal("1.2")
        
        # Update customer's credit limit
        try:
            db.table("customers").update({
                "credit_limit": float(new_credit_limit),
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", payload.customer_id).execute()
            
            logger.info(f"Credit limit auto-increased: customer_id={payload.customer_id}, old_limit={credit_limit}, new_limit={new_credit_limit}")
        except Exception as e:
            logger.error(f"Failed to update customer credit limit: {str(e)}")
            # Continue anyway - the sale is already created
        
        # Log override to audit table
        override_data = {
            "customer_id": payload.customer_id,
            "credit_sale_id": credit_sale_id,
            "previous_balance": float(current_balance),
            "sale_amount": float(payload.amount),
            "new_balance": float(new_balance),
            "credit_limit": float(credit_limit),  # Old credit limit
            "old_credit_limit": float(credit_limit),
            "new_credit_limit": float(new_credit_limit),
            "override_reason": payload.notes,
            "created_by": user["id"],
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
    # Invalidate credit KPIs cache so dashboard updates immediately
    await invalidate_pattern(f"reports:credit-kpis:*")
    
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


# ─── Payment Recording (Temporary workaround - should be in payments router) ─────

@router.post("/payments", status_code=201)
async def record_payment(payload: PaymentCreate, user=Depends(verify_token)):
    """
    Record a payment from a customer.
    
    TEMPORARY: This endpoint is added here as a workaround because the payments router
    is not loading on Render. This should eventually be moved to /api/v1/payments.
    
    - **customer_id**: Customer ID (required)
    - **credit_sale_id**: Specific credit sale to apply payment to (optional)
    - **amount**: Payment amount (required, must be positive)
    - **payment_method**: Payment method (cash, bank_transfer, gcash, other) (required)
    - **payment_date**: Payment date (optional, defaults to today)
    - **notes**: Additional notes (optional)
    
    Business Rules:
    - Payment reduces customer balance immediately
    - If credit_sale_id is provided, payment is applied to that specific invoice
    - If credit_sale_id is not provided, payment is applied to oldest outstanding invoice (FIFO)
    - Supports partial payments and overpayments
    - Overpayments create a credit balance for future purchases
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
    current_balance = Decimal(str(customer.get("current_balance", 0)))
    
    # Validate payment amount doesn't exceed balance (unless it's an overpayment)
    if payload.amount > current_balance and current_balance > 0:
        logger.info(f"Overpayment detected: customer_id={payload.customer_id}, payment={payload.amount}, balance={current_balance}")
    
    # Set payment date (default to today if not provided)
    payment_date_str = payload.payment_date if payload.payment_date else date.today().isoformat()
    
    # Create payment record
    payment_data = {
        "customer_id": payload.customer_id,
        "credit_sale_id": payload.credit_sale_id,
        "amount": float(payload.amount),
        "payment_method": payload.payment_method,
        "payment_date": payment_date_str,
        "notes": payload.notes,
        "created_by": user["id"],
    }
    
    payment_result = db.table("payments").insert(payment_data).execute()
    
    if not payment_result.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to record payment"
        )
    
    payment_id = payment_result.data[0]["id"]
    
    # Calculate new balance
    new_balance = current_balance - payload.amount
    
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
    
    # Apply payment to credit sales
    remaining_payment = payload.amount
    
    if payload.credit_sale_id:
        # Apply to specific credit sale
        credit_sale_result = (
            db.table("credit_sales")
            .select("*")
            .eq("id", payload.credit_sale_id)
            .eq("customer_id", payload.customer_id)
            .execute()
        )
        
        if not credit_sale_result.data:
            logger.warning(f"Credit sale not found or doesn't belong to customer: credit_sale_id={payload.credit_sale_id}, customer_id={payload.customer_id}")
        else:
            credit_sale = credit_sale_result.data[0]
            credit_sale_amount = Decimal(str(credit_sale.get("amount", 0)))
            
            # Get total payments already made to this credit sale
            existing_payments_result = (
                db.table("payments")
                .select("amount")
                .eq("credit_sale_id", payload.credit_sale_id)
                .neq("id", payment_id)  # Exclude current payment
                .execute()
            )
            
            total_paid = sum(Decimal(str(p["amount"])) for p in existing_payments_result.data)
            total_paid += payload.amount
            
            # Update credit sale status
            new_status = "paid" if total_paid >= credit_sale_amount else "partially_paid"
            
            db.table("credit_sales").update({
                "status": new_status,
            }).eq("id", payload.credit_sale_id).execute()
            
            logger.info(f"Payment applied to credit sale: credit_sale_id={payload.credit_sale_id}, status={new_status}, total_paid={total_paid}, amount={credit_sale_amount}")
    
    else:
        # Apply to oldest outstanding invoices (FIFO)
        outstanding_sales_result = (
            db.table("credit_sales")
            .select("*")
            .eq("customer_id", payload.customer_id)
            .in_("status", ["pending", "partially_paid", "overdue"])
            .order("due_date", desc=False)
            .execute()
        )
        
        for credit_sale in outstanding_sales_result.data:
            if remaining_payment <= 0:
                break
            
            credit_sale_id = credit_sale["id"]
            credit_sale_amount = Decimal(str(credit_sale.get("amount", 0)))
            
            # Get total payments already made to this credit sale
            existing_payments_result = (
                db.table("payments")
                .select("amount")
                .eq("credit_sale_id", credit_sale_id)
                .execute()
            )
            
            total_paid = sum(Decimal(str(p["amount"])) for p in existing_payments_result.data)
            amount_due = credit_sale_amount - total_paid
            
            if amount_due > 0:
                # Apply payment to this credit sale
                payment_to_apply = min(remaining_payment, amount_due)
                
                if payment_to_apply > 0:
                    total_paid += payment_to_apply
                    remaining_payment -= payment_to_apply
                    
                    # Update credit sale status
                    new_status = "paid" if total_paid >= credit_sale_amount else "partially_paid"
                    
                    db.table("credit_sales").update({
                        "status": new_status,
                    }).eq("id", credit_sale_id).execute()
                    
                    logger.info(f"Payment applied to credit sale (FIFO): credit_sale_id={credit_sale_id}, applied={payment_to_apply}, status={new_status}")
    
    # Invalidate caches
    await invalidate(f"payments:list*")
    await invalidate(f"payments:customer:{payload.customer_id}*")
    await invalidate(f"customers:detail:{payload.customer_id}")
    await invalidate(f"customers:list*")
    await invalidate(f"credit_sales:list*")
    await invalidate(f"credit_sales:customer:{payload.customer_id}*")
    # Invalidate credit KPIs cache so dashboard updates immediately
    await invalidate_pattern(f"reports:credit-kpis:*")
    
    response_data = {
        "success": True,
        "data": payment_result.data[0],
        "message": "Payment recorded successfully"
    }
    
    # Add warning for overpayment
    if new_balance < 0:
        response_data["warning"] = f"Overpayment of ₱{abs(new_balance):.2f}. Customer now has a credit balance."
    
    return response_data

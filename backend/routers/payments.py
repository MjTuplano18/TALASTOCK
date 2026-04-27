from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from database.supabase import get_supabase
from dependencies.auth import verify_token
from models.schemas import PaymentCreate, PaymentResponse
from lib.cache import get_cached, set_cached, invalidate
from datetime import datetime, date, timedelta
from decimal import Decimal
import logging

router = APIRouter(prefix="/payments", tags=["payments"])

CACHE_KEY_PREFIX = "payments"
CACHE_TTL = 300  # 5 minutes

logger = logging.getLogger(__name__)


def get_cache_key(suffix: str = "list") -> str:
    return f"{CACHE_KEY_PREFIX}:{suffix}"


def _range_to_days(range_str: str) -> int:
    """Convert range string to number of days."""
    mapping = {"7d": 7, "30d": 30, "3m": 90, "6m": 180}
    return mapping.get(range_str, 30)


@router.get("/trend")
async def get_payments_trend(
    range: str = Query("30d", description="Date range: 7d, 30d, 3m, 6m"),
    user=Depends(verify_token)
):
    """
    Get payment collection trend grouped by date.
    
    Returns daily aggregated payments for the specified date range.
    """
    db = get_supabase()
    
    # Calculate date range
    days = _range_to_days(range)
    start_date = (datetime.utcnow() - timedelta(days=days)).date()
    
    # Query payments
    result = db.table("payments").select("payment_date, amount").gte(
        "payment_date", start_date.isoformat()
    ).execute()
    
    # Group by date
    daily_payments: dict[str, float] = {}
    for payment in result.data:
        payment_date = payment["payment_date"]
        if payment_date not in daily_payments:
            daily_payments[payment_date] = 0
        daily_payments[payment_date] += float(payment["amount"])
    
    # Convert to list and sort
    trend_data = [
        {"date": date_str, "amount": round(amount, 2)}
        for date_str, amount in sorted(daily_payments.items())
    ]
    
    return {"success": True, "data": trend_data, "message": "OK"}


@router.post("/", status_code=201)
async def record_payment(payload: PaymentCreate, user=Depends(verify_token)):
    """
    Record a payment from a customer.
    
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
                
                # Create a linked payment record for this portion
                if payment_to_apply > 0:
                    # Update the payment record to link to this credit sale
                    # Note: This is a simplified approach. In production, you might want to
                    # create separate payment allocation records for better tracking
                    
                    total_paid += payment_to_apply
                    remaining_payment -= payment_to_apply
                    
                    # Update credit sale status
                    new_status = "paid" if total_paid >= credit_sale_amount else "partially_paid"
                    
                    db.table("credit_sales").update({
                        "status": new_status,
                    }).eq("id", credit_sale_id).execute()
                    
                    logger.info(f"Payment applied to credit sale (FIFO): credit_sale_id={credit_sale_id}, applied={payment_to_apply}, status={new_status}")
    
    # Invalidate caches
    await invalidate(f"{CACHE_KEY_PREFIX}:list*")
    await invalidate(f"{CACHE_KEY_PREFIX}:customer:{payload.customer_id}*")
    await invalidate(f"customers:detail:{payload.customer_id}")
    await invalidate(f"customers:list*")
    await invalidate(f"credit_sales:list*")
    await invalidate(f"credit_sales:customer:{payload.customer_id}*")
    
    response_data = {
        "success": True,
        "data": payment_result.data[0],
        "message": "Payment recorded successfully"
    }
    
    # Add warning for overpayment
    if new_balance < 0:
        response_data["warning"] = f"Overpayment of ₱{abs(new_balance):.2f}. Customer now has a credit balance."
    
    return response_data


@router.get("/")
async def list_payments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    customer_id: Optional[str] = None,
    payment_method: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user=Depends(verify_token),
):
    """
    List payments with pagination and filtering.
    
    - **page**: Page number (default: 1)
    - **per_page**: Items per page (default: 20, max: 100)
    - **customer_id**: Filter by customer ID (optional)
    - **payment_method**: Filter by payment method (cash, bank_transfer, gcash, other) (optional)
    - **start_date**: Filter by payment date >= start_date (ISO format) (optional)
    - **end_date**: Filter by payment date <= end_date (ISO format) (optional)
    """
    # Build cache key based on query params
    cache_key = get_cache_key(f"list:p{page}:pp{per_page}:c{customer_id}:pm{payment_method}:sd{start_date}:ed{end_date}")
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached["data"], "message": "OK", "meta": cached["meta"]}

    db = get_supabase()
    
    # Build query with customer details
    query = db.table("payments").select("*, customers(name, business_name)", count="exact")
    
    # Apply filters
    if customer_id:
        query = query.eq("customer_id", customer_id)
    
    if payment_method:
        query = query.eq("payment_method", payment_method)
    
    if start_date:
        query = query.gte("payment_date", start_date)
    
    if end_date:
        query = query.lte("payment_date", end_date)
    
    # Apply pagination
    start = (page - 1) * per_page
    end = start + per_page - 1
    query = query.range(start, end).order("payment_date", desc=True)
    
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


@router.get("/customers/{customer_id}/payments")
async def get_customer_payments(
    customer_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    payment_method: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user=Depends(verify_token),
):
    """
    Get all payments for a specific customer.
    
    - **customer_id**: Customer ID (required)
    - **page**: Page number (default: 1)
    - **per_page**: Items per page (default: 20, max: 100)
    - **payment_method**: Filter by payment method (optional)
    - **start_date**: Filter by payment date >= start_date (ISO format) (optional)
    - **end_date**: Filter by payment date <= end_date (ISO format) (optional)
    """
    cache_key = get_cache_key(f"customer:{customer_id}:p{page}:pp{per_page}:pm{payment_method}:sd{start_date}:ed{end_date}")
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
    query = db.table("payments").select("*", count="exact").eq("customer_id", customer_id)
    
    # Apply filters
    if payment_method:
        query = query.eq("payment_method", payment_method)
    
    if start_date:
        query = query.gte("payment_date", start_date)
    
    if end_date:
        query = query.lte("payment_date", end_date)
    
    # Apply pagination
    start = (page - 1) * per_page
    end = start + per_page - 1
    query = query.range(start, end).order("payment_date", desc=True)
    
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

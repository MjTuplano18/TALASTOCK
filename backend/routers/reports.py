from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from database.supabase import get_supabase
from dependencies.auth import verify_token
from lib.cache import get_cached, set_cached
from datetime import datetime, timedelta
from decimal import Decimal

router = APIRouter(prefix="/reports", tags=["reports"])

CACHE_KEY_PREFIX = "reports"
CACHE_TTL = 1800  # 30 minutes for reports


def get_cache_key(suffix: str = "report") -> str:
    return f"{CACHE_KEY_PREFIX}:{suffix}"


def _range_to_days(range_str: str) -> int:
    """Convert range string to number of days."""
    mapping = {"7d": 7, "30d": 30, "3m": 90, "6m": 180}
    return mapping.get(range_str, 30)


@router.get("/credit-kpis")
async def get_credit_kpis(
    range: str = Query("30d", description="Date range: 7d, 30d, 3m, 6m"),
    user=Depends(verify_token)
):
    """
    Get credit dashboard KPI metrics.

    Returns:
    - total_outstanding: Sum of all customer current balances
    - overdue_balance: Sum of all overdue credit sales
    - customers_near_limit: Count of customers with >80% credit utilization
    """
    cache_key = get_cache_key(f"credit-kpis:{range}")
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached, "message": "OK"}

    db = get_supabase()
    today = datetime.utcnow().date().isoformat()

    # Total outstanding = sum of all active customer balances
    customers_result = (
        db.table("customers")
        .select("current_balance, credit_limit")
        .eq("is_active", True)
        .execute()
    )

    total_outstanding = 0.0
    customers_near_limit = 0

    for c in customers_result.data:
        balance = float(c.get("current_balance", 0))
        limit = float(c.get("credit_limit", 0))
        total_outstanding += balance
        if limit > 0 and balance / limit >= 0.80:
            customers_near_limit += 1

    # Overdue balance = sum of pending/partially_paid/overdue sales past due date
    overdue_result = (
        db.table("credit_sales")
        .select("amount")
        .in_("status", ["pending", "partially_paid", "overdue"])
        .lt("due_date", today)
        .execute()
    )

    overdue_balance = sum(float(s["amount"]) for s in overdue_result.data)

    kpi_data = {
        "total_outstanding": round(total_outstanding, 2),
        "overdue_balance": round(overdue_balance, 2),
        "customers_near_limit": customers_near_limit,
    }

    await set_cached(cache_key, kpi_data, 300)  # 5 min TTL for KPIs

    return {"success": True, "data": kpi_data, "message": "OK"}


@router.get("/credit-summary")
async def get_credit_summary(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    is_active: Optional[bool] = None,
    has_balance: Optional[bool] = None,
    user=Depends(verify_token)
):
    """
    Get credit summary for all customers.
    
    - **page**: Page number (default: 1)
    - **per_page**: Items per page (default: 50, max: 100)
    - **is_active**: Filter by active status (optional)
    - **has_balance**: Filter customers with balance > 0 (optional)
    
    Returns a comprehensive summary of all customers with their credit status.
    """
    cache_key = get_cache_key(f"credit-summary:p{page}:pp{per_page}:a{is_active}:hb{has_balance}")
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached["data"], "message": "OK", "meta": cached["meta"]}

    db = get_supabase()
    
    # Build query
    query = db.table("customers").select("*", count="exact")
    
    # Apply filters
    if is_active is not None:
        query = query.eq("is_active", is_active)
    
    if has_balance:
        query = query.gt("current_balance", 0)
    
    # Apply pagination
    start = (page - 1) * per_page
    end = start + per_page - 1
    query = query.range(start, end).order("current_balance", desc=True)
    
    result = query.execute()
    
    # Calculate total count
    total = result.count if hasattr(result, 'count') else len(result.data)
    
    # Get today's date for overdue calculation
    today = datetime.utcnow().date().isoformat()
    
    # Enrich customer data with additional metrics
    summary_data = []
    total_outstanding = 0
    total_overdue = 0
    
    for customer in result.data:
        customer_id = customer["id"]
        current_balance = float(customer.get("current_balance", 0))
        credit_limit = float(customer.get("credit_limit", 0))
        available_credit = credit_limit - current_balance
        
        # Calculate utilization
        utilization = (current_balance / credit_limit * 100) if credit_limit > 0 else 0
        
        # Get overdue amount for this customer
        overdue_sales_result = (
            db.table("credit_sales")
            .select("amount")
            .eq("customer_id", customer_id)
            .in_("status", ["pending", "partially_paid", "overdue"])
            .lt("due_date", today)
            .execute()
        )
        
        overdue_amount = sum(float(sale["amount"]) for sale in overdue_sales_result.data)
        
        # Get count of pending credit sales
        pending_sales_result = (
            db.table("credit_sales")
            .select("id", count="exact")
            .eq("customer_id", customer_id)
            .in_("status", ["pending", "partially_paid", "overdue"])
            .execute()
        )
        
        pending_count = pending_sales_result.count if hasattr(pending_sales_result, 'count') else len(pending_sales_result.data)
        
        summary_data.append({
            "customer_id": customer_id,
            "name": customer["name"],
            "business_name": customer.get("business_name"),
            "contact_number": customer.get("contact_number"),
            "current_balance": current_balance,
            "credit_limit": credit_limit,
            "available_credit": available_credit,
            "utilization_percent": round(utilization, 2),
            "overdue_amount": overdue_amount,
            "pending_invoices_count": pending_count,
            "is_active": customer.get("is_active", True),
            "payment_terms_days": customer.get("payment_terms_days", 30),
        })
        
        total_outstanding += current_balance
        total_overdue += overdue_amount
    
    response_data = {
        "data": summary_data,
        "meta": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_outstanding": round(total_outstanding, 2),
            "total_overdue": round(total_overdue, 2),
        }
    }
    
    await set_cached(cache_key, response_data, CACHE_TTL)
    
    return {
        "success": True,
        "data": summary_data,
        "message": "OK",
        "meta": response_data["meta"]
    }


@router.get("/aging")
async def get_aging_report(user=Depends(verify_token)):
    """
    Get aging report showing outstanding balances by age buckets.
    
    Buckets:
    - 0-7 days: Current
    - 8-15 days: Slightly overdue
    - 16-30 days: Overdue
    - 31-60 days: Seriously overdue
    - 60+ days: Very overdue
    
    Returns customer count and total amount for each bucket.
    """
    cache_key = get_cache_key("aging")
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached, "message": "OK"}

    db = get_supabase()
    
    # Get all pending/partially paid credit sales
    credit_sales_result = (
        db.table("credit_sales")
        .select("customer_id, amount, due_date, customers(name, business_name)")
        .in_("status", ["pending", "partially_paid", "overdue"])
        .execute()
    )
    
    today = datetime.utcnow().date()
    
    # Initialize aging buckets
    aging_buckets = {
        "0-7": {"label": "0-7 days", "customers": set(), "amount": 0, "invoices": []},
        "8-15": {"label": "8-15 days", "customers": set(), "amount": 0, "invoices": []},
        "16-30": {"label": "16-30 days", "customers": set(), "amount": 0, "invoices": []},
        "31-60": {"label": "31-60 days", "customers": set(), "amount": 0, "invoices": []},
        "60+": {"label": "60+ days", "customers": set(), "amount": 0, "invoices": []},
    }
    
    # Categorize each credit sale by age
    for sale in credit_sales_result.data:
        due_date = datetime.fromisoformat(sale["due_date"]).date()
        days_outstanding = (today - due_date).days
        amount = float(sale["amount"])
        customer_id = sale["customer_id"]
        customer_name = sale["customers"]["name"] if sale.get("customers") else "Unknown"
        
        # Determine bucket
        if days_outstanding <= 7:
            bucket = "0-7"
        elif days_outstanding <= 15:
            bucket = "8-15"
        elif days_outstanding <= 30:
            bucket = "16-30"
        elif days_outstanding <= 60:
            bucket = "31-60"
        else:
            bucket = "60+"
        
        aging_buckets[bucket]["customers"].add(customer_id)
        aging_buckets[bucket]["amount"] += amount
        aging_buckets[bucket]["invoices"].append({
            "customer_id": customer_id,
            "customer_name": customer_name,
            "amount": amount,
            "due_date": sale["due_date"],
            "days_outstanding": days_outstanding,
        })
    
    # Format response
    aging_report = []
    total_amount = 0
    total_customers = set()
    
    for bucket_key in ["0-7", "8-15", "16-30", "31-60", "60+"]:
        bucket = aging_buckets[bucket_key]
        customer_count = len(bucket["customers"])
        amount = bucket["amount"]
        
        aging_report.append({
            "bucket": bucket["label"],
            "customer_count": customer_count,
            "total_amount": round(amount, 2),
            "invoices": bucket["invoices"],
        })
        
        total_amount += amount
        total_customers.update(bucket["customers"])
    
    report_data = {
        "aging_buckets": aging_report,
        "summary": {
            "total_customers": len(total_customers),
            "total_outstanding": round(total_amount, 2),
            "generated_at": datetime.utcnow().isoformat(),
        }
    }
    
    await set_cached(cache_key, report_data, CACHE_TTL)
    
    return {"success": True, "data": report_data, "message": "OK"}


@router.get("/payment-collection")
async def get_payment_collection_report(
    start_date: str = Query(..., description="Start date (ISO format)"),
    end_date: str = Query(..., description="End date (ISO format)"),
    group_by: str = Query("day", description="Group by: day, week, month"),
    user=Depends(verify_token)
):
    """
    Get payment collection report for a date range.
    
    - **start_date**: Start date (ISO format, required)
    - **end_date**: End date (ISO format, required)
    - **group_by**: Group payments by day, week, or month (default: day)
    
    Returns total payments collected, grouped by the specified period.
    """
    cache_key = get_cache_key(f"payment-collection:sd{start_date}:ed{end_date}:gb{group_by}")
    cached = await get_cached(cache_key)
    if cached:
        return {"success": True, "data": cached, "message": "OK"}

    db = get_supabase()
    
    # Validate date format
    try:
        start_dt = datetime.fromisoformat(start_date)
        end_dt = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use ISO format (YYYY-MM-DD)"
        )
    
    if start_dt > end_dt:
        raise HTTPException(
            status_code=400,
            detail="Start date must be before end date"
        )
    
    # Get all payments in date range
    payments_result = (
        db.table("payments")
        .select("amount, payment_method, payment_date, customers(name)")
        .gte("payment_date", start_date)
        .lte("payment_date", end_date)
        .order("payment_date", desc=False)
        .execute()
    )
    
    # Group payments by period
    grouped_payments = {}
    payment_methods_summary = {}
    total_amount = 0
    
    for payment in payments_result.data:
        payment_date = datetime.fromisoformat(payment["payment_date"]).date()
        amount = float(payment["amount"])
        payment_method = payment["payment_method"]
        
        # Determine group key based on group_by parameter
        if group_by == "day":
            group_key = payment_date.isoformat()
        elif group_by == "week":
            # Get start of week (Monday)
            week_start = payment_date - timedelta(days=payment_date.weekday())
            group_key = week_start.isoformat()
        elif group_by == "month":
            group_key = payment_date.strftime("%Y-%m")
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid group_by parameter. Use: day, week, or month"
            )
        
        # Initialize group if not exists
        if group_key not in grouped_payments:
            grouped_payments[group_key] = {
                "period": group_key,
                "total_amount": 0,
                "payment_count": 0,
                "payments": [],
            }
        
        # Add payment to group
        grouped_payments[group_key]["total_amount"] += amount
        grouped_payments[group_key]["payment_count"] += 1
        grouped_payments[group_key]["payments"].append({
            "amount": amount,
            "payment_method": payment_method,
            "payment_date": payment["payment_date"],
            "customer_name": payment["customers"]["name"] if payment.get("customers") else "Unknown",
        })
        
        # Track payment methods
        if payment_method not in payment_methods_summary:
            payment_methods_summary[payment_method] = {
                "count": 0,
                "total_amount": 0,
            }
        
        payment_methods_summary[payment_method]["count"] += 1
        payment_methods_summary[payment_method]["total_amount"] += amount
        
        total_amount += amount
    
    # Convert to list and sort
    collection_data = list(grouped_payments.values())
    collection_data.sort(key=lambda x: x["period"])
    
    # Round amounts
    for period in collection_data:
        period["total_amount"] = round(period["total_amount"], 2)
    
    for method in payment_methods_summary.values():
        method["total_amount"] = round(method["total_amount"], 2)
    
    report_data = {
        "period": {
            "start_date": start_date,
            "end_date": end_date,
            "group_by": group_by,
        },
        "collection_by_period": collection_data,
        "payment_methods_summary": payment_methods_summary,
        "summary": {
            "total_amount": round(total_amount, 2),
            "total_payments": len(payments_result.data),
            "generated_at": datetime.utcnow().isoformat(),
        }
    }
    
    await set_cached(cache_key, report_data, CACHE_TTL)
    
    return {"success": True, "data": report_data, "message": "OK"}

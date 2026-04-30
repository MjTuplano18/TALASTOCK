"""
Import History & ETL Management Router
Handles import history tracking, rollback, templates, and statistics
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from database.supabase import get_supabase
from dependencies.auth import verify_token
from models.schemas import (
    APIResponse,
    ImportHistoryCreate,
    ImportHistoryResponse,
    ImportTemplateCreate,
    ImportTemplateUpdate,
    ImportTemplateResponse,
    ImportStatistics,
    RollbackRequest,
    DataSnapshotCreate,
)
# Note: cache_response decorator removed - not implemented in lib.cache

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/imports", tags=["imports"])


# ============================================================================
# Import History Endpoints
# ============================================================================

@router.get("/history", response_model=APIResponse)
async def get_import_history(
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db=Depends(get_supabase),
    user=Depends(verify_token),
):
    """
    Get import history with optional filters
    """
    try:
        query = db.table("import_history").select("*").eq("user_id", user["id"])
        
        if entity_type:
            query = query.eq("entity_type", entity_type)
        
        if status:
            query = query.eq("status", status)
        
        if start_date:
            query = query.gte("created_at", start_date)
        
        if end_date:
            query = query.lte("created_at", end_date)
        
        # Get total count
        count_result = query.execute()
        total_count = len(count_result.data) if count_result.data else 0
        
        # Get paginated results
        result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        # Calculate quality scores for each import
        imports = []
        for import_record in result.data:
            # Call the quality score function
            score_result = db.rpc(
                "calculate_import_quality_score",
                {"p_import_id": import_record["id"]}
            ).execute()
            
            import_record["quality_score"] = float(score_result.data) if score_result.data else 0
            imports.append(import_record)
        
        return {
            "success": True,
            "data": {
                "imports": imports,
                "total": total_count,
                "limit": limit,
                "offset": offset,
            },
            "message": "Import history retrieved successfully",
        }
    except Exception as e:
        logger.error(f"Failed to get import history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{import_id}", response_model=APIResponse)
async def get_import_details(
    import_id: str,
    db=Depends(get_supabase),
    user=Depends(verify_token),
):
    """
    Get detailed information about a specific import
    """
    try:
        # Get import record
        import_result = db.table("import_history").select("*").eq("id", import_id).eq("user_id", user["id"]).execute()
        
        if not import_result.data:
            raise HTTPException(status_code=404, detail="Import not found")
        
        import_record = import_result.data[0]
        
        # Get quality score
        score_result = db.rpc(
            "calculate_import_quality_score",
            {"p_import_id": import_id}
        ).execute()
        import_record["quality_score"] = float(score_result.data) if score_result.data else 0
        
        # Get snapshot count
        snapshot_result = db.table("import_data_snapshot").select("id", count="exact").eq("import_id", import_id).execute()
        import_record["snapshot_count"] = snapshot_result.count if snapshot_result.count else 0
        
        return {
            "success": True,
            "data": import_record,
            "message": "Import details retrieved successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get import details: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/history", response_model=APIResponse, status_code=201)
async def create_import_history(
    payload: ImportHistoryCreate,
    db=Depends(get_supabase),
    user=Depends(verify_token),
):
    """
    Create a new import history record
    """
    try:
        import_data = {
            "user_id": user["id"],
            "file_name": payload.file_name,
            "entity_type": payload.entity_type,
            "status": payload.status,
            "total_rows": payload.total_rows,
            "successful_rows": payload.successful_rows,
            "failed_rows": payload.failed_rows,
            "errors": payload.errors,
            "warnings": payload.warnings,
            "processing_time_ms": payload.processing_time_ms,
        }
        
        result = db.table("import_history").insert(import_data).execute()
        
        return {
            "success": True,
            "data": result.data[0],
            "message": "Import history created successfully",
        }
    except Exception as e:
        logger.error(f"Failed to create import history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics", response_model=APIResponse)
async def get_import_statistics(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db=Depends(get_supabase),
    user=Depends(verify_token),
):
    """
    Get aggregated import statistics for the specified time period
    """
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Call the statistics function
        result = db.rpc(
            "get_import_statistics",
            {
                "p_start_date": start_date.isoformat(),
                "p_end_date": end_date.isoformat(),
                "p_user_id": user["id"],
            }
        ).execute()
        
        if not result.data:
            # Return empty statistics
            stats = {
                "total_imports": 0,
                "successful_imports": 0,
                "failed_imports": 0,
                "partial_imports": 0,
                "success_rate": 0,
                "total_rows_processed": 0,
                "avg_processing_time_ms": 0,
                "avg_quality_score": 0,
            }
        else:
            stats = result.data[0]
        
        return {
            "success": True,
            "data": {
                "statistics": stats,
                "period_days": days,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            },
            "message": "Import statistics retrieved successfully",
        }
    except Exception as e:
        logger.error(f"Failed to get import statistics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Rollback Endpoints
# ============================================================================

@router.post("/rollback", response_model=APIResponse)
async def rollback_import(
    payload: RollbackRequest,
    db=Depends(get_supabase),
    user=Depends(verify_token),
):
    """
    Rollback an import by reverting all changes
    """
    try:
        # Get import record
        import_result = db.table("import_history").select("*").eq("id", payload.import_id).eq("user_id", user["id"]).execute()
        
        if not import_result.data:
            raise HTTPException(status_code=404, detail="Import not found")
        
        import_record = import_result.data[0]
        
        if not import_record["can_rollback"]:
            raise HTTPException(status_code=400, detail="This import cannot be rolled back")
        
        if import_record["rolled_back_at"]:
            raise HTTPException(status_code=400, detail="This import has already been rolled back")
        
        # Check for conflicts (products modified after this import)
        if import_record.get("has_conflicts"):
            raise HTTPException(
                status_code=409,
                detail="Cannot rollback: Products from this import have been modified by newer operations. Rolling back would cause data inconsistency."
            )
        
        # Additional safety check: verify no products were modified after import
        # Only run if the function exists (migration has been applied)
        try:
            conflict_check = db.rpc(
                "can_safely_rollback_import",
                {"p_import_id": payload.import_id}
            ).execute()
            
            if conflict_check.data and len(conflict_check.data) > 0:
                result = conflict_check.data[0]
                if not result.get("can_rollback", True):  # Default to True if function doesn't exist
                    conflicts = result.get("conflicts", [])
                    conflict_count = result.get("conflict_count", 0)
                    
                    # Mark import as having conflicts
                    db.table("import_history").update({
                        "has_conflicts": True,
                        "can_rollback": False,
                    }).eq("id", payload.import_id).execute()
                    
                    raise HTTPException(
                        status_code=409,
                        detail=f"Cannot rollback: {conflict_count} product(s) have been modified since this import. Rolling back would overwrite newer data."
                    )
        except Exception as e:
            # If the function doesn't exist yet (migration not run), log and continue
            logger.warning(f"Conflict detection function not available: {e}")
            # Continue with rollback if no has_conflicts flag is set
        
        # Get all snapshots for this import
        snapshots_result = db.table("import_data_snapshot").select("*").eq("import_id", payload.import_id).execute()
        
        if not snapshots_result.data or len(snapshots_result.data) == 0:
            raise HTTPException(
                status_code=400, 
                detail="No snapshots found for this import. Rollback is not available because data snapshots were not created during import."
            )
        
        # Rollback each snapshot in reverse order
        rollback_count = 0
        errors = []
        
        for snapshot in reversed(snapshots_result.data):
            try:
                entity_type = snapshot["entity_type"]
                entity_id = snapshot["entity_id"]
                operation = snapshot["operation"]
                old_data = snapshot["old_data"]
                new_data = snapshot["new_data"]
                
                if operation == "insert":
                    # Delete the inserted record
                    result = db.table(entity_type).delete().eq("product_id", entity_id).execute()
                    logger.info(f"Rollback delete: {result}")
                elif operation == "update":
                    # Restore old data - for inventory, use product_id
                    if old_data:
                        logger.info(f"Rollback update: product_id={entity_id}, old_data={old_data}")
                        
                        # Add updated_at timestamp to trigger the update
                        update_data = {**old_data, "updated_at": datetime.utcnow().isoformat()}
                        
                        result = db.table(entity_type).update(update_data).eq("product_id", entity_id).execute()
                        logger.info(f"Rollback update result: {result}")
                        
                        # Create stock movement record for rollback
                        if entity_type == "inventory" and "quantity" in old_data and "quantity" in new_data:
                            quantity_change = old_data["quantity"] - new_data["quantity"]
                            if quantity_change != 0:
                                try:
                                    db.table("stock_movements").insert({
                                        "product_id": entity_id,
                                        "type": "rollback",
                                        "quantity": quantity_change,
                                        "note": f"Rollback of import {payload.import_id}: {payload.reason or 'No reason provided'}",
                                        "created_by": user["id"],
                                        "import_history_id": payload.import_id,
                                    }).execute()
                                except Exception as sm_error:
                                    logger.error(f"Failed to create stock movement for rollback: {sm_error}")
                elif operation == "delete":
                    # Re-insert deleted record
                    if old_data:
                        result = db.table(entity_type).insert(old_data).execute()
                        logger.info(f"Rollback insert: {result}")
                
                rollback_count += 1
            except Exception as e:
                logger.error(f"Rollback error for snapshot {snapshot['id']}: {e}", exc_info=True)
                errors.append({
                    "snapshot_id": snapshot["id"],
                    "entity_id": entity_id,
                    "error": str(e),
                })
        
        # Mark import as rolled back
        db.table("import_history").update({
            "rolled_back_at": datetime.utcnow().isoformat(),
            "rolled_back_by": user["id"],
            "can_rollback": False,
        }).eq("id", payload.import_id).execute()
        
        return {
            "success": True,
            "data": {
                "import_id": payload.import_id,
                "rollback_count": rollback_count,
                "errors": errors,
            },
            "message": f"Successfully rolled back {rollback_count} changes",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to rollback import: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Data Snapshot Endpoints
# ============================================================================

@router.post("/snapshots", response_model=APIResponse, status_code=201)
async def create_data_snapshot(
    payload: DataSnapshotCreate,
    db=Depends(get_supabase),
    user=Depends(verify_token),
):
    """
    Create a data snapshot for rollback support
    """
    try:
        snapshot_data = {
            "import_id": payload.import_id,
            "entity_type": payload.entity_type,
            "entity_id": payload.entity_id,
            "operation": payload.operation,
            "old_data": payload.old_data,
            "new_data": payload.new_data,
        }
        
        result = db.table("import_data_snapshot").insert(snapshot_data).execute()
        
        return {
            "success": True,
            "data": result.data[0],
            "message": "Snapshot created successfully",
        }
    except Exception as e:
        logger.error(f"Failed to create snapshot: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Import Templates Endpoints
# ============================================================================

@router.get("/templates", response_model=APIResponse)
async def get_import_templates(
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    db=Depends(get_supabase),
    user=Depends(verify_token),
):
    """
    Get all import templates for the current user
    """
    try:
        query = db.table("import_templates").select("*").eq("user_id", user["id"])
        
        if entity_type:
            query = query.eq("entity_type", entity_type)
        
        result = query.order("created_at", desc=True).execute()
        
        return {
            "success": True,
            "data": result.data,
            "message": "Import templates retrieved successfully",
        }
    except Exception as e:
        logger.error(f"Failed to get import templates: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/templates", response_model=APIResponse, status_code=201)
async def create_import_template(
    payload: ImportTemplateCreate,
    db=Depends(get_supabase),
    user=Depends(verify_token),
):
    """
    Create a new import template
    """
    try:
        # If this is set as default, unset other defaults for this entity type
        if payload.is_default:
            db.table("import_templates").update({"is_default": False}).eq("user_id", user["id"]).eq("entity_type", payload.entity_type).execute()
        
        template_data = {
            "user_id": user["id"],
            "name": payload.name,
            "entity_type": payload.entity_type,
            "column_mappings": payload.column_mappings,
            "is_default": payload.is_default,
        }
        
        result = db.table("import_templates").insert(template_data).execute()
        
        return {
            "success": True,
            "data": result.data[0],
            "message": "Import template created successfully",
        }
    except Exception as e:
        logger.error(f"Failed to create import template: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/templates/{template_id}", response_model=APIResponse)
async def update_import_template(
    template_id: str,
    payload: ImportTemplateUpdate,
    db=Depends(get_supabase),
    user=Depends(verify_token),
):
    """
    Update an existing import template
    """
    try:
        # Check if template exists and belongs to user
        existing = db.table("import_templates").select("*").eq("id", template_id).eq("user_id", user["id"]).execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Template not found")
        
        update_data = {}
        if payload.name is not None:
            update_data["name"] = payload.name
        if payload.column_mappings is not None:
            update_data["column_mappings"] = payload.column_mappings
        if payload.is_default is not None:
            update_data["is_default"] = payload.is_default
            # If setting as default, unset other defaults
            if payload.is_default:
                entity_type = existing.data[0]["entity_type"]
                db.table("import_templates").update({"is_default": False}).eq("user_id", user["id"]).eq("entity_type", entity_type).neq("id", template_id).execute()
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = db.table("import_templates").update(update_data).eq("id", template_id).execute()
        
        return {
            "success": True,
            "data": result.data[0],
            "message": "Import template updated successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update import template: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/templates/{template_id}", response_model=APIResponse)
async def delete_import_template(
    template_id: str,
    db=Depends(get_supabase),
    user=Depends(verify_token),
):
    """
    Delete an import template
    """
    try:
        # Check if template exists and belongs to user
        existing = db.table("import_templates").select("id").eq("id", template_id).eq("user_id", user["id"]).execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Template not found")
        
        db.table("import_templates").delete().eq("id", template_id).execute()
        
        return {
            "success": True,
            "data": None,
            "message": "Import template deleted successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete import template: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

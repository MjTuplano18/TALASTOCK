from pydantic import BaseModel, field_validator
from typing import Optional, List
from decimal import Decimal


class APIResponse(BaseModel):
    success: bool
    data: object = None
    message: str
    error_code: Optional[str] = None


class CategoryCreate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Category name cannot be empty")
        return v.strip()


class ProductCreate(BaseModel):
    name: str
    sku: str
    category_id: Optional[str] = None
    price: Decimal
    cost_price: Decimal
    image_url: Optional[str] = None

    @field_validator("name", "sku")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()

    @field_validator("price", "cost_price")
    @classmethod
    def non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Must be non-negative")
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[str] = None
    price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class InventoryAdjustment(BaseModel):
    quantity: int
    note: str

    @field_validator("quantity")
    @classmethod
    def non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Quantity must be non-negative")
        return v

    @field_validator("note")
    @classmethod
    def note_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Note is required")
        return v.strip()


class SaleItemCreate(BaseModel):
    product_id: str
    quantity: int
    unit_price: Decimal

    @field_validator("quantity")
    @classmethod
    def positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity must be positive")
        return v


class SaleCreate(BaseModel):
    items: List[SaleItemCreate]
    notes: Optional[str] = None

    @field_validator("items")
    @classmethod
    def has_items(cls, v: list) -> list:
        if not v:
            raise ValueError("Sale must have at least one item")
        return v

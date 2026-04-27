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


# Customer Credit Management Schemas
class CustomerCreate(BaseModel):
    name: str
    contact_number: Optional[str] = None
    address: Optional[str] = None
    business_name: Optional[str] = None
    credit_limit: Decimal = Decimal("0")
    payment_terms_days: int = 30
    notes: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Customer name cannot be empty")
        return v.strip()

    @field_validator("credit_limit")
    @classmethod
    def credit_limit_non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Credit limit must be non-negative")
        return v

    @field_validator("payment_terms_days")
    @classmethod
    def payment_terms_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Payment terms must be at least 1 day")
        return v


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    business_name: Optional[str] = None
    credit_limit: Optional[Decimal] = None
    payment_terms_days: Optional[int] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or not v.strip()):
            raise ValueError("Customer name cannot be empty")
        return v.strip() if v else None

    @field_validator("credit_limit")
    @classmethod
    def credit_limit_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("Credit limit must be non-negative")
        return v

    @field_validator("payment_terms_days")
    @classmethod
    def payment_terms_positive(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError("Payment terms must be at least 1 day")
        return v


class CustomerResponse(BaseModel):
    id: str
    name: str
    contact_number: Optional[str]
    address: Optional[str]
    business_name: Optional[str]
    credit_limit: Decimal
    current_balance: Decimal
    payment_terms_days: int
    is_active: bool
    notes: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


# Credit Sales Schemas
class CreditSaleCreate(BaseModel):
    customer_id: str
    sale_id: Optional[str] = None
    amount: Decimal
    notes: Optional[str] = None
    override_credit_limit: bool = False

    @field_validator("customer_id")
    @classmethod
    def customer_id_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Customer ID cannot be empty")
        return v.strip()

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v


class CreditSaleResponse(BaseModel):
    id: str
    customer_id: str
    sale_id: Optional[str]
    amount: Decimal
    due_date: str
    status: str
    notes: Optional[str]
    created_by: str
    created_at: str

    class Config:
        from_attributes = True


# Payment Schemas
class PaymentCreate(BaseModel):
    customer_id: str
    credit_sale_id: Optional[str] = None
    amount: Decimal
    payment_method: str
    payment_date: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("customer_id")
    @classmethod
    def customer_id_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Customer ID cannot be empty")
        return v.strip()

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Payment amount must be positive")
        return v

    @field_validator("payment_method")
    @classmethod
    def payment_method_valid(cls, v: str) -> str:
        valid_methods = ["cash", "bank_transfer", "gcash", "other"]
        if v.lower() not in valid_methods:
            raise ValueError(
                f"Payment method must be one of: {', '.join(valid_methods)}"
            )
        return v.lower()


class PaymentResponse(BaseModel):
    id: str
    customer_id: str
    credit_sale_id: Optional[str]
    amount: Decimal
    payment_method: str
    payment_date: str
    notes: Optional[str]
    created_by: str
    created_at: str

    class Config:
        from_attributes = True

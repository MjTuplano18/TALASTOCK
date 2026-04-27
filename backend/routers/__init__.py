# Routers package
# This file makes the routers directory a Python package

# Export all routers for easy importing
from . import products
from . import inventory
from . import sales
from . import categories
from . import settings
from . import customers
from . import credit_sales
from . import payments
from . import reports

__all__ = [
    'products',
    'inventory',
    'sales',
    'categories',
    'settings',
    'customers',
    'credit_sales',
    'payments',
    'reports',
]

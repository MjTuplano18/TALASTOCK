# Talastock Backend

FastAPI backend with Redis caching.

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Copy and fill in env vars
cp .env.example .env

# Start Redis (requires Docker)
docker run -d -p 6379:6379 redis:alpine

# Run the server
uvicorn main:app --reload --port 8000
```

## Redis

Redis is used to cache API responses and reduce Supabase query load.

- Products: 30s TTL
- Inventory: 15s TTL  
- Sales: 30s TTL
- Categories: 60s TTL

Cache is automatically invalidated on any write operation.

If Redis is unavailable, the API falls back gracefully to no caching.

## Endpoints

- `GET /api/v1/products`
- `POST /api/v1/products`
- `PUT /api/v1/products/{id}`
- `DELETE /api/v1/products/{id}`
- `GET /api/v1/inventory`
- `GET /api/v1/inventory/low-stock`
- `POST /api/v1/inventory/{product_id}/adjust`
- `GET /api/v1/sales`
- `POST /api/v1/sales`
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `PUT /api/v1/categories/{id}`
- `DELETE /api/v1/categories/{id}`

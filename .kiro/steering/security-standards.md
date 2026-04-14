# Security Standards

## Security Philosophy
Security is not an afterthought — it's built into every layer of Talastock.
Defense in depth: multiple layers of protection, assume breach mentality.

## Authentication Security

### Token Management
- Access tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Store tokens in httpOnly cookies ONLY — never localStorage
- Rotate refresh tokens on every use
- Invalidate all tokens on logout

### Password Requirements
```typescript
// Minimum password requirements
const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // Optional for SME users
}
```

### Session Security
- Implement CSRF protection on all state-changing operations
- Use SameSite=Strict for auth cookies
- Implement session timeout after 30 minutes of inactivity
- Force re-authentication for sensitive operations (delete, export)

## Database Security

### Row Level Security (RLS)
ALWAYS enable RLS on every table. No exceptions.

```sql
-- Enable RLS on all tables
alter table products enable row level security;
alter table inventory enable row level security;
alter table sales enable row level security;
alter table stock_movements enable row level security;
alter table categories enable row level security;

-- Policy: Authenticated users can read their own data
create policy "Users can read own data"
  on products for select
  to authenticated
  using (auth.uid() = created_by);

-- Policy: Authenticated users can insert their own data
create policy "Users can insert own data"
  on products for insert
  to authenticated
  with check (auth.uid() = created_by);
```

### SQL Injection Prevention
- NEVER concatenate user input into SQL queries
- Always use parameterized queries
- Supabase client handles this automatically — use it correctly

```typescript
// ✅ Safe — parameterized query
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('sku', userInput)

// ❌ NEVER DO THIS — vulnerable to SQL injection
const query = `SELECT * FROM products WHERE sku = '${userInput}'`
```

### Data Encryption
- All data in transit uses TLS 1.3
- Supabase encrypts data at rest by default
- Never store sensitive data (passwords, tokens) in plain text
- Use Supabase Vault for storing API keys and secrets

## API Security

### Request Validation
```python
# backend/middleware/validation.py
from pydantic import BaseModel, validator

class ProductCreate(BaseModel):
    name: str
    sku: str
    price: float
    
    @validator('name')
    def name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Product name cannot be empty')
        return v.strip()
    
    @validator('price')
    def price_positive(cls, v):
        if v < 0:
            raise ValueError('Price must be non-negative')
        return v
```

### Rate Limiting
Implement rate limiting to prevent abuse:

```python
# backend/middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# Apply to routes
@router.post("/products")
@limiter.limit("10/minute")  # Max 10 requests per minute
async def create_product(payload: ProductCreate):
    pass
```

### CORS Configuration
```python
# backend/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development
        "https://talastock.vercel.app"  # Production
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

## Frontend Security

### XSS Prevention
- React escapes content by default — don't bypass it
- Never use dangerouslySetInnerHTML unless absolutely necessary
- Sanitize user input before rendering

```typescript
// ✅ Safe — React escapes automatically
<p>{userInput}</p>

// ❌ Dangerous — only use if you sanitize first
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### Content Security Policy (CSP)
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://*.supabase.co;
    `.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
]
```

### Environment Variables
```env
# .env.local (Frontend)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx  # Safe to expose

# .env (Backend)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx  # NEVER expose to frontend
DATABASE_URL=postgresql://xxx  # NEVER expose to frontend
```

## File Upload Security (Future)

### Image Upload Validation
```typescript
// Validate file type and size
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

function validateImage(file: File): boolean {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type')
  }
  if (file.size > MAX_SIZE) {
    throw new Error('File too large')
  }
  return true
}
```

### Supabase Storage Security
```sql
-- Storage bucket policies
create policy "Authenticated users can upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "Public can view images"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');
```

## Logging and Monitoring

### Security Event Logging
Log all security-relevant events:
- Failed login attempts
- Unauthorized access attempts
- Data modification operations
- Token refresh failures
- Rate limit violations

```python
# backend/utils/security_logger.py
import logging

security_logger = logging.getLogger('security')

def log_failed_login(email: str, ip: str):
    security_logger.warning(f"Failed login attempt: {email} from {ip}")

def log_unauthorized_access(user_id: str, resource: str):
    security_logger.warning(f"Unauthorized access: {user_id} -> {resource}")
```

### Error Handling
Never expose sensitive information in error messages:

```python
# ✅ Good — generic error message
raise HTTPException(
    status_code=401,
    detail="Invalid credentials"
)

# ❌ Bad — exposes too much information
raise HTTPException(
    status_code=401,
    detail=f"User {email} not found in database table auth.users"
)
```

## Dependency Security

### Regular Updates
```bash
# Check for vulnerabilities
npm audit
pip-audit

# Update dependencies monthly
npm update
pip install --upgrade -r requirements.txt
```

### Dependency Scanning
- Use Dependabot or Snyk for automated vulnerability scanning
- Review security advisories before updating major versions
- Pin exact versions in production

## Deployment Security

### Environment Separation
- Development: http://localhost:3000
- Staging: https://staging.talastock.com
- Production: https://talastock.com

### Secrets Management
- Use Vercel environment variables for frontend secrets
- Use Railway environment variables for backend secrets
- Never commit .env files to git
- Rotate secrets every 90 days

### HTTPS Enforcement
```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  // Redirect HTTP to HTTPS in production
  if (process.env.NODE_ENV === 'production' && 
      req.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(
      `https://${req.headers.get('host')}${req.nextUrl.pathname}`,
      301
    )
  }
}
```

## Security Checklist

Before deploying to production:
- [ ] RLS enabled on all database tables
- [ ] Authentication tokens stored in httpOnly cookies
- [ ] CORS configured with specific origins
- [ ] Rate limiting implemented on API endpoints
- [ ] Input validation on all forms
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] HTTPS enforced in production
- [ ] Environment variables properly configured
- [ ] Security headers configured
- [ ] Error messages sanitized
- [ ] Logging configured for security events
- [ ] Dependencies scanned for vulnerabilities

## What NOT to Do

- Never disable RLS "temporarily" — it will stay disabled
- Never expose service keys to the frontend
- Never trust user input — always validate and sanitize
- Never log sensitive data (passwords, tokens, PII)
- Never use `eval()` or `Function()` with user input
- Never disable CORS for "convenience"
- Never commit secrets to version control
- Never use weak session timeouts (> 1 hour)

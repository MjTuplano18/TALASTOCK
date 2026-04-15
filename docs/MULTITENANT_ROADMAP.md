# Talastock Multi-Tenant POS & Dashboard Roadmap 🚀

## Vision
Transform Talastock from a single-tenant inventory system into a **multi-tenant SaaS POS platform** with comprehensive dashboards for Filipino SMEs.

**Target Market:** Binondo traders, sari-sari stores, restaurants, retail shops  
**Business Model:** Subscription-based SaaS (₱299-₱999/month)  
**Timeline:** 3-6 months to MVP

---

## 🎯 Strategic Goals

### Phase 1: Foundation (Weeks 1-4)
**Goal:** Multi-tenant architecture + basic POS

### Phase 2: POS Features (Weeks 5-8)
**Goal:** Full-featured POS system

### Phase 3: Advanced Features (Weeks 9-12)
**Goal:** Analytics, integrations, mobile app

### Phase 4: Scale & Monetize (Weeks 13+)
**Goal:** Marketing, sales, growth

---

## 📋 Phase 1: Multi-Tenant Foundation (4 weeks)

### Week 1: Database Architecture ⭐ CRITICAL

#### 1.1 Add Organizations/Tenants Table
```sql
-- Organizations (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- for subdomain (acme.talastock.com)
  owner_id UUID REFERENCES auth.users(id),
  plan TEXT CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
  status TEXT CHECK (status IN ('active', 'suspended', 'cancelled')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Organization relationship (many-to-many)
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'manager', 'staff', 'cashier')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Add organization_id to all existing tables
ALTER TABLE products ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE categories ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE inventory ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE sales ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE stock_movements ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Create indexes for performance
CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_categories_org ON categories(organization_id);
CREATE INDEX idx_inventory_org ON inventory(organization_id);
CREATE INDEX idx_sales_org ON sales(organization_id);
CREATE INDEX idx_stock_movements_org ON stock_movements(organization_id);
```

#### 1.2 Update RLS Policies
```sql
-- Example: Products RLS
DROP POLICY IF EXISTS "Users can read products" ON products;
CREATE POLICY "Users can read own org products"
  ON products FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Repeat for all tables
```

#### 1.3 Data Migration Script
```typescript
// Migrate existing data to first organization
async function migrateToMultiTenant() {
  // 1. Create default organization
  const { data: org } = await supabase
    .from('organizations')
    .insert({
      name: 'Default Organization',
      slug: 'default',
      plan: 'pro'
    })
    .select()
    .single()

  // 2. Update all existing records
  await supabase.from('products').update({ organization_id: org.id })
  await supabase.from('categories').update({ organization_id: org.id })
  // ... etc
}
```

**Time:** 3-4 days  
**Priority:** ⭐⭐⭐ CRITICAL

---

### Week 2: Authentication & Onboarding

#### 2.1 Organization Signup Flow
```typescript
// New signup flow
1. User signs up
2. Create organization
3. Add user as owner
4. Redirect to onboarding
```

**Pages to Create:**
- `/signup` - New user registration
- `/onboarding` - Organization setup wizard
- `/invite` - Accept team invitation
- `/switch-org` - Switch between organizations

#### 2.2 Team Management
**Features:**
- Invite team members
- Assign roles (owner, admin, manager, staff, cashier)
- Set permissions
- Remove members
- Transfer ownership

**Page:** `/settings/team`

#### 2.3 Role-Based Access Control (RBAC)
```typescript
// Permission matrix
const PERMISSIONS = {
  owner: ['*'], // All permissions
  admin: ['products.*', 'inventory.*', 'sales.*', 'reports.*', 'settings.*'],
  manager: ['products.*', 'inventory.*', 'sales.*', 'reports.read'],
  staff: ['products.read', 'inventory.read', 'sales.create', 'sales.read'],
  cashier: ['sales.create', 'products.read']
}
```

**Time:** 4-5 days  
**Priority:** ⭐⭐⭐ CRITICAL

---

### Week 3: Tenant Context & Isolation

#### 3.1 Tenant Context Provider
```typescript
// context/TenantContext.tsx
export function TenantProvider({ children }) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [userRole, setUserRole] = useState<Role | null>(null)
  
  // Load current organization
  // Check permissions
  // Provide context to all components
}
```

#### 3.2 Update All Queries
```typescript
// Before
const { data } = await supabase.from('products').select('*')

// After
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('organization_id', currentOrg.id)
```

#### 3.3 Subdomain Routing (Optional)
```typescript
// acme.talastock.com → organization: acme
// binondo-traders.talastock.com → organization: binondo-traders

// middleware.ts
export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host')
  const subdomain = hostname?.split('.')[0]
  
  // Load organization by subdomain
  // Set in context
}
```

**Time:** 3-4 days  
**Priority:** ⭐⭐⭐ CRITICAL

---

### Week 4: Billing & Subscriptions

#### 4.1 Subscription Plans
```typescript
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    limits: {
      products: 50,
      sales_per_month: 100,
      users: 1,
      locations: 1
    }
  },
  basic: {
    name: 'Basic',
    price: 299, // ₱299/month
    limits: {
      products: 500,
      sales_per_month: 1000,
      users: 3,
      locations: 1
    }
  },
  pro: {
    name: 'Pro',
    price: 599,
    limits: {
      products: 5000,
      sales_per_month: 10000,
      users: 10,
      locations: 3
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 999,
    limits: {
      products: -1, // unlimited
      sales_per_month: -1,
      users: -1,
      locations: -1
    }
  }
}
```

#### 4.2 Payment Integration
**Options:**
- **PayMongo** (Filipino payment gateway) ⭐ RECOMMENDED
- **Stripe** (international)
- **GCash** (mobile wallet)
- **PayMaya** (mobile wallet)

#### 4.3 Usage Tracking
```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  metric TEXT, -- 'products', 'sales', 'users'
  count INTEGER,
  period DATE, -- YYYY-MM-DD
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Pages:**
- `/settings/billing` - View plan, usage, invoices
- `/upgrade` - Upgrade plan
- `/pricing` - Public pricing page

**Time:** 4-5 days  
**Priority:** ⭐⭐ HIGH

---

## 📋 Phase 2: POS Features (4 weeks)

### Week 5: POS Interface

#### 5.1 Dedicated POS Page
**Route:** `/pos`

**Features:**
- Product grid with images
- Quick search/barcode scan
- Shopping cart
- Customer display
- Payment methods
- Receipt printing
- Cash drawer integration

**Layout:**
```
┌─────────────────┬──────────────┐
│  Product Grid   │  Cart        │
│  [Search]       │  Items: 3    │
│  ┌───┬───┬───┐  │  Total: ₱450 │
│  │ P │ P │ P │  │              │
│  ├───┼───┼───┤  │  [Pay]       │
│  │ P │ P │ P │  │  [Cancel]    │
│  └───┴───┴───┘  │              │
└─────────────────┴──────────────┘
```

#### 5.2 Barcode Scanner Support
```typescript
// Listen for barcode scanner input
useEffect(() => {
  let barcode = ''
  let timeout: NodeJS.Timeout
  
  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      // Search product by barcode
      searchProduct(barcode)
      barcode = ''
    } else {
      barcode += e.key
      clearTimeout(timeout)
      timeout = setTimeout(() => barcode = '', 100)
    }
  }
  
  window.addEventListener('keypress', handleKeyPress)
  return () => window.removeEventListener('keypress', handleKeypress)
}, [])
```

#### 5.3 Payment Methods
- Cash
- Credit/Debit Card
- GCash
- PayMaya
- Bank Transfer
- Split Payment

**Time:** 5-6 days  
**Priority:** ⭐⭐⭐ CRITICAL

---

### Week 6: Receipt & Printing

#### 6.1 Receipt Template
```typescript
// Thermal printer (80mm)
function generateReceipt(sale: Sale) {
  return `
    ================================
         ${org.name}
    ${org.address}
    Tel: ${org.phone}
    ================================
    
    Date: ${formatDate(sale.created_at)}
    Receipt #: ${sale.receipt_number}
    Cashier: ${sale.cashier_name}
    
    --------------------------------
    Item              Qty    Amount
    --------------------------------
    ${sale.items.map(item => `
    ${item.name}
    ${item.quantity} x ₱${item.price}  ₱${item.subtotal}
    `).join('\n')}
    --------------------------------
    
    Subtotal:              ₱${sale.subtotal}
    Tax (12%):             ₱${sale.tax}
    --------------------------------
    TOTAL:                 ₱${sale.total}
    
    Payment: ${sale.payment_method}
    Cash:                  ₱${sale.cash_received}
    Change:                ₱${sale.change}
    
    ================================
       Thank you for your purchase!
          Please come again!
    ================================
  `
}
```

#### 6.2 Print Options
- **Browser Print:** `window.print()`
- **Thermal Printer:** ESC/POS commands
- **PDF Export:** jsPDF
- **Email Receipt:** Send via email
- **SMS Receipt:** Send via SMS (future)

#### 6.3 Receipt Customization
**Settings:**
- Logo upload
- Header/footer text
- Show/hide tax
- Show/hide barcode
- Paper size (58mm, 80mm)

**Time:** 3-4 days  
**Priority:** ⭐⭐⭐ CRITICAL

---

### Week 7: Customer Management

#### 7.1 Customers Table
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  total_purchases NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  last_purchase_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link sales to customers
ALTER TABLE sales ADD COLUMN customer_id UUID REFERENCES customers(id);
```

#### 7.2 Customer Features
- Add/edit customers
- Customer search in POS
- Purchase history
- Loyalty points (future)
- Customer analytics

**Page:** `/customers`

**Time:** 3-4 days  
**Priority:** ⭐⭐ HIGH

---

### Week 8: Discounts & Promotions

#### 8.1 Discounts Table
```sql
CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('percentage', 'fixed', 'bogo')),
  value NUMERIC NOT NULL,
  conditions JSONB, -- min_purchase, specific_products, etc.
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 8.2 Discount Types
- **Percentage:** 10% off
- **Fixed Amount:** ₱50 off
- **BOGO:** Buy 1 Get 1
- **Bundle:** Buy 3 for ₱100
- **Senior/PWD:** 20% discount

#### 8.3 Apply in POS
```typescript
// Apply discount to cart
function applyDiscount(cart: CartItem[], discount: Discount) {
  if (discount.type === 'percentage') {
    return cart.total * (1 - discount.value / 100)
  }
  // ... other types
}
```

**Time:** 3-4 days  
**Priority:** ⭐⭐ HIGH

---

## 📋 Phase 3: Advanced Features (4 weeks)

### Week 9: Multi-Location Support

#### 9.1 Locations Table
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add location_id to relevant tables
ALTER TABLE inventory ADD COLUMN location_id UUID REFERENCES locations(id);
ALTER TABLE sales ADD COLUMN location_id UUID REFERENCES locations(id);
```

#### 9.2 Features
- Manage multiple stores/branches
- Location-specific inventory
- Transfer stock between locations
- Location-specific reports
- Location-based permissions

**Time:** 4-5 days  
**Priority:** ⭐⭐ HIGH

---

### Week 10: Advanced Analytics

#### 10.1 Enhanced Dashboard
- Sales by hour/day/week/month
- Top products by revenue/quantity
- Customer analytics
- Profit margins
- Inventory turnover
- ABC analysis
- Cohort analysis

#### 10.2 Custom Reports
- Sales report
- Inventory report
- Profit & loss
- Tax report
- Customer report
- Employee performance

#### 10.3 Export Options
- PDF
- Excel
- CSV
- Email scheduled reports

**Time:** 4-5 days  
**Priority:** ⭐⭐ HIGH

---

### Week 11: Integrations

#### 11.1 Accounting Software
- **QuickBooks** integration
- **Xero** integration
- Auto-sync sales
- Auto-sync expenses

#### 11.2 E-commerce
- **Shopify** integration
- **WooCommerce** integration
- Sync inventory
- Import orders

#### 11.3 Payment Gateways
- **PayMongo** (Filipino)
- **Stripe** (international)
- **GCash** (mobile wallet)
- **PayMaya** (mobile wallet)

#### 11.4 Shipping
- **LBC** integration
- **J&T** integration
- Print shipping labels
- Track shipments

**Time:** 5-6 days  
**Priority:** ⭐ MEDIUM

---

### Week 12: Mobile App (PWA or Native)

#### 12.1 Progressive Web App (PWA)
**Pros:**
- Works on all devices
- No app store approval
- Easy updates
- Smaller development time

**Features:**
- Install to home screen
- Offline mode
- Push notifications
- Camera for barcode scanning

#### 12.2 React Native App (Future)
**Pros:**
- Better performance
- Native features
- App store presence

**Cons:**
- More development time
- Separate codebase

**Time:** 5-6 days (PWA) or 4-6 weeks (Native)  
**Priority:** ⭐ MEDIUM

---

## 📋 Phase 4: Scale & Monetize (Ongoing)

### Marketing & Sales

#### 1. Landing Page
- Hero section
- Features
- Pricing
- Testimonials
- CTA (Start Free Trial)

#### 2. Content Marketing
- Blog posts
- Video tutorials
- Case studies
- SEO optimization

#### 3. Sales Channels
- Direct sales
- Resellers/partners
- Affiliate program

#### 4. Customer Success
- Onboarding calls
- Training videos
- Help center
- Live chat support

---

## 💰 Pricing Strategy

### Recommended Pricing (Philippines)

```typescript
const PRICING = {
  free: {
    name: 'Starter',
    price: '₱0',
    period: 'forever',
    features: [
      '50 products',
      '100 sales/month',
      '1 user',
      '1 location',
      'Basic reports',
      'Email support'
    ]
  },
  basic: {
    name: 'Basic',
    price: '₱299',
    period: '/month',
    features: [
      '500 products',
      '1,000 sales/month',
      '3 users',
      '1 location',
      'Advanced reports',
      'Priority support',
      'Receipt customization'
    ]
  },
  pro: {
    name: 'Pro',
    price: '₱599',
    period: '/month',
    popular: true,
    features: [
      '5,000 products',
      '10,000 sales/month',
      '10 users',
      '3 locations',
      'All reports',
      'API access',
      'Integrations',
      'Priority support',
      'Custom branding'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: '₱999',
    period: '/month',
    features: [
      'Unlimited products',
      'Unlimited sales',
      'Unlimited users',
      'Unlimited locations',
      'White-label',
      'Dedicated support',
      'Custom features',
      'SLA guarantee'
    ]
  }
}
```

---

## 🎯 Success Metrics

### Technical Metrics
- **Uptime:** 99.9%
- **Response Time:** < 200ms
- **Error Rate:** < 0.1%
- **Load Time:** < 2s

### Business Metrics
- **MRR:** Monthly Recurring Revenue
- **Churn Rate:** < 5%
- **LTV:** Lifetime Value
- **CAC:** Customer Acquisition Cost
- **NPS:** Net Promoter Score > 50

### User Metrics
- **Active Users:** Daily/Monthly
- **Feature Adoption:** % using each feature
- **Support Tickets:** Response time, resolution rate
- **User Satisfaction:** Survey scores

---

## 🚀 Quick Start Guide

### Step 1: Commit Current Work
```bash
git add .
git commit -m "feat: complete UI improvements"
git push
```

### Step 2: Start Multi-Tenant Migration
```bash
# Create new branch
git checkout -b feature/multi-tenant

# Start with database schema
# Follow Week 1 tasks
```

### Step 3: Incremental Development
- Build one feature at a time
- Test thoroughly
- Deploy to staging
- Get feedback
- Iterate

---

## 📚 Resources

### Learning
- **Multi-tenancy:** [Supabase Multi-tenant Guide](https://supabase.com/docs/guides/auth/row-level-security)
- **POS Systems:** Study Square, Shopify POS, Lightspeed
- **SaaS Metrics:** [SaaS Metrics Guide](https://www.saastr.com)

### Tools
- **Supabase:** Database + Auth
- **Vercel:** Frontend hosting
- **Railway:** Backend hosting
- **PayMongo:** Payment processing
- **Sentry:** Error tracking
- **PostHog:** Analytics

---

## ⚠️ Important Considerations

### 1. Data Migration
- Backup everything before migration
- Test migration on staging first
- Have rollback plan
- Communicate with users

### 2. Performance
- Add database indexes
- Implement caching
- Optimize queries
- Use CDN for assets

### 3. Security
- Tenant isolation is CRITICAL
- Test RLS policies thoroughly
- Audit logs for all actions
- Regular security audits

### 4. Compliance
- **Data Privacy:** GDPR, Philippine Data Privacy Act
- **Accounting:** BIR requirements
- **Receipts:** Official receipt format
- **Tax:** VAT/Sales tax handling

---

## 🎉 Conclusion

**You have a solid foundation!** Your current Talastock app is production-ready and can serve as the base for a multi-tenant SaaS platform.

**Recommended Approach:**
1. **Ship current version** (single-tenant) to get users and feedback
2. **Start multi-tenant migration** in parallel
3. **Migrate existing users** to multi-tenant version
4. **Add POS features** incrementally
5. **Scale and monetize**

**Timeline:**
- **Phase 1:** 4 weeks (multi-tenant foundation)
- **Phase 2:** 4 weeks (POS features)
- **Phase 3:** 4 weeks (advanced features)
- **Phase 4:** Ongoing (scale & monetize)

**Total:** 3-4 months to full multi-tenant POS platform

**Let's build something amazing! 🚀**

---

**Next Steps:**
1. Review this roadmap
2. Prioritize features
3. Start with Phase 1, Week 1
4. Ship incrementally
5. Get feedback
6. Iterate

**Questions? Let's discuss!**

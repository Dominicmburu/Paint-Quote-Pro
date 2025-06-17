paint-quote-pro/
├── backend/
│   ├── app.py                          # Main Flask application
│   ├── config.py                       # Configuration settings
│   ├── requirements.txt                # Python dependencies
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                     # User model
│   │   ├── company.py                  # Company model
│   │   ├── project.py                  # Project model
│   │   ├── subscription.py             # Subscription model
│   │   ├── quote.py                    # Quote model
│   │   └── admin_log.py                # Admin activity logging
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py                     # Authentication routes
│   │   ├── projects.py                 # Project management routes
│   │   ├── quotes.py                   # Quote generation routes
│   │   ├── subscriptions.py            # Subscription management
│   │   └── admin.py                    # Admin panel routes
│   ├── services/
│   │   ├── __init__.py
│   │   ├── floor_plan_analyzer.py      # Floor plan analysis
│   │   ├── quote_generator.py          # Quote PDF generation
│   │   ├── subscription_service.py     # Stripe integration
│   │   ├── email_service.py            # Email notifications
│   │   ├── analytics_service.py        # Admin analytics
│   │   └── export_service.py           # Data export functionality
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── decorators.py               # Authentication decorators
│   │   ├── validators.py               # Input validation
│   │   └── helpers.py                  # Helper functions
│   ├── templates/
│   │   ├── emails/
│   │   │   ├── welcome.html
│   │   │   ├── quote_ready.html
│   │   │   ├── subscription_reminder.html
│   │   │   └── admin_notifications.html
│   │   └── pdf/
│   │       └── quote_template.html     # PDF quote template
│   ├── static/
│   │   ├── uploads/                    # User uploaded images
│   │   └── generated/                  # Generated quotes and analyses
│   └── database/
│       ├── init.sql                    # Database initialization
│       └── migrations/                 # Database migrations
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.js
│   │   │   │   ├── Footer.js
│   │   │   │   ├── Sidebar.js
│   │   │   │   ├── Loading.js
│   │   │   │   ├── Modal.js
│   │   │   │   ├── DataTable.js        # Reusable data table
│   │   │   │   ├── StatsCard.js        # Statistics card component
│   │   │   │   └── Charts.js           # Chart components
│   │   │   ├── auth/
│   │   │   │   ├── Login.js
│   │   │   │   ├── Register.js
│   │   │   │   ├── ForgotPassword.js
│   │   │   │   └── ProtectedRoute.js
│   │   │   ├── dashboard/
│   │   │   │   ├── Dashboard.js
│   │   │   │   ├── ProjectList.js
│   │   │   │   ├── ProjectCard.js
│   │   │   │   └── QuickStats.js
│   │   │   ├── projects/
│   │   │   │   ├── ProjectForm.js
│   │   │   │   ├── ProjectDetails.js
│   │   │   │   ├── ImageUpload.js
│   │   │   │   ├── ManualInput.js
│   │   │   │   ├── CreateProject.js
│   │   │   │   ├── EditProject.js
│   │   │   │   └── FloorPlanAnalysis.js
│   │   │   ├── quotes/
│   │   │   │   ├── QuoteGenerator.js
│   │   │   │   ├── QuotePreview.js
│   │   │   │   ├── QuoteSettings.js
│   │   │   │   └── QuoteHistory.js
│   │   │   ├── subscription/
│   │   │   │   ├── PricingPlans.js
│   │   │   │   ├── BillingInfo.js
│   │   │   │   ├── PaymentForm.js
│   │   │   │   └── SubscriptionStatus.js
│   │   │   ├── settings/
│   │   │   │   ├── Settings.js         # Main settings navigation
│   │   │   │   ├── CompanySettings.js
│   │   │   │   ├── UserProfile.js
│   │   │   │   └── PaintBrandSettings.js
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.js   # Main admin dashboard
│   │   │       ├── AdminLayout.js      # Admin sidebar/navigation
│   │   │       ├── UserManagement.js   # User CRUD operations
│   │   │       ├── CompanyManagement.js # Company management
│   │   │       ├── SubscriptionOverview.js # Subscription analytics
│   │   │       ├── ProjectsOverview.js # All projects view
│   │   │       ├── QuotesOverview.js   # All quotes view
│   │   │       ├── Analytics.js        # Business analytics
│   │   │       ├── SystemSettings.js   # System configuration
│   │   │       ├── ActivityLogs.js     # System activity logs
│   │   │       ├── Reports.js          # Generate reports
│   │   │       ├── Support.js          # Customer support tools
│   │   │       └── Billing.js          # Billing overview
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── About.js
│   │   │   ├── Pricing.js
│   │   │   ├── Features.js
│   │   │   ├── Contact.js
│   │   │   └── NotFound.js
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useSubscription.js
│   │   │   ├── useProjects.js
│   │   │   └── useAdmin.js             # Admin-specific hooks
│   │   ├── services/
│   │   │   ├── api.js                  # API client
│   │   │   ├── auth.js                 # Authentication service
│   │   │   ├── stripe.js               # Stripe integration
│   │   │   └── admin.js                # Admin API calls
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   ├── helpers.js
│   │   │   ├── validation.js
│   │   │   ├── formatting.js           # Data formatting utilities
│   │   │   └── export.js               # Data export utilities
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── components.css
│   │   │   ├── themes.css
│   │   │   └── admin.css               # Admin-specific styles
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── package.json
│   └── package-lock.json
│
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
│
├── docs/
│   ├── API.md                          # API documentation
│   ├── DEPLOYMENT.md                   # Deployment guide
│   ├── USER_GUIDE.md                   # User guide
│   └── ADMIN_GUIDE.md                  # Admin user guide
│
├── scripts/
│   ├── setup.sh                       # Initial setup script
│   ├── deploy.sh                      # Deployment script
│   ├── backup.sh                      # Database backup script
│   └── create_admin.py                 # Create super admin script
│
├── .gitignore
├── README.md
└── .env.example                       # Environment variables template


pip freeze > requirements.txt
# Paint-Quote-Pro





# AUTH
# Postman Test Samples for Paint Quote Pro Auth Routes

## 1. Register New User
**Method:** `POST`  
**URL:** `http://localhost:5000/auth/register`  
**Headers:** `Content-Type: application/json`

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "company_name": "Doe Painting Services",
  "phone": "+44 7700 900123",
  "company_email": "info@doepainting.com",
  "company_phone": "+44 20 7123 4567",
  "company_address": "123 Main Street, London, SW1A 1AA",
  "company_website": "https://www.doepainting.com",
  "preferred_paint_brand": "Dulux",
  "vat_number": "GB123456789",
  "vat_rate": 0.20
}
```

## 2. Login User
**Method:** `POST`  
**URL:** `http://localhost:5000/auth/login`  
**Headers:** `Content-Type: application/json`

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

## 3. Refresh Token
**Method:** `POST`  
**URL:** `http://localhost:5000/auth/refresh`  
**Headers:** 
- `Content-Type: application/json`
- `Authorization: Bearer {refresh_token_from_login}`

```json
{}
```

## 4. Get Current User Info
**Method:** `GET`  
**URL:** `http://localhost:5000/auth/me`  
**Headers:** 
- `Authorization: Bearer {access_token_from_login}`

*No body required*

## 5. Forgot Password
**Method:** `POST`  
**URL:** `http://localhost:5000/auth/forgot-password`  
**Headers:** `Content-Type: application/json`

```json
{
  "email": "john.doe@example.com"
}
```

## 6. Reset Password
**Method:** `POST`  
**URL:** `http://localhost:5000/auth/reset-password`  
**Headers:** `Content-Type: application/json`

```json
{
  "token": "sample_reset_token_here",
  "email": "john.doe@example.com",
  "password": "NewSecurePass123!"
}
```

## 7. Change Password (Authenticated)
**Method:** `POST`  
**URL:** `http://localhost:5000/auth/change-password`  
**Headers:** 
- `Content-Type: application/json`
- `Authorization: Bearer {access_token}`

```json
{
  "current_password": "SecurePass123!",
  "new_password": "NewSecurePass456!"
}
```

## 8. Update Profile (Authenticated)
**Method:** `PUT`  
**URL:** `http://localhost:5000/auth/update-profile`  
**Headers:** 
- `Content-Type: application/json`
- `Authorization: Bearer {access_token}`

```json
{
  "first_name": "Jonathan",
  "last_name": "Doe",
  "phone": "+44 7700 900456"
}
```

---

## Additional Test Scenarios

### Invalid Registration (Missing Required Fields)
```json
{
  "email": "incomplete@example.com",
  "password": "pass123"
}
```

### Invalid Registration (Weak Password)
```json
{
  "email": "weak@example.com",
  "password": "123",
  "first_name": "Test",
  "last_name": "User",
  "company_name": "Test Company"
}
```

### Invalid Login
```json
{
  "email": "wrong@example.com",
  "password": "wrongpassword"
}
```

### Registration with Minimal Required Fields
```json
{
  "email": "minimal@example.com",
  "password": "MinimalPass123!",
  "first_name": "Min",
  "last_name": "User",
  "company_name": "Minimal Painting Co"
}
```

---

## Testing Workflow

1. **Start with Registration:** Use the complete registration sample to create a new user
2. **Test Login:** Use the credentials from registration to login and get tokens
3. **Save Tokens:** Copy the `access_token` and `refresh_token` from login response
4. **Test Protected Routes:** Use the access token in Authorization header for `/me`, `/change-password`, `/update-profile`
5. **Test Token Refresh:** Use the refresh token to get a new access token
6. **Test Error Cases:** Try invalid inputs to verify error handling

## Expected Response Format

### Successful Registration/Login Response:
```json
{
  "message": "Registration successful",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "company": {
    "id": 1,
    "name": "Doe Painting Services",
    "email": "info@doepainting.com"
  },
  "subscription": {
    "id": 1,
    "plan_name": "starter",
    "status": "trial"
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Error Response:
```json
{
  "error": "Email already registered"
}
```


# SUBSCRIPTION

# Postman Test Data for Subscription API

## Environment Variables
Set these in your Postman environment:

```
BASE_URL = http://localhost:5000  # or your API URL
JWT_TOKEN = your_jwt_token_here
STRIPE_SECRET_KEY = sk_test_...
STRIPE_WEBHOOK_SECRET = whsec_...
```

## 1. GET Current Subscription
**Endpoint:** `{{BASE_URL}}/subscriptions/current`
**Method:** GET
**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
Content-Type: application/json
```

## 2. GET Subscription Plans
**Endpoint:** `{{BASE_URL}}/subscriptions/plans`
**Method:** GET
**Headers:**
```
Content-Type: application/json
```

## 3. POST Create Checkout Session
**Endpoint:** `{{BASE_URL}}/subscriptions/create-checkout-session`
**Method:** POST
**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
Content-Type: application/json
```

### Sample Request Bodies:

#### Starter Plan - Monthly
```json
{
  "plan_name": "starter",
  "billing_cycle": "monthly"
}
```

#### Professional Plan - Monthly
```json
{
  "plan_name": "professional",
  "billing_cycle": "monthly"
}
```

#### Enterprise Plan - Yearly
```json
{
  "plan_name": "enterprise",
  "billing_cycle": "yearly"
}
```

#### Business Plan - Monthly
```json
{
  "plan_name": "business",
  "billing_cycle": "monthly"
}
```

## 4. POST Stripe Webhook
**Endpoint:** `{{BASE_URL}}/subscriptions/webhook`
**Method:** POST
**Headers:**
```
Stripe-Signature: your_stripe_signature_here
Content-Type: application/json
```

### Sample Webhook Payloads:

#### Checkout Session Completed
```json
{
  "id": "evt_1234567890",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1234567890,
  "data": {
    "object": {
      "id": "cs_test_1234567890",
      "object": "checkout.session",
      "customer": "cus_test_1234567890",
      "subscription": "sub_test_1234567890",
      "metadata": {
        "company_id": "1",
        "plan_name": "professional",
        "billing_cycle": "monthly"
      },
      "payment_status": "paid",
      "status": "complete"
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_1234567890",
    "idempotency_key": null
  },
  "type": "checkout.session.completed"
}
```

#### Invoice Payment Succeeded
```json
{
  "id": "evt_1234567891",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1234567890,
  "data": {
    "object": {
      "id": "in_test_1234567890",
      "object": "invoice",
      "customer": "cus_test_1234567890",
      "subscription": "sub_test_1234567890",
      "period_start": 1234567890,
      "period_end": 1237159890,
      "paid": true,
      "status": "paid"
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_1234567891",
    "idempotency_key": null
  },
  "type": "invoice.payment_succeeded"
}
```

#### Invoice Payment Failed
```json
{
  "id": "evt_1234567892",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1234567890,
  "data": {
    "object": {
      "id": "in_test_1234567890",
      "object": "invoice",
      "customer": "cus_test_1234567890",
      "subscription": "sub_test_1234567890",
      "period_start": 1234567890,
      "period_end": 1237159890,
      "paid": false,
      "status": "open",
      "attempt_count": 3
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_1234567892",
    "idempotency_key": null
  },
  "type": "invoice.payment_failed"
}
```

#### Subscription Cancelled
```json
{
  "id": "evt_1234567893",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1234567890,
  "data": {
    "object": {
      "id": "sub_test_1234567890",
      "object": "subscription",
      "customer": "cus_test_1234567890",
      "status": "canceled",
      "canceled_at": 1234567890,
      "current_period_end": 1237159890,
      "current_period_start": 1234567890
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_1234567893",
    "idempotency_key": null
  },
  "type": "customer.subscription.deleted"
}
```

## Sample Configuration Data
Your Flask app should have this configuration:

```python
SUBSCRIPTION_PLANS = {
    'starter': {
        'name': 'Starter',
        'max_projects': 5,
        'max_users': 2,
        'stripe_price_id_monthly': 'price_starter_monthly',
        'stripe_price_id_yearly': 'price_starter_yearly'
    },
    'professional': {
        'name': 'Professional',
        'max_projects': 25,
        'max_users': 10,
        'stripe_price_id_monthly': 'price_professional_monthly',
        'stripe_price_id_yearly': 'price_professional_yearly'
    },
    'business': {
        'name': 'Business',
        'max_projects': 100,
        'max_users': 50,
        'stripe_price_id_monthly': 'price_business_monthly',
        'stripe_price_id_yearly': 'price_business_yearly'
    },
    'enterprise': {
        'name': 'Enterprise',
        'max_projects': -1,  # Unlimited
        'max_users': -1,     # Unlimited
        'stripe_price_id_monthly': 'price_enterprise_monthly',
        'stripe_price_id_yearly': 'price_enterprise_yearly'
    }
}
```

## Error Test Cases

### Invalid Plan Name
```json
{
  "plan_name": "invalid_plan",
  "billing_cycle": "monthly"
}
```

### Missing Billing Cycle
```json
{
  "plan_name": "professional"
}
```

### Invalid Billing Cycle
```json
{
  "plan_name": "starter",
  "billing_cycle": "weekly"
}
```

## Pre-request Scripts for Postman

Add this to your collection's pre-request script to generate timestamps:

```javascript
// Generate current timestamp
pm.environment.set("current_timestamp", Math.floor(Date.now() / 1000));

// Generate future timestamp (30 days)
pm.environment.set("future_timestamp", Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60));

// Generate Stripe test IDs
pm.environment.set("test_customer_id", "cus_test_" + Math.random().toString(36).substr(2, 9));
pm.environment.set("test_subscription_id", "sub_test_" + Math.random().toString(36).substr(2, 9));
pm.environment.set("test_invoice_id", "in_test_" + Math.random().toString(36).substr(2, 9));
```

## Test Sequence
1. First, test `GET /plans` to see available plans
2. Test `GET /current` to see current subscription (should create trial)
3. Test `POST /create-checkout-session` with different plans
4. Test webhook endpoints with sample payloads
5. Test error cases with invalid data

# Projects API

# Postman Test Data for Projects API

## Environment Variables
Add these to your Postman environment:

```
BASE_URL = http://localhost:5000
JWT_TOKEN = your_jwt_token_here
PROJECT_ID = 1  # Update after creating a project
```

## 1. GET All Projects
**Endpoint:** `{{BASE_URL}}/api/projects/`
**Method:** GET
**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
```

### Query Parameters (Optional):
- `page=1`
- `per_page=12`
- `status=draft` (or `analyzing`, `completed`)
- `search=kitchen`

**Full URL Examples:**
```
{{BASE_URL}}/api/projects/?page=1&per_page=10
{{BASE_URL}}/api/projects/?status=draft
{{BASE_URL}}/api/projects/?search=bathroom&page=1
```

## 2. POST Create New Project
**Endpoint:** `{{BASE_URL}}/api/projects/`
**Method:** POST
**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
Content-Type: application/json
```

### Sample Request Bodies:

#### Basic Project
```json
{
  "name": "Kitchen Renovation - Smith House",
  "description": "Complete kitchen renovation including walls and ceiling",
  "client_name": "John Smith",
  "client_email": "john.smith@email.com",
  "client_phone": "+44 7700 900123",
  "client_address": "123 Main Street, London, SW1A 1AA",
  "property_type": "residential"
}
```

#### Commercial Project
```json
{
  "name": "Office Building Paint Job",
  "description": "Commercial office space painting - 3 floors",
  "client_name": "ABC Corporation",
  "client_email": "facilities@abccorp.com",
  "client_phone": "+44 20 7946 0958",
  "client_address": "456 Business Park, Manchester, M1 1AA",
  "property_type": "commercial"
}
```

#### Residential Bathroom
```json
{
  "name": "Bathroom Refresh - Johnson Residence",
  "description": "Small bathroom repaint with moisture-resistant paint",
  "client_name": "Sarah Johnson",
  "client_email": "s.johnson@gmail.com",
  "client_phone": "+44 7800 123456",
  "client_address": "789 Oak Avenue, Birmingham, B1 1AA",
  "property_type": "residential"
}
```

#### Minimal Project (Required Fields Only)
```json
{
  "name": "Quick Paint Job"
}
```

## 3. GET Specific Project
**Endpoint:** `{{BASE_URL}}/api/projects/{{PROJECT_ID}}`
**Method:** GET
**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
```

## 4. PUT Update Project
**Endpoint:** `{{BASE_URL}}/api/projects/{{PROJECT_ID}}`
**Method:** PUT
**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
Content-Type: application/json
```

### Sample Update Bodies:

#### Update Client Information
```json
{
  "client_name": "John Smith Jr.",
  "client_email": "johnsmith.jr@email.com",
  "client_phone": "+44 7700 900124",
  "description": "Updated description with new requirements"
}
```

#### Update Project Details
```json
{
  "name": "Updated Project Name",
  "property_type": "commercial",
  "client_address": "New Address, London, W1A 1AA"
}
```

## 5. DELETE Project
**Endpoint:** `{{BASE_URL}}/api/projects/{{PROJECT_ID}}`
**Method:** DELETE
**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
```

## 6. POST Upload Files
**Endpoint:** `{{BASE_URL}}/api/projects/{{PROJECT_ID}}/upload`
**Method:** POST
**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
```
**Body Type:** form-data

### Form Data:
- Key: `files` (Type: File)
- Value: Select multiple image files (PNG, JPG, JPEG, GIF, BMP, TIFF, PDF)

**Note:** You'll need actual image files to test this endpoint. Create some test floor plan images or use sample images.

## 7. POST Analyze Floor Plan
**Endpoint:** `{{BASE_URL}}/api/projects/{{PROJECT_ID}}/analyze`
**Method:** POST
**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
Content-Type: application/json
```
**Body:** (Optional - can be empty)
```json
{}
```

## 8. POST Save Manual Measurements
**Endpoint:** `{{BASE_URL}}/api/projects/{{PROJECT_ID}}/manual-measurements`
**Method:** POST
**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
Content-Type: application/json
```

### Sample Measurements:

#### Simple Room Measurements
```json
{
  "rooms": [
    {
      "name": "Kitchen",
      "walls": [
        {
          "name": "North Wall",
          "length": 4.2,
          "height": 2.4,
          "area": 10.08,
          "doors": 1,
          "windows": 0
        },
        {
          "name": "South Wall", 
          "length": 4.2,
          "height": 2.4,
          "area": 10.08,
          "doors": 0,
          "windows": 1
        },
        {
          "name": "East Wall",
          "length": 3.5,
          "height": 2.4,
          "area": 8.4,
          "doors": 0,
          "windows": 0
        },
        {
          "name": "West Wall",
          "length": 3.5,
          "height": 2.4,
          "area": 8.4,
          "doors": 0,
          "windows": 0
        }
      ],
      "ceiling": {
        "area": 14.7,
        "height": 2.4
      },
      "total_wall_area": 37.0,
      "paint_type": "kitchen_bathroom"
    }
  ],
  "total_area": 51.7,
  "notes": "Standard height rooms, good condition walls"
}
```

#### Multi-Room Measurements
```json
{
  "rooms": [
    {
      "name": "Living Room",
      "walls": [
        {
          "name": "North Wall",
          "length": 6.0,
          "height": 2.4,
          "area": 14.4,
          "doors": 1,
          "windows": 2
        },
        {
          "name": "South Wall",
          "length": 6.0,
          "height": 2.4,
          "area": 14.4,
          "doors": 0,
          "windows": 0
        },
        {
          "name": "East Wall",
          "length": 4.0,
          "height": 2.4,
          "area": 9.6,
          "doors": 0,
          "windows": 1
        },
        {
          "name": "West Wall",
          "length": 4.0,
          "height": 2.4,
          "area": 9.6,
          "doors": 1,
          "windows": 0
        }
      ],
      "ceiling": {
        "area": 24.0,
        "height": 2.4
      },
      "total_wall_area": 48.0,
      "paint_type": "interior_standard"
    },
    {
      "name": "Bedroom 1",
      "walls": [
        {
          "name": "North Wall",
          "length": 3.8,
          "height": 2.4,
          "area": 9.12,
          "doors": 1,
          "windows": 1
        },
        {
          "name": "South Wall",
          "length": 3.8,
          "height": 2.4,
          "area": 9.12,
          "doors": 0,
          "windows": 0
        },
        {
          "name": "East Wall",
          "length": 3.2,
          "height": 2.4,
          "area": 7.68,
          "doors": 0,
          "windows": 1
        },
        {
          "name": "West Wall",
          "length": 3.2,
          "height": 2.4,
          "area": 7.68,
          "doors": 0,
          "windows": 0
        }
      ],
      "ceiling": {
        "area": 12.16,
        "height": 2.4
      },
      "total_wall_area": 33.6,
      "paint_type": "interior_standard"
    }
  ],
  "total_area": 117.76,
  "door_area_deduction": 12.0,
  "window_area_deduction": 15.0,
  "net_paintable_area": 90.76,
  "notes": "Two bedrooms and living room, standard residential"
}
```

## 9. GET Download Project File
**Endpoint:** `{{BASE_URL}}/api/projects/{{PROJECT_ID}}/files/filename.jpg`
**Method:** GET
**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
```

## 10. POST Duplicate Project
**Endpoint:** `{{BASE_URL}}/api/projects/{{PROJECT_ID}}/duplicate`
**Method:** POST
**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
Content-Type: application/json
```

### Sample Bodies:

#### With Custom Name
```json
{
  "name": "Copy of Kitchen Renovation"
}
```

#### Default Name (Empty Body)
```json
{}
```

## 11. GET Project Statistics
**Endpoint:** `{{BASE_URL}}/api/projects/stats`
**Method:** GET
**Headers:**
```
Authorization: Bearer {{JWT_TOKEN}}
```

## Test Workflow Sequence

### 1. Create a Project
```
POST /api/projects/
Body: {"name": "Test Project", "client_name": "Test Client"}
```

### 2. Get All Projects (should show your new project)
```
GET /api/projects/
```

### 3. Update the Project (use ID from step 1)
```
PUT /api/projects/1
Body: {"description": "Updated description"}
```

### 4. Add Manual Measurements
```
POST /api/projects/1/manual-measurements
Body: (use sample measurements above)
```

### 5. Get Project Stats
```
GET /api/projects/stats
```

### 6. Duplicate the Project
```
POST /api/projects/1/duplicate
Body: {"name": "Duplicated Test Project"}
```

## Error Test Cases

### Invalid Project Creation
```json
{
  "description": "Project without required name"
}
```

### Invalid Measurements Format
```json
{
  "invalid": "data structure"
}
```

### Non-existent Project ID
```
GET /api/projects/99999
```

## Pre-request Script for Dynamic Data

Add this to your Postman collection's pre-request script:

```javascript
// Generate dynamic test data
const clientNames = ["John Smith", "Sarah Johnson", "Mike Wilson", "Emma Brown"];
const propertyTypes = ["residential", "commercial"];
const projectTypes = ["Kitchen", "Bathroom", "Living Room", "Office", "Bedroom"];

// Set random client name
pm.environment.set("random_client", clientNames[Math.floor(Math.random() * clientNames.length)]);

// Set random property type
pm.environment.set("random_property_type", propertyTypes[Math.floor(Math.random() * propertyTypes.length)]);

// Set random project name
const randomProject = projectTypes[Math.floor(Math.random() * projectTypes.length)];
pm.environment.set("random_project_name", `${randomProject} Renovation - ${Date.now()}`);

// Generate random phone number
pm.environment.set("random_phone", `+44 7${Math.floor(Math.random() * 900000000 + 100000000)}`);
```

Then use variables like `{{random_client}}` in your request bodies.

## Expected Response Formats

### Successful Project Creation (201)
```json
{
  "message": "Project created successfully",
  "project": {
    "id": 1,
    "name": "Kitchen Renovation",
    "status": "draft",
    "created_at": "2025-06-14T18:00:00Z",
    // ... other project fields
  }
}
```

### Project List (200)
```json
{
  "projects": [
    {
      "id": 1,
      "name": "Project 1",
      // ... project fields
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 5,
    "per_page": 12,
    "total": 50,
    "has_next": true,
    "has_prev": false
  }
}
```


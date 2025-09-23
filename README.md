# 🎨 Flotto - Paint Quote Pro System

A comprehensive painting contractor management system that streamlines project estimation, quote generation, and business operations. Flotto combines AI-powered floor plan analysis with professional quote generation to help painting contractors grow their business efficiently.

## ✨ System Overview

Flotto is a full-stack web application designed for painting contractors to:
- **Manage Projects**: Create, track, and organize painting projects
- **Generate Professional Quotes**: AI-powered estimation with PDF generation
- **Client Management**: Maintain client relationships and project history
- **Floor Plan Analysis**: Automated measurement extraction from uploaded plans
- **Subscription Management**: Flexible pricing tiers with Stripe integration
- **Team Collaboration**: Multi-user support with role-based access

---

# 🖥️ Frontend Documentation

## Technology Stack

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useReducer, Context API)
- **Routing**: React Router
- **HTTP Client**: Axios/Fetch API
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Code Quality**: ESLint, PostCSS

## Project Structure

```
frontend/
├── public/                     # Static assets
│   ├── images/                # App images and logos
│   │   ├── flotto_logo.png    # Main application logo
│   │   ├── hero.png           # Landing page hero image
│   │   └── *.png              # Various UI images
│   └── vite.svg               # Vite framework logo
├── src/                       # Source code
│   ├── components/            # Reusable React components
│   ├── pages/                 # Route-level components
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # API communication layer
│   ├── styles/                # CSS stylesheets
│   ├── utils/                 # Utility functions
│   ├── App.jsx               # Root component
│   └── main.jsx              # Application entry point
└── Configuration Files
    ├── vite.config.js         # Vite configuration
    ├── tailwind.config.js     # Tailwind CSS configuration
    ├── eslint.config.js       # ESLint rules
    └── package.json           # Dependencies and scripts
```

## Component Architecture

### 🔐 Authentication Components (`/components/auth/`)
- **Login.jsx**: User authentication form with validation
- **Register.jsx**: New user registration with company setup
- **ForgotPassword.jsx**: Password recovery functionality
- **ProtectedRoute.jsx**: Route guard for authenticated users

### 👑 Admin Components (`/components/admin/`)
- **AdminDashboard.jsx**: Main administrative interface
- **AdminLayout.jsx**: Common layout wrapper for admin pages
- **UserManagement.jsx**: User permissions and role management
- **CompanyManagement.jsx**: Multi-tenant company settings
- **Analytics.jsx**: Business intelligence and reporting
- **SystemSettings.jsx**: Application-wide configuration
- **Billing.jsx**: Payment processing and invoice management
- **Support.jsx**: Customer service and help desk

### 📊 Dashboard Components (`/components/dashboard/`)
- **Dashboard.jsx**: Main user dashboard with overview stats
- **ProjectCard.jsx**: Visual project summary cards
- **ProjectList.jsx**: Tabular project listing with filters
- **QuickStats.jsx**: Key performance indicators display

### 🏗️ Project Management (`/components/projects/`)
- **CreateProject.jsx**: New project creation wizard
- **EditProject.jsx**: Project modification interface
- **ProjectDetails.jsx**: Comprehensive project information view
- **FloorPlanUpload.jsx**: File upload with drag-and-drop support
- **RoomMeasurements.jsx**: Manual measurement input forms
- **ClientInformation.jsx**: Client contact and property details
- **InteriorWork.jsx**: Interior painting specifications
- **ExteriorWork.jsx**: Exterior painting requirements
- **SpecialJobsSection.jsx**: Custom work and additions

### 📋 Quote Management (`/components/quotes/`)
- **QuoteGenerator.jsx**: Automated quote creation from project data
- **QuotePreview.jsx**: Quote review before sending to client
- **QuotePDFViewer.jsx**: PDF generation and download functionality
- **QuoteList.jsx**: Historical quotes with search and filtering
- **QuoteManagement.jsx**: Edit, duplicate, and archive quotes
- **PublicQuoteSignature.jsx**: Client-facing signature capture
- **QuoteSignedConfirmation.jsx**: Post-signature confirmation page
- **SignatureLinkShare.jsx**: Generate and share signature links
- **QuoteSettings.jsx**: Quote templates and default configurations

### 👥 Client Management (`/components/clients/`)
- **ClientForm.jsx**: Add/edit client information
- **ClientSelector.jsx**: Client search and selection component

### ⚙️ Settings Components (`/components/settings/`)
- **UserProfile.jsx**: Personal profile management
- **CompanySettings.jsx**: Business information and branding
- **PricingSettings.jsx**: Labor rates and material costs
- **PaintBrandSettings.jsx**: Preferred paint brands and pricing

### 💳 Subscription Management (`/components/subscription/`)
- **PricingPlans.jsx**: Available subscription tiers display
- **PaymentForm.jsx**: Stripe payment processing
- **SubscriptionStatus.jsx**: Current plan and usage tracking
- **PaymentHistory.jsx**: Billing history and invoices

### 🧩 Common/Shared Components (`/components/common/`)
- **Header.jsx**: Navigation bar with user menu
- **Footer.jsx**: Site footer with links
- **Sidebar.jsx**: Main navigation sidebar
- **Modal.jsx**: Reusable modal dialog component
- **Loading.jsx**: Loading spinners and progress indicators
- **ErrorBoundary.jsx**: Error catching and graceful degradation
- **LanguageSwitcher.jsx**: Multi-language support

## Pages Structure (`/pages/`)

### Marketing & Information Pages
- **Home.jsx**: Landing page with hero section and features
- **About.jsx**: Company information and team details
- **Features.jsx**: Detailed feature descriptions
- **Pricing.jsx**: Public pricing information
- **Testimonials.jsx**: Customer success stories
- **Contact.jsx**: Contact form and business information

### Legal & Policy Pages
- **PrivacyPolicy.jsx**: Data handling and privacy information
- **TermsofService.jsx**: User agreement and terms
- **CookiePolicy.jsx**: Cookie usage and preferences

### Payment & Subscription Pages
- **PaymentSuccess.jsx**: Successful payment confirmation
- **PaymentFailed.jsx**: Payment failure handling
- **PaymentCancelled.jsx**: Payment cancellation page
- **SubscriptionExpired.jsx**: Expired subscription notice
- **TrialExpired.jsx**: Trial period completion notice

### Application Pages
- **Settings.jsx**: User settings aggregation page
- **Subscription.jsx**: Subscription management interface
- **NotFound.jsx**: 404 error page

## Custom Hooks (`/hooks/`)

### 🔐 useAuth.jsx
```javascript
// Authentication state management
const { user, login, logout, register, isAuthenticated, loading } = useAuth();
```
- Manages user authentication state
- Handles login/logout operations
- Provides authentication status
- Token refresh functionality

### 💰 usePricing.jsx
```javascript
// Pricing calculations and management
const { calculateQuote, getPaintCost, getLaborCost, updatePricing } = usePricing();
```
- Handles all pricing calculations
- Manages material and labor costs
- Quote generation logic
- Pricing templates and configurations

### 🏗️ useProjects.jsx
```javascript
// Project state and operations
const { projects, createProject, updateProject, deleteProject, loading } = useProjects();
```
- Project CRUD operations
- Project state management
- File upload handling
- Search and filtering logic

### 💳 useSubscription.jsx
```javascript
// Subscription management
const { subscription, plans, createCheckout, currentUsage } = useSubscription();
```
- Current subscription status
- Usage tracking and limits
- Stripe checkout integration
- Plan comparison and upgrades

### 🌐 useTranslation.jsx
```javascript
// Multi-language support
const { t, changeLanguage, currentLanguage } = useTranslation();
```
- Text translation functionality
- Language switching
- Locale management
- RTL/LTR support

## Development Workflow

### 🚀 Getting Started
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

```

# Backend Documentation

## Architecture Overview

The backend is built using Flask with a modular structure following MVC patterns. It provides RESTful APIs for project management, quote generation, subscription handling, and user authentication.

## Project Structure

```
backend/
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
│   │   ├── client.py                   # Client model
│   │   └── pricing.py                  # Pricing model
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py                     # Authentication routes
│   │   ├── projects.py                 # Project management routes
│   │   ├── quotes.py                   # Quote generation routes
│   │   ├── subscriptions.py            # Subscription management
│   │   ├── quotes.py                   # Quote generation routes
│   │   ├── clients.py                  # Clients management
│   │   ├── settings.py                  # Settings management
│   │   └── admin.py                    # Admin panel routes
│   ├── services/
│   │   ├── __init__.py
│   │   ├── floor_plan_analyzer.py      # Floor plan analysis
│   │   ├── quote_generator.py          # Quote PDF generation
│   │   ├── subscription_service.py     # Stripe integration
│   │   ├── email_service.py            # Email notifications
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── decorators.py               # Authentication decorators
│   │   ├── validators.py               # Input validation
│   │   └── helpers.py                  # Helper functions
│   ├── templates/
│   │   ├── emails/
│   │   └── pdf/
│   ├── static/
│   │   ├── uploads/                    # User uploaded images
│   │   └── generated/                  # Generated quotes and analyses
│   └── database/
│       ├── init.sql                    # Database initialization
│       └── migrations/                 # Database migrations
```

## Core Files

### `app.py`
Main Flask application entry point. Initializes the Flask app, configures CORS, registers blueprints, sets up database connections, and handles application-wide middleware. Contains error handlers for common HTTP status codes and manages the application context.

### `config.py`
Central configuration management for different environments (development, testing, production). Handles environment variables, database URIs, JWT secrets, Stripe API keys, email configuration, file upload settings, and security configurations.

## Models Directory (`/models/`)

### `__init__.py`
Initializes the models package and sets up SQLAlchemy database instance. Contains database initialization functions and common model utilities.

### `user.py`
User model defining the user entity structure. Handles user authentication data, profile information, password hashing, JWT token generation/validation, user roles and permissions, and relationships to company and subscription models.

### `company.py`
Company model representing painting contractor businesses. Manages company profile data, business information, VAT settings, paint brand preferences, contact details, and relationships to users and projects.

### `project.py`
Project model for managing painting projects. Stores project details, client information, measurements data, file attachments, project status tracking, and relationships to quotes and companies.

### `subscription.py`
Subscription model handling billing and plan management. Manages subscription plans, Stripe integration data, billing cycles, usage limits, trial periods, and payment status tracking.

### `quote.py`
Quote model for generating and managing project quotes. Handles quote calculations, PDF generation data, client approval status, pricing breakdowns, and relationships to projects.

### `client.py`
Client model for managing customer information. Stores client contact details, project history, communication preferences, and relationships to projects and quotes.

### `pricing.py`
Pricing model for managing cost calculations. Handles paint costs, labor rates, material pricing, regional adjustments, and pricing rules for different project types.

## Routes Directory (`/routes/`)

### `__init__.py`
Initializes the routes package and registers all blueprints with the main Flask application.

### `auth.py`
**Authentication and User Management Routes**

#### User Registration & Authentication
- `POST /auth/register`
  - Registers new users and creates associated company
  - **Body**: email, password, first_name, last_name, company_name, phone, company_email, company_phone, company_address, company_website, preferred_paint_brand, vat_number, vat_rate
  - **Returns**: User data, company info, JWT tokens, trial subscription details
  - **Status**: 201 Created / 400 Bad Request / 409 Conflict

- `POST /auth/login`
  - Authenticates user and returns access tokens
  - **Body**: email, password
  - **Returns**: User info, JWT access_token, refresh_token
  - **Status**: 200 OK / 401 Unauthorized / 400 Bad Request

- `POST /auth/refresh`
  - Refreshes access token using refresh token
  - **Headers**: Authorization: Bearer {refresh_token}
  - **Returns**: New access_token
  - **Status**: 200 OK / 401 Unauthorized

- `GET /auth/me`
  - Returns current user profile information
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: User profile, company info, subscription status
  - **Status**: 200 OK / 401 Unauthorized

#### Password Management
- `POST /auth/forgot-password`
  - Initiates password reset process
  - **Body**: email
  - **Returns**: Success message (email sent)
  - **Status**: 200 OK / 404 Not Found

- `POST /auth/reset-password`
  - Resets password using reset token
  - **Body**: token, email, password
  - **Returns**: Success message
  - **Status**: 200 OK / 400 Bad Request / 404 Not Found

- `POST /auth/change-password`
  - Changes password for authenticated user
  - **Headers**: Authorization: Bearer {access_token}
  - **Body**: current_password, new_password
  - **Returns**: Success message
  - **Status**: 200 OK / 400 Bad Request / 401 Unauthorized

#### Profile Management
- `PUT /auth/update-profile`
  - Updates user profile information
  - **Headers**: Authorization: Bearer {access_token}
  - **Body**: first_name, last_name, phone (optional fields)
  - **Returns**: Updated user profile
  - **Status**: 200 OK / 400 Bad Request / 401 Unauthorized

- `POST /auth/logout`
  - Logs out user and invalidates tokens
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: Success message
  - **Status**: 200 OK

### `projects.py`
**Project Management Routes**

#### Project CRUD Operations
- `GET /api/projects/`
  - Retrieves paginated list of user's projects
  - **Headers**: Authorization: Bearer {access_token}
  - **Query Params**: page, per_page, status, search
  - **Returns**: Projects array, pagination metadata
  - **Status**: 200 OK / 401 Unauthorized

- `POST /api/projects/`
  - Creates new painting project
  - **Headers**: Authorization: Bearer {access_token}
  - **Body**: name, description, client_name, client_email, client_phone, client_address, property_type
  - **Returns**: Created project details
  - **Status**: 201 Created / 400 Bad Request / 401 Unauthorized

- `GET /api/projects/{project_id}`
  - Retrieves specific project details
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: Complete project information including measurements and files
  - **Status**: 200 OK / 404 Not Found / 401 Unauthorized

- `PUT /api/projects/{project_id}`
  - Updates existing project
  - **Headers**: Authorization: Bearer {access_token}
  - **Body**: Any project fields to update
  - **Returns**: Updated project details
  - **Status**: 200 OK / 404 Not Found / 400 Bad Request / 401 Unauthorized

- `DELETE /api/projects/{project_id}`
  - Deletes project and associated files
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: Success message
  - **Status**: 200 OK / 404 Not Found / 401 Unauthorized

#### File Management
- `POST /api/projects/{project_id}/upload`
  - Uploads floor plan images and documents
  - **Headers**: Authorization: Bearer {access_token}
  - **Body**: multipart/form-data with 'files' field
  - **Returns**: Uploaded file information
  - **Status**: 200 OK / 400 Bad Request / 413 Payload Too Large / 401 Unauthorized

- `GET /api/projects/{project_id}/files/{filename}`
  - Downloads project file
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: File content
  - **Status**: 200 OK / 404 Not Found / 401 Unauthorized

#### Analysis and Measurements
- `POST /api/projects/{project_id}/analyze`
  - Triggers AI analysis of uploaded floor plans
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: Analysis results and extracted measurements
  - **Status**: 200 OK / 400 Bad Request / 404 Not Found / 401 Unauthorized

- `POST /api/projects/{project_id}/manual-measurements`
  - Saves manually entered room measurements
  - **Headers**: Authorization: Bearer {access_token}
  - **Body**: rooms array with walls, ceiling, area data
  - **Returns**: Saved measurements and calculated totals
  - **Status**: 200 OK / 400 Bad Request / 404 Not Found / 401 Unauthorized

#### Project Utilities
- `POST /api/projects/{project_id}/duplicate`
  - Creates copy of existing project
  - **Headers**: Authorization: Bearer {access_token}
  - **Body**: name (optional - defaults to "Copy of {original_name}")
  - **Returns**: New project details
  - **Status**: 201 Created / 404 Not Found / 401 Unauthorized

- `GET /api/projects/stats`
  - Retrieves project statistics for dashboard
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: Project counts by status, recent activity
  - **Status**: 200 OK / 401 Unauthorized

### `quotes.py`
**Quote Generation and Management Routes**

#### Quote Operations
- `GET /api/quotes/`
  - Retrieves list of all quotes for user's company
  - **Headers**: Authorization: Bearer {access_token}
  - **Query Params**: page, per_page, status, project_id
  - **Returns**: Quotes array with pagination
  - **Status**: 200 OK / 401 Unauthorized

- `POST /api/quotes/generate`
  - Generates new quote from project data
  - **Headers**: Authorization: Bearer {access_token}
  - **Body**: project_id, pricing_options, materials, labor_rates
  - **Returns**: Generated quote details and PDF URL
  - **Status**: 201 Created / 400 Bad Request / 404 Not Found / 401 Unauthorized

- `GET /api/quotes/{quote_id}`
  - Retrieves specific quote details
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: Complete quote information
  - **Status**: 200 OK / 404 Not Found / 401 Unauthorized

- `PUT /api/quotes/{quote_id}`
  - Updates quote information
  - **Headers**: Authorization: Bearer {access_token}
  - **Body**: Updated quote fields
  - **Returns**: Updated quote details
  - **Status**: 200 OK / 404 Not Found / 400 Bad Request / 401 Unauthorized

- `DELETE /api/quotes/{quote_id}`
  - Deletes quote and associated files
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: Success message
  - **Status**: 200 OK / 404 Not Found / 401 Unauthorized

#### Quote PDF Management
- `GET /api/quotes/{quote_id}/pdf`
  - Downloads quote PDF
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: PDF file
  - **Status**: 200 OK / 404 Not Found / 401 Unauthorized

- `POST /api/quotes/{quote_id}/regenerate-pdf`
  - Regenerates quote PDF with updated data
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: New PDF URL
  - **Status**: 200 OK / 404 Not Found / 401 Unauthorized

#### Client Interaction
- `POST /api/quotes/{quote_id}/send`
  - Sends quote to client via email
  - **Headers**: Authorization: Bearer {access_token}
  - **Body**: client_email, message (optional)
  - **Returns**: Success message
  - **Status**: 200 OK / 404 Not Found / 400 Bad Request / 401 Unauthorized

- `GET /api/quotes/{quote_id}/public/{token}`
  - Public route for clients to view quote
  - **Returns**: Quote details for client review
  - **Status**: 200 OK / 404 Not Found / 410 Gone (expired)

- `POST /api/quotes/{quote_id}/sign/{token}`
  - Public route for client to sign quote
  - **Body**: signature_data, client_name, signed_date
  - **Returns**: Signed quote confirmation
  - **Status**: 200 OK / 404 Not Found / 410 Gone (expired)

### `subscriptions.py`
**Subscription and Billing Management Routes**

#### Subscription Information
- `GET /subscriptions/current`
  - Retrieves current subscription details
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: Subscription info, usage limits, billing status
  - **Status**: 200 OK / 401 Unauthorized

- `GET /subscriptions/plans`
  - Retrieves available subscription plans
  - **Returns**: Array of available plans with features and pricing
  - **Status**: 200 OK

#### Billing Operations
- `POST /subscriptions/create-checkout-session`
  - Creates Stripe checkout session for plan upgrade
  - **Headers**: Authorization: Bearer {access_token}
  - **Body**: plan_name, billing_cycle (monthly/yearly)
  - **Returns**: Stripe checkout URL
  - **Status**: 200 OK / 400 Bad Request / 401 Unauthorized

- `POST /subscriptions/webhook`
  - Handles Stripe webhook events
  - **Headers**: Stripe-Signature
  - **Body**: Stripe webhook payload
  - **Returns**: Success acknowledgment
  - **Status**: 200 OK / 400 Bad Request

- `POST /subscriptions/cancel`
  - Cancels active subscription
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: Cancellation confirmation
  - **Status**: 200 OK / 400 Bad Request / 401 Unauthorized

- `GET /subscriptions/invoices`
  - Retrieves billing history
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: Array of invoice records
  - **Status**: 200 OK / 401 Unauthorized

### `clients.py`
**Client Management Routes**

#### Client CRUD Operations
- `GET /api/clients/`
  - Retrieves list of all clients
  - **Headers**: Authorization: Bearer {access_token}
  - **Query Params**: page, per_page, search
  - **Returns**: Clients array with pagination
  - **Status**: 200 OK / 401 Unauthorized

- `POST /api/clients/`
  - Creates new client record
  - **Headers**: Authorization: Bearer {access_token}
  - **Body**: name, email, phone, address, notes
  - **Returns**: Created client details
  - **Status**: 201 Created / 400 Bad Request / 401 Unauthorized

- `GET /api/clients/{client_id}`
  - Retrieves specific client details
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: Client info and project history
  - **Status**: 200 OK / 404 Not Found / 401 Unauthorized

- `PUT /api/clients/{client_id}`
  - Updates client information
  - **Headers**: Authorization: Bearer {access_token}
  - **Body**: Updated client fields
  - **Returns**: Updated client details
  - **Status**: 200 OK / 404 Not Found / 400 Bad Request / 401 Unauthorized

- `DELETE /api/clients/{client_id}`
  - Deletes client record
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: Success message
  - **Status**: 200 OK / 404 Not Found / 401 Unauthorized

### `settings.py`
**Application Settings Management Routes**

#### Company Settings
- `GET /api/settings/company`
  - Retrieves company profile settings
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: Company information and preferences
  - **Status**: 200 OK / 401 Unauthorized

- `PUT /api/settings/company`
  - Updates company settings
  - **Headers**: Authorization: Bearer {access_token}
  - **Body**: Company fields to update
  - **Returns**: Updated company settings
  - **Status**: 200 OK / 400 Bad Request / 401 Unauthorized

#### Pricing Settings
- `GET /api/settings/pricing`
  - Retrieves pricing configuration
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: Current pricing rules and rates
  - **Status**: 200 OK / 401 Unauthorized

- `PUT /api/settings/pricing`
  - Updates pricing settings
  - **Headers**: Authorization: Bearer {access_token}
  - **Body**: Updated pricing configuration
  - **Returns**: Updated pricing settings
  - **Status**: 200 OK / 400 Bad Request / 401 Unauthorized

#### Paint Brand Settings
- `GET /api/settings/paint-brands`
  - Retrieves available paint brands and preferences
  - **Headers**: Authorization: Bearer {access_token}
  - **Returns**: Paint brand options and current selection
  - **Status**: 200 OK / 401 Unauthorized

- `PUT /api/settings/paint-brands`
  - Updates paint brand preferences
  - **Headers**: Authorization: Bearer {access_token}
  - **Body**: preferred_paint_brand, custom_brands
  - **Returns**: Updated preferences
  - **Status**: 200 OK / 400 Bad Request / 401 Unauthorized

### `admin.py`
**Administrative Routes (Super Admin Access)**

#### User Management
- `GET /admin/users`
  - Retrieves all users across all companies
  - **Headers**: Authorization: Bearer {admin_access_token}
  - **Query Params**: page, per_page, search, status
  - **Returns**: Users array with company and subscription info
  - **Status**: 200 OK / 403 Forbidden

- `PUT /admin/users/{user_id}/status`
  - Updates user status (active/inactive)
  - **Headers**: Authorization: Bearer {admin_access_token}
  - **Body**: is_active
  - **Returns**: Updated user status
  - **Status**: 200 OK / 404 Not Found / 403 Forbidden

#### System Analytics
- `GET /admin/analytics`
  - Retrieves system-wide analytics
  - **Headers**: Authorization: Bearer {admin_access_token}
  - **Returns**: Usage statistics, revenue data, user metrics
  - **Status**: 200 OK / 403 Forbidden

- `GET /admin/subscriptions`
  - Retrieves all subscription data
  - **Headers**: Authorization: Bearer {admin_access_token}
  - **Returns**: Subscription statistics and billing overview
  - **Status**: 200 OK / 403 Forbidden

## Services Directory (`/services/`)

### `__init__.py`
Initializes the services package and provides common service utilities.

### `floor_plan_analyzer.py`
AI-powered floor plan analysis service. Processes uploaded images using computer vision to extract room dimensions, detect walls, doors, and windows, calculate areas, and generate structured measurement data for quote generation.

### `quote_generator.py`
PDF quote generation service. Creates professional PDF quotes using project measurements, applies pricing calculations, generates itemized cost breakdowns, includes company branding, and handles quote versioning and revisions.

### `subscription_service.py`
Stripe integration service for subscription management. Handles payment processing, subscription lifecycle management, webhook processing, plan upgrades/downgrades, and usage tracking for billing purposes.

### `email_service.py`
Email notification service. Manages transactional emails including quote delivery, password resets, subscription notifications, and system alerts using configured SMTP or email service providers.

## Utils Directory (`/utils/`)

### `__init__.py`
Initializes utility package and provides common helper functions.

### `decorators.py`
Custom Flask decorators for authentication, authorization, role-based access control, rate limiting, subscription validation, and request logging functionality.

### `validators.py`
Input validation utilities for form data, file uploads, email formats, phone numbers, project measurements, and business logic validation rules.

### `helpers.py`
General utility functions for file handling, data formatting, calculation helpers, date/time utilities, and common business logic operations.

## Static Directories

### `/templates/emails/`
Email template directory containing HTML templates for password reset emails, quote delivery notifications, subscription updates, and system communications.

### `/templates/pdf/`
PDF template directory with HTML templates used for generating quote PDFs, including company branding, itemized pricing tables, and terms and conditions.

### `/static/uploads/`
File storage directory for user-uploaded floor plans, project images, and document attachments. Organized by company and project for security and organization.

### `/static/generated/`
Generated file storage for AI analysis results, PDF quotes, and processed images. Includes cleanup routines for managing storage space.

## Database Directory (`/database/`)

### `init.sql`
Database schema initialization script. Creates all necessary tables, indexes, constraints, and initial data required for application startup. Includes user roles, default subscription plans, and system settings.

### `/migrations/`
Database migration directory containing version-controlled schema changes. Handles incremental database updates, data migrations, and rollback scripts for maintaining database consistency across deployments.

## Authentication & Security

- JWT-based authentication with access and refresh tokens
- Password hashing using bcrypt
- Role-based access control (admin, user)
- File upload validation and security
- CORS configuration for frontend integration
- Request rate limiting and input validation
- Subscription-based feature gating

## Error Handling

All routes implement consistent error handling with appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 413: Payload Too Large (file uploads)
- 500: Internal Server Error

## Dependencies

Key Python packages required:
- Flask: Web framework
- Flask-SQLAlchemy: ORM
- Flask-JWT-Extended: JWT authentication
- Flask-CORS: Cross-origin resource sharing
- Stripe: Payment processing
- PIL/Pillow: Image processing
- ReportLab: PDF generation
- OpenCV: Computer vision (floor plan analysis)
- SQLAlchemy: Database abstraction
- Bcrypt: Password hashing
- Marshmallow: Data serialization
- Celery: Asynchronous task processing
- Redis: Caching and task queue

---


# Postman Test Samples for Paint Quote Pro Auth Routes

# AUTH

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

---

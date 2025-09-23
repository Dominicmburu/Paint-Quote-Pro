
```
frontend/
├── .gitignore                  # Specifies files and folders to ignore in version control
├── eslint.config.js            # ESLint configuration for code linting
├── index.html                  # Main HTML entry point for the app
├── package.json                # Project metadata and dependencies
├── pnpm-lock.yaml              # Lockfile for pnpm package manager
├── postcss.config.mjs          # PostCSS configuration for CSS processing
├── tailwind.config.js          # Tailwind CSS configuration
├── vite.config.js              # Vite build tool configuration
├── public/                     # Static assets served as-is
│   ├── vite.svg                # Vite logo SVG
│   └── images/                 # Image assets for the app
│       ├── AI.jpg              # AI-related image
│       ├── flotto_logo.png     # Company or app logo
│       ├── hero.png            # Hero section image
│       ├── image.png           # General image asset
│       ├── image1.png          # General image asset
│       ├── image2.png          # General image asset
│       └── Quotation.png       # Quotation-related image
└── src/                        # Source code for the frontend app
    ├── App.css                 # Global styles for the App component
    ├── App.jsx                 # Root React component
    ├── main.jsx                # App entry point, renders App.jsx
    ├── assets/                 # Static assets (e.g., SVGs) used in code
    │   └── react.svg           # React logo SVG
    ├── components/             # Reusable React components
    │   ├── admin/              # Admin dashboard and management components
    │   │   ├── ActivityLogs.jsx        # Displays admin activity logs
    │   │   ├── AdminDashboard.jsx      # Main admin dashboard
    │   │   ├── AdminLayout.jsx         # Layout wrapper for admin pages
    │   │   ├── AdminProfile.jsx        # Admin profile management
    │   │   ├── Analytics.jsx           # Analytics and reporting
    │   │   ├── Billing.jsx             # Billing and payment management
    │   │   ├── CompanyManagement.jsx   # Manage company info/settings
    │   │   ├── ProjectsOverview.jsx    # Overview of all projects (admin)
    │   │   ├── QuotesOverview.jsx      # Overview of all quotes (admin)
    │   │   ├── Reports.jsx             # Generate/view reports
    │   │   ├── SubscriptionOverview.jsx# Subscription management (admin)
    │   │   ├── Support.jsx             # Admin support/helpdesk
    │   │   ├── SystemSettings.jsx      # System-wide settings
    │   │   └── UserManagement.jsx      # Manage users and permissions
    │   ├── auth/               # Authentication-related components
    │   │   ├── ForgotPassword.jsx      # Password reset form
    │   │   ├── Login.jsx               # Login form
    │   │   ├── ProtectedRoute.jsx      # Route guard for protected pages
    │   │   └── Register.jsx            # User registration form
    │   ├── clients/            # Client management components
    │   │   ├── ClientForm.jsx          # Form for adding/editing clients
    │   │   └── ClientSelector.jsx      # Dropdown or selector for clients
    │   ├── common/             # Common/shared UI components
    │   │   ├── ErrorBoundary.jsx       # Error boundary for catching errors
    │   │   ├── Footer.jsx              # App footer
    │   │   ├── Header.jsx              # App header/navigation bar
    │   │   ├── LanguageSwitcher.jsx    # Switch app language
    │   │   ├── Loading.jsx             # Loading spinner/indicator
    │   │   ├── Modal.jsx               # Modal dialog component
    │   │   └── Siderbar.jsx            # Sidebar navigation
    │   ├── dashboard/           # User dashboard components
    │   │   ├── Dashboard.jsx           # Main dashboard page
    │   │   ├── ProjectCard.jsx         # Card view for a project
    │   │   ├── ProjectList.jsx         # List of projects
    │   │   └── QuickStats.jsx          # Quick statistics/summary
    │   ├── projects/            # Project management components
    │   │   ├── ClientInformation.jsx   # Client info for a project
    │   │   ├── CreateProject.jsx       # Create new project form
    │   │   ├── EditProject.jsx         # Edit existing project
    │   │   ├── ExteriorWork.jsx        # Exterior work details
    │   │   ├── FloorPlanUpload.jsx     # Upload floor plans
    │   │   ├── InteriorWork.jsx        # Interior work details
    │   │   ├── ProjectDetails.jsx      # Project details view
    │   │   ├── ProjectInfoForm.jsx     # Form for project info
    │   │   ├── RoomMeasurements.jsx    # Room measurement input
    │   │   └── SpecialJobsSection.jsx  # Special jobs/tasks section
    │   ├── quotes/              # Quote management components
    │   │   ├── PublicQuoteSignature.jsx   # Public quote signature page
    │   │   ├── QuoteGenerator.jsx         # Generate new quotes
    │   │   ├── QuoteHistory.jsx           # View quote history
    │   │   ├── QuoteList.jsx              # List of quotes
    │   │   ├── QuoteManagement.jsx        # Manage quotes (edit, delete etc.)
    │   │   ├── QuotePDFViewer.jsx         # View/download quote as PDF
    │   │   ├── QuotePreview.jsx           # Preview quote before sending
    │   │   └── QuoteSettings.jsx
    │   │   ├── QuoteSignedConfirmation.jsx   # Show confirmation of the signed Quote
    │   │   ├── QuoteStatus.jsx           
    │   │   └── SignatureLinkShare.jsx
    │   ├── settings/     
    │   │   ├── CompanySettings.jsx   
    │   │   ├── PaintBrandSettings.jsx         
    │   │   ├── UserProfile.jsx           
    │   │   ├── PricingSettings.jsx               
    │   └── subscription/   
    │   │   ├── PaymentForm.jsx   
    │   │   ├── PaymentHistory.jsx         
    │   │   ├── PricingPlans.jsx           
    │   │   ├── SubscriptionStatus.jsx                 
    ├── hooks/                   # Custom React hooks
    │   ├── useAuth.jsx                 # Hook for authentication logic
    │   ├── usePricing.jsx              # Hook for pricing logic
    │   ├── useProjects.jsx             # Hook for project logic
    │   ├── useSubscription.jsx         # Hook for subscription logic
    │   └── useTranslation.jsx          # Hook for translation/localization
    ├── pages/                   # Top-level route pages
    │   ├── About.jsx                   # About page
    │   ├── Contact.jsx                 # Contact page
    │   ├── CookiePolicy.jsx            # Cookie policy page
    │   ├── Features.jsx                # Features overview page
    │   ├── Home.jsx                    # Home/landing page
    │   ├── NotFound.jsx                # 404 not found page
    │   ├── PaymentCancelled.jsx        # Payment cancelled page
    │   ├── PaymentFailed.jsx           # Payment failed page
    │   ├── PaymentSuccess.jsx          # Payment success page
    │   ├── Pricing.jsx                 # Pricing page
    │   ├── PrivacyPolicy.jsx           # Privacy policy page
    │   ├── Settings.jsx                # User/app settings page
    │   ├── Subscription.jsx            # Subscription management page
    │   ├── SubscriptionExpired.jsx     # Subscription expired notice
    │   ├── TermsofService.jsx          # Terms of service page
    │   ├── Testimonials.jsx            # Testimonials page
    │   └── TrialExpired.jsx            # Trial expired notice
    ├── services/                # API and service layer
    │   ├── api.jsx                     # Generic API utilities
    │   ├── clientService.jsx           # Client-related API logic
    │   ├── pricingService.jsx          # Pricing-related API logic
    ├── styles/                  # CSS stylesheets
    │   ├── components.css              # Component-specific styles
    │   ├── globals.css                 # Global styles
    │   └── themes.css                  # Theme definitions
    └── utils/                   # Utility/helper functions
        ├── constants.jsx               # App-wide constants
        ├── helpers.jsx                 # Helper functions
        └── validation.jsx              # Validation logic

```

---
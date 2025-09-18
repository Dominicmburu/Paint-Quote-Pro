export const API_ENDPOINTS = {
  AUTH: '/auth',
  PROJECTS: '/projects',
  QUOTES: '/quotes',
  SUBSCRIPTIONS: '/subscriptions',
  ADMIN: '/admin'
};

export const PROJECT_STATUS = {
  DRAFT: 'draft',
  ANALYZING: 'analyzing',
  READY: 'ready',
  QUOTED: 'quoted',
  COMPLETED: 'completed'
};

export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
  UNPAID: 'unpaid'
};

export const SUBSCRIPTION_PLANS = {
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise'
};

export const FILE_UPLOAD = {
  MAX_SIZE: 32 * 1024 * 1024, // 32MB
  ALLOWED_TYPES: ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/bmp', 'image/tiff', 'application/pdf']
};


export const GOOGLE_TRANSLATE_API_KEY = ''; // Replace with your actual API key
export const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';
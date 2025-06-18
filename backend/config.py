import os
from datetime import timedelta
import logging
from urllib.parse import urlparse

def get_fallback_database_uri():
    """Fallback database URI for development"""
    return "postgresql://postgres:1234@localhost:5432/paint_quote_pro_db"

def get_database_uri():
    """Get database URI with proper validation and fallback"""
    database_url = os.environ.get('DATABASE_URL')
    
    if database_url:
        # Handle Heroku postgres:// to postgresql:// conversion
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        
        # Validate the URL format
        try:
            parsed = urlparse(database_url)
            if not all([parsed.hostname, parsed.username, parsed.path]):
                logging.warning(f"Invalid DATABASE_URL format: {database_url}")
                return get_fallback_database_uri()
            return database_url
        except Exception as e:
            logging.error(f"Failed to parse DATABASE_URL: {e}")
            return get_fallback_database_uri()
    else:
        return get_fallback_database_uri()

class Config:
    """Base configuration class with enhanced database handling"""
    
    # Basic Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Database configuration with proper validation
    SQLALCHEMY_DATABASE_URI = get_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_timeout': 30,
        'pool_recycle': 3600,
        'pool_pre_ping': True,  # Validates connections before use
        'echo': False,  # Set to True for SQL query logging in development
    }
    
    # Database connection retry settings
    DB_CONNECTION_RETRIES = 3
    DB_CONNECTION_RETRY_DELAY = 1  # seconds
    DB_HEALTH_CHECK_TIMEOUT = 5   # seconds
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_ALGORITHM = 'HS256'
    
    # File upload configuration
    UPLOAD_FOLDER = os.path.abspath(os.environ.get('UPLOAD_FOLDER') or 'static/uploads')
    RESULTS_FOLDER = os.path.abspath(os.environ.get('RESULTS_FOLDER') or 'static/generated')
    MAX_CONTENT_LENGTH = 32 * 1024 * 1024  # 32MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'pdf'}
    
    # OpenAI Configuration
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    OPENAI_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-4-vision-preview')
    OPENAI_MAX_TOKENS = int(os.environ.get('OPENAI_MAX_TOKENS', 4000))
    OPENAI_TEMPERATURE = float(os.environ.get('OPENAI_TEMPERATURE', 0.3))
    
    # Stripe Configuration
    STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY')
    STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
    STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
    STRIPE_API_VERSION = '2023-10-16'
    
    # Email Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'false').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER') or 'noreply@paintquotepro.com'
    MAIL_MAX_EMAILS = int(os.environ.get('MAIL_MAX_EMAILS', 100))
    
    # Business Configuration
    WALL_HEIGHT = float(os.environ.get('WALL_HEIGHT', 2.4))  # Default wall height in meters
    CEILING_HEIGHT = float(os.environ.get('CEILING_HEIGHT', 2.4))  # Default ceiling height in meters
    DEFAULT_VAT_RATE = float(os.environ.get('DEFAULT_VAT_RATE', 0.20))  # 20% VAT
    
    # Currency and locale settings
    DEFAULT_CURRENCY = os.environ.get('DEFAULT_CURRENCY', 'GBP')
    DEFAULT_LOCALE = os.environ.get('DEFAULT_LOCALE', 'en_GB')
    
    # Subscription Plans with enhanced configuration
    SUBSCRIPTION_PLANS = {
        'starter': {
            'name': 'Starter',
            'price_monthly': 29,
            'price_yearly': 290,
            'stripe_price_id_monthly': os.environ.get('STRIPE_STARTER_MONTHLY'),
            'stripe_price_id_yearly': os.environ.get('STRIPE_STARTER_YEARLY'),
            'max_projects': 5,
            'max_users': 1,
            'max_storage_mb': 1000,  # 1GB
            'api_rate_limit': 100,   # requests per hour
            'features': [
                'Up to 5 projects per month',
                'Basic floor plan analysis',
                'PDF quote generation',
                '2 team members',
                'Email support',
                '1GB file storage'
            ]
        },
        'professional': {
            'name': 'Professional',
            'price_monthly': 79,
            'price_yearly': 790,
            'stripe_price_id_monthly': os.environ.get('STRIPE_PRO_MONTHLY'),
            'stripe_price_id_yearly': os.environ.get('STRIPE_PRO_YEARLY'),
            'max_projects': 25,
            'max_users': 1,
            'max_storage_mb': 5000,  # 5GB
            'api_rate_limit': 500,   # requests per hour
            'features': [
                'Up to 25 projects per month',
                'Advanced AI floor plan analysis',
                'Custom quote templates',
                '10 team members',
                'Priority email support',
                'Custom paint brand settings',
                '5GB file storage',
                'API access'
            ]
        },
        'enterprise': {
            'name': 'Enterprise',
            'price_monthly': 199,
            'price_yearly': 1990,
            'stripe_price_id_monthly': os.environ.get('STRIPE_ENTERPRISE_MONTHLY'),
            'stripe_price_id_yearly': os.environ.get('STRIPE_ENTERPRISE_YEARLY'),
            'max_projects': -1,      # Unlimited
            'max_users': -1,         # Unlimited
            'max_storage_mb': -1,    # Unlimited
            'api_rate_limit': -1,    # Unlimited
            'features': [
                'Unlimited projects',
                'Unlimited team members',
                'Advanced AI analysis',
                'Custom integrations',
                'Dedicated account manager',
                'Phone & priority support',
                'White-label options',
                'Unlimited storage',
                'Full API access',
                'Custom deployment'
            ]
        }
    }
    
    # CORS Configuration
    CORS_ORIGINS = [origin.strip() for origin in os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(',')]
    CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization']
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    
    # Security Configuration
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = 3600  # 1 hour
    BCRYPT_LOG_ROUNDS = 12
    
    # Session Configuration
    PERMANENT_SESSION_LIFETIME = timedelta(days=31)
    SESSION_COOKIE_NAME = 'paint_quote_session'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Rate Limiting
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', 'memory://')
    RATELIMIT_DEFAULT = '100 per hour'
    RATELIMIT_HEADERS_ENABLED = True
    
    # Logging Configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = os.environ.get('LOG_FILE')
    LOG_MAX_BYTES = int(os.environ.get('LOG_MAX_BYTES', 10485760))  # 10MB
    LOG_BACKUP_COUNT = int(os.environ.get('LOG_BACKUP_COUNT', 5))
    
    # Environment
    ENVIRONMENT = os.environ.get('FLASK_ENV', 'development')
    DEBUG = ENVIRONMENT == 'development'
    
    # Application URLs
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:5000')
    
    # Cache Configuration
    CACHE_TYPE = os.environ.get('CACHE_TYPE', 'simple')
    CACHE_REDIS_URL = os.environ.get('REDIS_URL')
    CACHE_DEFAULT_TIMEOUT = int(os.environ.get('CACHE_DEFAULT_TIMEOUT', 300))  # 5 minutes
    
    # Task Queue Configuration (for background jobs)
    CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    
    # Enhanced logging for development
    SQLALCHEMY_ENGINE_OPTIONS = {
        **Config.SQLALCHEMY_ENGINE_OPTIONS,
        'echo': True,  # Log SQL queries
    }
    
    # Relaxed security for development
    WTF_CSRF_ENABLED = False
    SESSION_COOKIE_SECURE = False
    
    # Development-specific settings
    MAIL_SUPPRESS_SEND = True  # Don't actually send emails in development
    EXPLAIN_TEMPLATE_LOADING = True

class ProductionConfig(Config):
    """Production configuration with enhanced security"""
    DEBUG = False
    TESTING = False
    
    # Production security settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    WTF_CSRF_ENABLED = True
    
    # Enhanced database settings for production
    SQLALCHEMY_ENGINE_OPTIONS = {
        **Config.SQLALCHEMY_ENGINE_OPTIONS,
        'pool_size': 20,
        'max_overflow': 30,
        'pool_timeout': 60,
        'echo': False,
    }
    
    # Production logging
    LOG_LEVEL = 'WARNING'
    
    # Force HTTPS
    PREFERRED_URL_SCHEME = 'https'

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    
    # Use in-memory database for testing
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Disable CSRF for testing
    WTF_CSRF_ENABLED = False
    
    # Fast password hashing for tests
    BCRYPT_LOG_ROUNDS = 4
    
    # Disable rate limiting for tests
    RATELIMIT_ENABLED = False
    
    # Don't send emails during testing
    MAIL_SUPPRESS_SEND = True
    
    # Use simple cache for testing
    CACHE_TYPE = 'simple'

class DockerConfig(ProductionConfig):
    """Docker-specific configuration"""
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://paintquote_user:paintquote_password@db:5432/paint_quote_pro_db'

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'docker': DockerConfig,
    'default': DevelopmentConfig
}

def get_config(config_name=None):
    """Get configuration class by name"""
    config_name = config_name or os.environ.get('FLASK_ENV', 'development')
    return config.get(config_name, config['default'])
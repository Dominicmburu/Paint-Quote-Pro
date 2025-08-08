import os
from datetime import timedelta
import logging
from urllib.parse import urlparse
from werkzeug.utils import secure_filename
import uuid

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
    """Base configuration class with enhanced database and static file handling"""
    
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
    JWT_DECODE_LEEWAY = 10  # Allow 10 seconds of clock skew
    
    # ENHANCED FILE UPLOAD AND STATIC CONFIGURATION
    BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    
    # File storage paths with environment variable support
    UPLOAD_FOLDER = os.path.abspath(os.environ.get('UPLOAD_FOLDER') or os.path.join(BASE_DIR, 'static', 'uploads'))
    RESULTS_FOLDER = os.path.abspath(os.environ.get('RESULTS_FOLDER') or os.path.join(BASE_DIR, 'static', 'generated'))
    PUBLIC_FOLDER = os.path.join(UPLOAD_FOLDER, 'public')
    TEMP_FOLDER = os.path.join(BASE_DIR, 'temp')
    
    # File upload configuration
    MAX_CONTENT_LENGTH = 32 * 1024 * 1024  # 32MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'pdf'}
    ALLOWED_MIME_TYPES = {
        'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 
        'image/bmp', 'image/tiff', 'application/pdf'
    }
    
    # Static file serving configuration
    STATIC_FOLDER = 'static'
    STATIC_URL_PATH = '/static'
    SEND_FILE_MAX_AGE_DEFAULT = 3600  # 1 hour cache for static files
    
    # Cache control settings for different file types
    CACHE_CONTROL = {
        'images': 'public, max-age=3600',      # 1 hour for images
        'generated': 'private, max-age=1800',  # 30 minutes for generated files
        'public': 'public, max-age=86400',     # 24 hours for public assets
        'temp': 'no-cache, no-store'           # No cache for temp files
    }
    
    # File organization settings
    ORGANIZE_BY_COMPANY = True  # Organize uploads by company_id/project_id
    MAX_FILES_PER_PROJECT = 20
    MAX_FILE_SIZE_MB = 32
    
    # OpenAI Configuration
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    OPENAI_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-4o')
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
            'price_monthly': 9.99,
            'price_yearly': 90.99,
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
    
    # ENHANCED CORS Configuration for static files
    CORS_ORIGINS = [origin.strip() for origin in os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')]
    CORS_ALLOW_HEADERS = [
        'Content-Type', 'Authorization', 'X-Requested-With', 
        'Accept', 'Origin', 'Cache-Control', 'X-File-Name'
    ]
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    CORS_EXPOSE_HEADERS = ['Authorization', 'Content-Range', 'X-Content-Range']
    CORS_SUPPORTS_CREDENTIALS = True
    
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
    
    # File-specific rate limits
    RATELIMIT_UPLOAD = '10 per minute'
    RATELIMIT_DOWNLOAD = '100 per minute'
    
    # Logging Configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = os.environ.get('LOG_FILE')
    LOG_MAX_BYTES = int(os.environ.get('LOG_MAX_BYTES', 10485760))  # 10MB
    LOG_BACKUP_COUNT = int(os.environ.get('LOG_BACKUP_COUNT', 5))
    
    # Environment
    ENVIRONMENT = os.environ.get('FLASK_ENV', 'development')
    DEBUG = ENVIRONMENT == 'development'
    
    # Application URLs
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:5000')
    
    # Cache Configuration
    CACHE_TYPE = os.environ.get('CACHE_TYPE', 'simple')
    CACHE_REDIS_URL = os.environ.get('REDIS_URL')
    CACHE_DEFAULT_TIMEOUT = int(os.environ.get('CACHE_DEFAULT_TIMEOUT', 300))  # 5 minutes
    
    # Task Queue Configuration (for background jobs)
    CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    
    @classmethod
    def init_app(cls, app):
        """Initialize application with configuration"""
        # Create necessary directories
        directories = [
            cls.UPLOAD_FOLDER,
            cls.RESULTS_FOLDER,
            cls.PUBLIC_FOLDER,
            cls.TEMP_FOLDER
        ]
        
        for directory in directories:
            try:
                os.makedirs(directory, exist_ok=True)
                app.logger.info(f"Created directory: {directory}")
            except Exception as e:
                app.logger.error(f"Failed to create directory {directory}: {e}")
        
        # Set up file permissions (Unix/Linux only)
        try:
            import stat
            for directory in directories:
                if os.path.exists(directory):
                    os.chmod(directory, stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)
        except Exception:
            pass  # Ignore on Windows or if permissions can't be set

class DevelopmentConfig(Config):
    """Development configuration with enhanced debugging"""
    DEBUG = True
    TESTING = False
    
    # Development file paths
    UPLOAD_FOLDER = os.path.join(Config.BASE_DIR, 'dev_uploads')
    RESULTS_FOLDER = os.path.join(Config.BASE_DIR, 'dev_results')
    PUBLIC_FOLDER = os.path.join(UPLOAD_FOLDER, 'public')
    
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
    
    # Development CORS - allow all origins
    CORS_ORIGINS = ['*']
    
    # Shorter cache times for development
    CACHE_CONTROL = {
        'images': 'no-cache',
        'generated': 'no-cache',
        'public': 'no-cache',
        'temp': 'no-cache'
    }
    SEND_FILE_MAX_AGE_DEFAULT = 1  # 1 second cache in development

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
    
    # Production file paths - use environment variables or absolute paths
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or '/app/static/uploads'
    RESULTS_FOLDER = os.environ.get('RESULTS_FOLDER') or '/app/static/generated'
    
    # Longer cache times for production
    SEND_FILE_MAX_AGE_DEFAULT = 86400  # 24 hours
    
    # Stricter CORS for production
    CORS_ORIGINS = [
        os.environ.get('FRONTEND_URL', 'https://yourdomain.com'),
        'https://www.yourdomain.com'
    ]

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    
    # Use in-memory database for testing
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Test file paths
    UPLOAD_FOLDER = os.path.join(Config.BASE_DIR, 'test_uploads')
    RESULTS_FOLDER = os.path.join(Config.BASE_DIR, 'test_results')
    PUBLIC_FOLDER = os.path.join(UPLOAD_FOLDER, 'public')
    
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
    
    # No cache for testing
    SEND_FILE_MAX_AGE_DEFAULT = 0

class DockerConfig(ProductionConfig):
    """Docker-specific configuration"""
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://paintquote_user:paintquote_password@db:5432/paint_quote_pro_db'
    
    # Docker file paths
    UPLOAD_FOLDER = '/app/static/uploads'
    RESULTS_FOLDER = '/app/static/generated'
    PUBLIC_FOLDER = '/app/static/uploads/public'

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

# ==================== FILE UTILITY FUNCTIONS ====================

def allowed_file(filename):
    """Check if file extension is allowed"""
    if not filename:
        return False
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def secure_filename_with_timestamp(filename):
    """Create a secure filename with timestamp"""
    if not filename:
        return None
    
    # Get file extension
    name, ext = os.path.splitext(secure_filename(filename))
    
    # Create timestamp
    from datetime import datetime
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Create unique ID
    unique_id = str(uuid.uuid4())[:8]
    
    # Combine parts
    return f"{timestamp}_{unique_id}_{name}{ext}"

def get_upload_path(filename, company_id=None, project_id=None, config_class=None):
    """Generate upload file path"""
    if not config_class:
        config_class = Config
    
    base_path = config_class.UPLOAD_FOLDER
    
    if config_class.ORGANIZE_BY_COMPANY and company_id:
        if project_id:
            return os.path.join(base_path, str(company_id), str(project_id), filename)
        else:
            return os.path.join(base_path, str(company_id), filename)
    else:
        return os.path.join(base_path, filename)

def get_upload_url(filename, company_id=None, project_id=None):
    """Generate upload file URL"""
    if Config.ORGANIZE_BY_COMPANY and company_id:
        if project_id:
            return f"/static/uploads/{company_id}/{project_id}/{filename}"
        else:
            return f"/static/uploads/{company_id}/{filename}"
    else:
        return f"/static/uploads/{filename}"

def get_project_file_url(project_id, filename):
    """Generate authenticated project file URL"""
    return f"/api/projects/{project_id}/files/{filename}"

def get_public_file_url(filename):
    """Generate public file URL"""
    return f"/api/files/public/{filename}"

def get_results_path(filename, company_id=None, project_id=None, config_class=None):
    """Generate results file path"""
    if not config_class:
        config_class = Config
    
    base_path = config_class.RESULTS_FOLDER
    
    if config_class.ORGANIZE_BY_COMPANY and company_id:
        if project_id:
            return os.path.join(base_path, str(company_id), str(project_id), filename)
        else:
            return os.path.join(base_path, str(company_id), filename)
    else:
        return os.path.join(base_path, filename)

def cleanup_temp_files(max_age_hours=24):
    """Clean up temporary files older than max_age_hours"""
    import time
    
    temp_folder = Config.TEMP_FOLDER
    if not os.path.exists(temp_folder):
        return
    
    current_time = time.time()
    max_age_seconds = max_age_hours * 3600
    
    for filename in os.listdir(temp_folder):
        file_path = os.path.join(temp_folder, filename)
        if os.path.isfile(file_path):
            file_age = current_time - os.path.getmtime(file_path)
            if file_age > max_age_seconds:
                try:
                    os.remove(file_path)
                    logging.info(f"Cleaned up temp file: {filename}")
                except Exception as e:
                    logging.error(f"Failed to clean up temp file {filename}: {e}")

def validate_file_type(file):
    """Validate file type based on content, not just extension"""
    if not hasattr(file, 'content_type'):
        return False
    
    # Check MIME type
    if file.content_type not in Config.ALLOWED_MIME_TYPES:
        return False
    
    # Additional validation can be added here
    # For example, checking file headers for image files
    
    return True

def get_file_info(file_path):
    """Get file information including size, type, etc."""
    if not os.path.exists(file_path):
        return None
    
    stat = os.stat(file_path)
    _, ext = os.path.splitext(file_path)
    
    return {
        'size': stat.st_size,
        'size_mb': round(stat.st_size / (1024 * 1024), 2),
        'extension': ext.lower(),
        'created': stat.st_ctime,
        'modified': stat.st_mtime,
        'is_image': ext.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'],
        'is_pdf': ext.lower() == '.pdf'
    }
import os
import logging
from flask import Flask, redirect, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, get_jwt
from flask_mail import Mail
from datetime import datetime, timedelta
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sqlalchemy import text
from werkzeug.exceptions import NotFound

# Import configuration
from config import get_config

# Import database
from models import db
from models.user import User
from models.company import Company
from models.subscription import Subscription
from models.project import Project

# Import routes
from routes.auth import auth_bp
from routes.projects import projects_bp
from routes.quotes import quotes_bp
from routes.subscriptions import subscriptions_bp
from routes.admin import admin_bp
from routes.clients import clients_bp
from routes.settings import settings_bp

def create_app(config_name=None):
    """Application factory pattern with enhanced JWT, CORS, and static file configuration"""
    
    # Initialize Sentry for error tracking in production
    if os.environ.get('SENTRY_DSN') and os.environ.get('FLASK_ENV') == 'production':
        sentry_sdk.init(
            dsn=os.environ.get('SENTRY_DSN'),
            integrations=[FlaskIntegration()],
            traces_sample_rate=0.1
        )
    
    app = Flask(__name__)
    application = app

    @app.before_request
    def enforce_https():
        if request.scheme == 'http' and not app.debug:
            url = request.url.replace('http://', 'https://', 1)
            return redirect(url, code=301)
    
    # Load configuration using the new config system
    config_class = get_config(config_name)
    app.config.from_object(config_class)
    
    # Configure logging
    if not app.debug:
        logging.basicConfig(level=logging.INFO)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Paint Quote Pro startup')
    
    # ENHANCED CORS Configuration
    CORS(app, 
         origins=app.config['CORS_ORIGINS'],
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept','Origin'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         supports_credentials=True,
         expose_headers=['Authorization'])
    
    # ENHANCED JWT Configuration
    jwt = JWTManager(app)
    
    # JWT Configuration - Set additional options
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    app.config['JWT_ALGORITHM'] = 'HS256'
    app.config['JWT_DECODE_LEEWAY'] = 10  # Allow 10 seconds of clock skew
    
    # JWT Callback Functions
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        """Check if a JWT exists in our revoked token store"""
        # For now, no tokens are revoked
        # In production, you might check a redis cache or database
        return False
    
    @jwt.user_identity_loader
    def user_identity_lookup(user):
        """Register a callback to serialize user objects - MUST return string"""
        if hasattr(user, 'id'):
            return str(user.id)  # Convert to string!
        return str(user)
    
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        """Register a callback to load user from JWT"""
        try:
            identity = jwt_data["sub"]  # This will now be a string
            user_id = int(identity)  # Convert back to int for database query
            return User.query.filter_by(id=user_id).one_or_none()
        except (ValueError, TypeError) as e:
            app.logger.error(f"Error converting identity to int: {e}")
            return None
        except Exception as e:
            app.logger.error(f"Error loading user from JWT: {e}")
            return None

    
    @jwt.additional_claims_loader
    def add_claims_to_jwt(identity):
        """Add additional claims to JWT"""
        try:
            user_id = int(identity) if isinstance(identity, str) else identity
            user = User.query.get(user_id)
            if user:
                return {
                    "role": user.role,
                    "company_id": str(user.company_id) if user.company_id else None,
                    "email": user.email
                }
        except Exception as e:
            app.logger.error(f"Error adding claims to JWT: {e}")
        return {}
    
    # Initialize other extensions
    mail = Mail(app)
    
    # Initialize database
    db.init_app(app)
    
    # Create upload directories
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['RESULTS_FOLDER'], exist_ok=True)
    
    # ==================== STATIC FILE SERVING ====================
    
    @app.route('/static/uploads/<path:filename>')
    def serve_uploads(filename):
        """Serve uploaded files publicly with proper CORS headers"""
        try:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if not os.path.exists(file_path):
                app.logger.error(f"File not found: {file_path}")
                return jsonify({'error': 'File not found'}), 404
            
            response = send_from_directory(app.config['UPLOAD_FOLDER'], filename)
            
            # Add CORS headers for image serving
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Cache-Control'] = 'public, max-age=3600'  # Cache for 1 hour
            
            return response
        except Exception as e:
            app.logger.error(f"Error serving upload file {filename}: {e}")
            return jsonify({'error': 'Failed to serve file'}), 500
    
    @app.route('/static/generated/<path:filename>')
    def serve_generated_files(filename):
        """Serve generated files (quotes, analyses) with proper CORS headers"""
        try:
            file_path = os.path.join(app.config['RESULTS_FOLDER'], filename)
            if not os.path.exists(file_path):
                app.logger.error(f"Generated file not found: {file_path}")
                return jsonify({'error': 'File not found'}), 404
            
            response = send_from_directory(app.config['RESULTS_FOLDER'], filename)
            
            # Add CORS headers
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Cache-Control'] = 'public, max-age=1800'  # Cache for 30 minutes
            
            return response
        except Exception as e:
            app.logger.error(f"Error serving generated file {filename}: {e}")
            return jsonify({'error': 'Failed to serve file'}), 500
    
    @app.route('/api/projects/<int:project_id>/files/<path:filename>')
    @jwt_required()
    def serve_project_file(project_id, filename):
        """Serve project-specific files with authentication and authorization"""
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Get the project and verify ownership
            project = Project.query.filter_by(
                id=project_id,
                company_id=user.company_id
            ).first()
            
            if not project:
                return jsonify({'error': 'Project not found or access denied'}), 404
            
            # Try to find the file in different possible locations
            possible_paths = []
            
            # Check in uploaded images
            if project.uploaded_images:
                for image_path in project.uploaded_images:
                    if os.path.basename(image_path) == filename:
                        possible_paths.append(image_path)
            
            # Check in generated files
            if project.generated_files:
                for gen_file_path in project.generated_files:
                    if os.path.basename(gen_file_path) == filename:
                        possible_paths.append(gen_file_path)
            
            # Check quote PDF
            if project.quote_pdf_path and os.path.basename(project.quote_pdf_path) == filename:
                possible_paths.append(project.quote_pdf_path)
            
            # Also check in company/project specific upload directory
            company_project_dir = os.path.join(
                app.config['UPLOAD_FOLDER'], 
                str(user.company_id), 
                str(project_id)
            )
            company_project_file = os.path.join(company_project_dir, filename)
            if os.path.exists(company_project_file):
                possible_paths.append(company_project_file)
            
            # Find the first existing file
            file_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    file_path = path
                    break
            
            if not file_path:
                app.logger.error(f"File {filename} not found for project {project_id}")
                app.logger.debug(f"Checked paths: {possible_paths}")
                return jsonify({'error': 'File not found'}), 404
            
            # Determine the directory and filename for send_from_directory
            directory = os.path.dirname(file_path)
            actual_filename = os.path.basename(file_path)
            
            response = send_from_directory(directory, actual_filename)
            
            # Add appropriate headers
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Cache-Control'] = 'private, max-age=3600'  # Private cache for 1 hour
            
            return response
            
        except Exception as e:
            app.logger.error(f"Error serving project file {filename} for project {project_id}: {e}")
            return jsonify({'error': 'Failed to serve file'}), 500
    
    @app.route('/api/files/public/<path:filename>')
    def serve_public_file(filename):
        """Serve public files without authentication"""
        try:
            # Serve from a public directory within uploads
            public_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'public')
            os.makedirs(public_dir, exist_ok=True)
            
            file_path = os.path.join(public_dir, filename)
            if not os.path.exists(file_path):
                return jsonify({'error': 'File not found'}), 404
            
            response = send_from_directory(public_dir, filename)
            
            # Add CORS headers for public files
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            response.headers['Cache-Control'] = 'public, max-age=86400'  # Cache for 24 hours
            
            return response
        except Exception as e:
            app.logger.error(f"Error serving public file {filename}: {e}")
            return jsonify({'error': 'Failed to serve file'}), 500
    
    @app.route('/api/images/<path:full_path>')
    @jwt_required()
    def serve_project_image_by_path(full_path):
        """Serve images using the full stored path (for backward compatibility)"""
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Reconstruct the full file path
            # The full_path should be something like "company_id/project_id/filename"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], full_path)
            
            if not os.path.exists(file_path):
                app.logger.error(f"Image file not found: {file_path}")
                return jsonify({'error': 'Image not found'}), 404
            
            # Security check: ensure the path contains the user's company_id
            if str(user.company_id) not in full_path:
                app.logger.warning(f"User {user.id} attempted to access file outside their company: {full_path}")
                return jsonify({'error': 'Access denied'}), 403
            
            directory = os.path.dirname(file_path)
            filename = os.path.basename(file_path)
            
            response = send_from_directory(directory, filename)
            
            # Add appropriate headers for images
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Cache-Control'] = 'private, max-age=3600'
            
            return response
            
        except Exception as e:
            app.logger.error(f"Error serving image {full_path}: {e}")
            return jsonify({'error': 'Failed to serve image'}), 500
    
    @app.route('/api/test-image')
    def test_image_serving():
        """Test endpoint to verify image serving is working"""
        try:
            # Create a simple test image if it doesn't exist
            test_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'test')
            os.makedirs(test_dir, exist_ok=True)
            
            test_file_path = os.path.join(test_dir, 'test.txt')
            
            if not os.path.exists(test_file_path):
                with open(test_file_path, 'w') as f:
                    f.write('This is a test file for image serving functionality.')
            
            return jsonify({
                'message': 'Image serving test endpoint',
                'upload_folder': app.config['UPLOAD_FOLDER'],
                'results_folder': app.config['RESULTS_FOLDER'],
                'test_file_url': '/static/uploads/test/test.txt',
                'test_file_exists': os.path.exists(test_file_path),
                'timestamp': datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            app.logger.error(f"Error in test image serving: {e}")
            return jsonify({'error': str(e)}), 500
    
    # ==================== END STATIC FILE SERVING ====================
    
    # ENHANCED JWT Error Handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        app.logger.warning(f"Expired token attempt from user: {jwt_payload.get('sub')}")
        return jsonify({
            'message': 'Token has expired',
            'error': 'token_expired',
            'timestamp': datetime.utcnow().isoformat()
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        app.logger.warning(f"Invalid token: {error}")
        return jsonify({
            'message': 'Invalid token format',
            'error': 'invalid_token',
            'timestamp': datetime.utcnow().isoformat()
        }), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'message': 'Authorization token required',
            'error': 'token_required',
            'timestamp': datetime.utcnow().isoformat()
        }), 401
    
    @jwt.needs_fresh_token_loader
    def token_not_fresh_callback(jwt_header, jwt_payload):
        return jsonify({
            'message': 'Fresh token required',
            'error': 'fresh_token_required',
            'timestamp': datetime.utcnow().isoformat()
        }), 401
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'message': 'Token has been revoked',
            'error': 'token_revoked',
            'timestamp': datetime.utcnow().isoformat()
        }), 401
    
    # CORS Preflight Handler
    @app.before_request
    def handle_preflight():
        """Handle CORS preflight requests properly"""
        if request.method == "OPTIONS":
            response = jsonify({'message': 'CORS preflight'})
            # Set CORS headers for preflight
            origin = request.headers.get('Origin')
            if origin in app.config['CORS_ORIGINS'] or '*' in app.config['CORS_ORIGINS']:
                response.headers.add("Access-Control-Allow-Origin", origin)
            response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With")
            response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
            response.headers.add('Access-Control-Allow-Credentials', "true")
            return response
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(projects_bp, url_prefix='/api/projects')
    app.register_blueprint(quotes_bp, url_prefix='/api/quotes')
    app.register_blueprint(subscriptions_bp, url_prefix='/api/subscriptions')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(clients_bp, url_prefix='/api/clients')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    
    # TEST/DEBUG ENDPOINTS
    @app.route('/api/test-auth')
    @jwt_required()
    def test_auth():
        """Test endpoint to verify JWT authentication is working"""
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            claims = get_jwt()
            
            if not user:
                return jsonify({'error': 'User not found in database'}), 404
            
            return jsonify({
                'message': 'Authentication successful',
                'user_id': current_user_id,
                'user_email': user.email,
                'user_role': user.role,
                'company_id': user.company_id,
                'company_name': user.company.name if user.company else None,
                'claims': claims,
                'timestamp': datetime.utcnow().isoformat()
            })
        except Exception as e:
            app.logger.error(f'Auth test failed: {e}')
            return jsonify({'error': f'Auth test failed: {str(e)}'}), 500
    
    @app.route('/api/debug-token')
    @jwt_required()
    def debug_token():
        """Debug endpoint to see JWT token contents"""
        try:
            current_user_id = get_jwt_identity()
            jwt_data = get_jwt()
            user = User.query.get(current_user_id)
            
            return jsonify({
                'user_id': current_user_id,
                'jwt_claims': jwt_data,
                'user_exists': user is not None,
                'user_email': user.email if user else None,
                'message': 'Token debug successful',
                'timestamp': datetime.utcnow().isoformat()
            })
        except Exception as e:
            app.logger.error(f'Token debug failed: {e}')
            return jsonify({'error': f'Token debug failed: {str(e)}'}), 500
    
    @app.route('/api/test-cors')
    def test_cors():
        """Test CORS configuration"""
        return jsonify({
            'message': 'CORS test successful',
            'origin': request.headers.get('Origin'),
            'method': request.method,
            'timestamp': datetime.utcnow().isoformat()
        })
    
    # Enhanced health check endpoint
    @app.route('/api/health')
    def health_check():
        """Comprehensive health check endpoint"""
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'environment': app.config.get('ENVIRONMENT', 'development'),
            'debug': app.debug
        }      
        
        status_code = 200
        
        # Test database connection
        try:
            db.session.execute(text('SELECT 1'))
            health_status['database'] = 'healthy'
        except Exception as e:
            health_status['database'] = f'unhealthy: {str(e)}'
            health_status['status'] = 'degraded'
            status_code = 503
        
        # Check JWT configuration
        try:
            health_status['jwt_secret_configured'] = bool(app.config.get('JWT_SECRET_KEY'))
            health_status['jwt_algorithm'] = app.config.get('JWT_ALGORITHM', 'HS256')
        except Exception as e:
            health_status['jwt_error'] = str(e)
        
        # Check CORS configuration
        health_status['cors_origins'] = app.config.get('CORS_ORIGINS', [])
        
        # Check static file directories
        health_status['upload_folder_exists'] = os.path.exists(app.config.get('UPLOAD_FOLDER', ''))
        health_status['results_folder_exists'] = os.path.exists(app.config.get('RESULTS_FOLDER', ''))
        
        return jsonify(health_status), status_code
    
    # Database info endpoint
    @app.route('/api/db-info')
    def db_info():
        """Database information endpoint with enhanced details"""
        try:
            # Get table information
            result = db.session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result.fetchall()]
            
            # Get database size
            db_name = app.config['SQLALCHEMY_DATABASE_URI'].split('/')[-1].split('?')[0]
            size_result = db.session.execute(text("""
                SELECT pg_size_pretty(pg_database_size(:db_name))
            """), {"db_name": db_name})
            db_size = size_result.fetchone()[0]
            
            # Get user count
            user_count = User.query.count()
            company_count = Company.query.count()
            project_count = Project.query.count()
            subscription_count = Subscription.query.count()
            
            return jsonify({
                'database_name': db_name,
                'tables_count': len(tables),
                'tables': tables,
                'database_size': db_size,
                'record_counts': {
                    'users': user_count,
                    'companies': company_count,
                    'projects': project_count,
                    'subscriptions': subscription_count
                },
                'status': 'connected',
                'timestamp': datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            app.logger.error(f'Database info error: {e}')
            return jsonify({
                'error': str(e),
                'status': 'error',
                'timestamp': datetime.utcnow().isoformat()
            }), 500
    
    # Enhanced Global Error Handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'error': 'Bad request',
            'message': 'The request could not be understood by the server',
            'timestamp': datetime.utcnow().isoformat()
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Authentication required',
            'timestamp': datetime.utcnow().isoformat()
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'error': 'Forbidden',
            'message': 'Insufficient permissions',
            'timestamp': datetime.utcnow().isoformat()
        }), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not found',
            'message': 'The requested resource was not found',
            'timestamp': datetime.utcnow().isoformat()
        }), 404
    
    @app.errorhandler(413)
    def payload_too_large(error):
        return jsonify({
            'error': 'Payload too large',
            'message': 'File too large. Maximum size is 32MB.',
            'timestamp': datetime.utcnow().isoformat()
        }), 413
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        app.logger.error(f'Server Error: {error}')
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred',
            'timestamp': datetime.utcnow().isoformat()
        }), 500
    
    # Enhanced Request/Response Logging
    @app.before_request
    def log_request_info():
        if app.debug:
            app.logger.debug(f'Request: {request.method} {request.url}')
            app.logger.debug(f'Headers: {dict(request.headers)}')
            
            # Only try to get JSON for requests that should have JSON bodies
            if request.method in ['POST', 'PUT', 'PATCH'] and request.is_json:
                try:
                    data = request.get_json()
                    if data and 'password' in data:
                        data = {**data, 'password': '***'}
                    app.logger.debug(f'Body: {data}')
                except Exception as e:
                    app.logger.debug(f'Could not parse JSON body: {e}')
        
    @app.after_request
    def log_response_info(response):
        if app.debug:
            app.logger.debug(f'Response: {response.status_code}')
        
        # Add security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        return response
    
    return app

def init_database_tables(app):
    """Initialize database tables with enhanced error handling"""
    with app.app_context():
        try:
            print("🔄 Creating database tables...")
            
            # Create all tables
            db.create_all()
            
            # Verify tables were created
            result = db.session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result.fetchall()]
            
            print(f"✅ Database tables created successfully!")
            print(f"📊 Created tables: {', '.join(tables) if tables else 'None'}")
            
            if not tables:
                print("⚠️  No tables were created. Check your model definitions.")
                return False
            
            # Create a default admin user if none exists
            if not User.query.first():
                print("👤 Creating default admin user...")
                
                # Create default company
                company = Company(
                    name="Paint Quote Pro Demo",
                    email="admin@paintquotepro.com",
                    preferred_paint_brand="Dulux",
                    vat_rate=0.20
                )
                db.session.add(company)
                db.session.flush()
                
                # Create admin user
                admin_user = User(
                    email="admin@paintquotepro.com",
                    first_name="Admin",
                    last_name="User",
                    company_id=company.id,
                    role="admin",
                    email_verified=True
                )
                admin_user.set_password("admin123")
                db.session.add(admin_user)
                db.session.flush()
                
                # Create trial subscription
                subscription = Subscription(
                    company_id=company.id,
                    plan_name='professional',
                    billing_cycle='monthly',
                    status='trial',
                    current_period_start=datetime.utcnow(),
                    current_period_end=datetime.utcnow() + timedelta(days=0),
                    trial_end=datetime.utcnow() + timedelta(days=0)
                )
                db.session.add(subscription)
                
                db.session.commit()
                
                print("✅ Default admin user created:")
                print("   Email: admin@paintquotepro.com")
                print("   Password: admin123")
                print("   Role: admin")
                print("   ⚠️  Please change this password after first login!")
            else:
                print("👤 Users already exist in database")
            
            return True
            
        except Exception as e:
            print(f"❌ Database table creation failed: {e}")
            app.logger.error(f"Database initialization error: {e}")
            db.session.rollback()
            return False

def test_database_operations(app):
    """Test basic database operations with detailed output"""
    with app.app_context():
        try:
            print("\n🧪 Testing Database Operations...")
            
            # Test basic queries
            user_count = User.query.count()
            company_count = Company.query.count()
            project_count = Project.query.count()
            subscription_count = Subscription.query.count()
            
            print(f"📊 Database Statistics:")
            print(f"   Users: {user_count}")
            print(f"   Companies: {company_count}")
            print(f"   Projects: {project_count}")
            print(f"   Subscriptions: {subscription_count}")
            
            # Test a simple join
            users_with_companies = db.session.query(User, Company).join(Company).all()
            print(f"   Users with companies: {len(users_with_companies)}")
            
            # Test admin user login capability
            admin_user = User.query.filter_by(email="admin@paintquotepro.com").first()
            if admin_user:
                print(f"   Admin user found: {admin_user.email}")
                print(f"   Admin role: {admin_user.role}")
                print(f"   Company: {admin_user.company.name if admin_user.company else 'None'}")
                
                # Test password check
                if admin_user.check_password("admin123"):
                    print("   ✅ Admin password verification works")
                else:
                    print("   ❌ Admin password verification failed")
            else:
                print("   ⚠️  Admin user not found")
            
            return True
            
        except Exception as e:
            print(f"❌ Database operations test failed: {e}")
            app.logger.error(f"Database test error: {e}")
            return False

# For development server
if __name__ == '__main__':
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    print("🎨 Paint Quote Pro API Server Starting...")
    print("=" * 50)
    
    # Create the Flask app
    app = create_app()
    
    # Initialize database tables
    print("\n🚀 Initializing Database Tables...")
    if init_database_tables(app):
        print("✅ Database initialization completed!")
        
        # Test database operations
        if test_database_operations(app):
            print("✅ Database operations test passed!")
        else:
            print("⚠️  Some database tests failed, but continuing...")
    else:
        print("❌ Database initialization failed!")
        print("🔄 Continuing anyway for debugging...")
    
    print("\n📊 Features available:")
    print("  ✅ User authentication & registration")
    print("  ✅ Subscription management")
    print("  ✅ AI floor plan analysis")
    print("  ✅ Project management")
    print("  ✅ Quote generation")
    print("  ✅ PDF exports")
    print("  ✅ Payment processing")
    print("  ✅ Static file serving")
    print("  ✅ Image upload/display")
    
    print("\n🌐 API Endpoints:")
    print("  📊 Health check: http://localhost:5000/api/health")
    print("  🗄️  Database info: http://localhost:5000/api/db-info")
    print("  🧪 Test auth: http://localhost:5000/api/test-auth")
    print("  🔍 Debug token: http://localhost:5000/api/debug-token")
    print("  🌍 Test CORS: http://localhost:5000/api/test-cors")
    print("  🖼️  Test images: http://localhost:5000/api/test-image")
    print("  🔐 Authentication: http://localhost:5000/api/auth")
    print("  🏗️  Projects: http://localhost:5000/api/projects")
    print("  📋 Quotes: http://localhost:5000/api/quotes")
    print("  💳 Subscriptions: http://localhost:5000/api/subscriptions")
    print("  🔧 Admin panel: http://localhost:5000/api/admin")
    
    print("\n🖼️  Static File URLs:")
    print("  📁 Uploads: http://localhost:5000/static/uploads/filename")
    print("  📄 Generated: http://localhost:5000/static/generated/filename")
    print("  🏗️  Project files: http://localhost:5000/api/projects/{id}/files/filename")
    print("  🌍 Public files: http://localhost:5000/api/files/public/filename")
    
    # Check critical environment variables
    critical_vars = ['JWT_SECRET_KEY', 'SECRET_KEY']
    missing_vars = [var for var in critical_vars if not os.environ.get(var)]
    
    optional_vars = ['OPENAI_API_KEY', 'STRIPE_SECRET_KEY']
    missing_optional = [var for var in optional_vars if not os.environ.get(var)]
    
    if missing_vars:
        print(f"\n❌ CRITICAL: Missing environment variables: {', '.join(missing_vars)}")
        print("   These are required for the app to work properly!")
    else:
        print("\n✅ All critical environment variables are set!")
    
    if missing_optional:
        print(f"\n⚠️  Optional: Missing environment variables: {', '.join(missing_optional)}")
        print("   These are needed for full functionality but app will still run")
    
    print(f"\n🔑 JWT Configuration:")
    print(f"   Secret Key: {'✅ Set' if app.config.get('JWT_SECRET_KEY') else '❌ Missing'}")
    print(f"   Algorithm: {app.config.get('JWT_ALGORITHM', 'Not set')}")
    print(f"   Access Token Expires: {app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 'Not set')}")
    
    print(f"\n🌐 CORS Configuration:")
    print(f"   Allowed Origins: {app.config.get('CORS_ORIGINS', [])}")
    
    print(f"\n📁 File Storage:")
    print(f"   Upload Folder: {app.config.get('UPLOAD_FOLDER', 'Not set')}")
    print(f"   Results Folder: {app.config.get('RESULTS_FOLDER', 'Not set')}")
    
    print("\n🚀 Starting Flask development server...")
    print("   Press Ctrl+C to stop the server")
    print("   🔗 Server will be available at: http://localhost:5000")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
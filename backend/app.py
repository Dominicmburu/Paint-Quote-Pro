import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from datetime import datetime
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sqlalchemy import text

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

def create_app(config_name=None):
    """Application factory pattern"""
    
    # Initialize Sentry for error tracking in production
    if os.environ.get('SENTRY_DSN') and os.environ.get('FLASK_ENV') == 'production':
        sentry_sdk.init(
            dsn=os.environ.get('SENTRY_DSN'),
            integrations=[FlaskIntegration()],
            traces_sample_rate=0.1
        )
    
    app = Flask(__name__)
    
    # Load configuration using the new config system
    config_class = get_config(config_name)
    app.config.from_object(config_class)
    
    # Configure logging
    if not app.debug:
        logging.basicConfig(level=logging.INFO)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Paint Quote Pro startup')
    
    # Initialize extensions
    CORS(app, origins=app.config['CORS_ORIGINS'])
    jwt = JWTManager(app)
    mail = Mail(app)
    
    # Initialize database
    db.init_app(app)
    
    # Create upload directories
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['RESULTS_FOLDER'], exist_ok=True)
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'message': 'Invalid token'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'message': 'Authorization token required'}), 401
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(projects_bp, url_prefix='/api/projects')
    app.register_blueprint(quotes_bp, url_prefix='/api/quotes')
    app.register_blueprint(subscriptions_bp, url_prefix='/api/subscriptions')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Enhanced health check endpoint
    @app.route('/api/health')
    def health_check():
        """Health check endpoint for monitoring"""
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'environment': app.config.get('ENVIRONMENT', 'development')
        }


        
        
        try:
            # Test database connection
            db.session.execute(text('SELECT 1'))
            health_status['database'] = 'healthy'
            status_code = 200
        except Exception as e:
            health_status['database'] = f'unhealthy: {str(e)}'
            health_status['status'] = 'degraded'
            status_code = 503
        
        return jsonify(health_status), status_code
    
    # Database info endpoint
    @app.route('/api/db-info')
    def db_info():
        """Database information endpoint"""
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
            
            return jsonify({
                'database_name': db_name,
                'tables_count': len(tables),
                'tables': tables,
                'database_size': db_size,
                'status': 'connected'
            })
            
        except Exception as e:
            return jsonify({
                'error': str(e),
                'status': 'error'
            }), 500
    
    # Global error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request'}), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized'}), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Forbidden'}), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(413)
    def payload_too_large(error):
        return jsonify({'error': 'File too large. Maximum size is 32MB.'}), 413
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        app.logger.error(f'Server Error: {error}')
        return jsonify({'error': 'Internal server error'}), 500
    
    # Request logging middleware
    @app.before_request
    def log_request_info():
        if app.debug:
            app.logger.debug('Request: %s %s', request.method, request.url)
    
    @app.after_request
    def log_response_info(response):
        if app.debug:
            app.logger.debug('Response: %s', response.status_code)
        return response
    
    return app

def init_database_tables(app):
    """Initialize database tables"""
    with app.app_context():
        try:
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
                    status='trial'
                )
                db.session.add(subscription)
                
                db.session.commit()
                
                print("✅ Default admin user created:")
                print("   Email: admin@paintquotepro.com")
                print("   Password: admin123")
                print("   ⚠️  Please change this password after first login!")
            
            return True
            
        except Exception as e:
            print(f"❌ Database table creation failed: {e}")
            db.session.rollback()
            return False

def test_database_operations(app):
    """Test basic database operations"""
    with app.app_context():
        try:
            print("\n🧪 Testing Database Operations...")
            
            # Test basic query
            user_count = User.query.count()
            company_count = Company.query.count()
            
            print(f"📊 Database Statistics:")
            print(f"   Users: {user_count}")
            print(f"   Companies: {company_count}")
            
            # Test a simple join
            users_with_companies = db.session.query(User, Company).join(Company).all()
            print(f"   Users with companies: {len(users_with_companies)}")
            
            return True
            
        except Exception as e:
            print(f"❌ Database operations test failed: {e}")
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
        print("❌ Database initialization failed!")
        exit(1)
    
    print("\n📊 Features available:")
    print("  ✅ User authentication & registration")
    print("  ✅ Subscription management")
    print("  ✅ AI floor plan analysis")
    print("  ✅ Project management")
    print("  ✅ Quote generation")
    print("  ✅ PDF exports")
    print("  ✅ Payment processing")
    
    print("\n🌐 API Endpoints:")
    print("  📊 Health check: http://localhost:5000/api/health")
    print("  🗄️  Database info: http://localhost:5000/api/db-info")
    print("  🔐 Authentication: http://localhost:5000/api/auth")
    print("  🏗️  Projects: http://localhost:5000/api/projects")
    print("  📋 Quotes: http://localhost:5000/api/quotes")
    print("  💳 Subscriptions: http://localhost:5000/api/subscriptions")
    print("  🔧 Admin panel: http://localhost:5000/api/admin")
    
    # Check critical environment variables
    critical_vars = ['OPENAI_API_KEY', 'STRIPE_SECRET_KEY', 'JWT_SECRET_KEY']
    missing_vars = [var for var in critical_vars if not os.environ.get(var)]
    
    if missing_vars:
        print(f"\n⚠️  WARNING: Missing environment variables: {', '.join(missing_vars)}")
        print("   Set these in your .env file for full functionality")
    else:
        print("\n✅ All critical environment variables are set!")
    
    print("\n🚀 Starting Flask development server...")
    print("   Press Ctrl+C to stop the server")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
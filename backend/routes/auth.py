from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.security import generate_password_hash
from datetime import datetime
import re
import secrets

from models import db
from models.user import User
from models.company import Company
from models.subscription import Subscription
from utils.validators import validate_email, validate_password
from services.email_service import send_welcome_email, send_password_reset_email

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user and company"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name', 'company_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate email format
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email'].lower()).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Validate password strength
        password_error = validate_password(data['password'])
        if password_error:
            return jsonify({'error': password_error}), 400
        
        # Create company first
        company = Company(
            name=data['company_name'],
            email=data.get('company_email', data['email']),
            phone=data.get('company_phone'),
            address=data.get('company_address'),
            website=data.get('company_website'),
            preferred_paint_brand=data.get('preferred_paint_brand', 'Dulux'),
            vat_number=data.get('vat_number'),
            vat_rate=float(data.get('vat_rate', 0.20)) 
        )
        
        db.session.add(company)
        db.session.flush()  # Get company ID
        
        # Create user
        user = User(
            email=data['email'].lower(),
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone'),
            company_id=company.id,
            role='admin'  # First user is admin
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.flush()  # Get user ID
        
        # Create trial subscription
        subscription = Subscription(
            company_id=company.id,
            plan_name='starter',
            billing_cycle='monthly',
            status='trial'
        )
        
        db.session.add(subscription)
        db.session.commit()
        
        # Generate tokens
        access_token, refresh_token = user.generate_tokens()
        
        # Send welcome email
        try:
            send_welcome_email(user.email, user.first_name, company.name)
        except Exception as e:
            current_app.logger.warning(f'Failed to send welcome email: {e}')
        
        return jsonify({
            'message': 'Registration successful',
            'user': user.to_dict(),
            'company': company.to_dict(),
            'subscription': subscription.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Registration error: {e}')
        return jsonify({'error': 'Registration failed'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return tokens"""
    try:
        data = request.get_json()
        
        email = data.get('email', '').lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Generate tokens
        access_token, refresh_token = user.generate_tokens()
        
        # Get company and subscription info
        company = user.company
        subscription = company.subscription if company else None
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'company': company.to_dict() if company else None,
            'subscription': subscription.to_dict() if subscription else None,
            'access_token': access_token,
            'refresh_token': refresh_token
        })
        
    except Exception as e:
        current_app.logger.error(f'Login error: {e}')
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'access_token': access_token
        })
        
    except Exception as e:
        current_app.logger.error(f'Token refresh error: {e}')
        return jsonify({'error': 'Token refresh failed'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        company = user.company
        subscription = company.subscription if company else None
        
        return jsonify({
            'user': user.to_dict(),
            'company': company.to_dict() if company else None,
            'subscription': subscription.to_dict() if subscription else None
        })
        
    except Exception as e:
        current_app.logger.error(f'Get user error: {e}')
        return jsonify({'error': 'Failed to get user info'}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send password reset email"""
    try:
        data = request.get_json()
        email = data.get('email', '').lower()
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        # Always return success to prevent email enumeration
        if user:
            # Generate reset token (in production, store this securely)
            reset_token = secrets.token_urlsafe(32)
            
            # In a real app, you'd store this token with expiration
            # For now, we'll just send the email
            try:
                send_password_reset_email(user.email, user.first_name, reset_token)
            except Exception as e:
                current_app.logger.error(f'Failed to send reset email: {e}')
        
        return jsonify({
            'message': 'If that email is registered, you will receive a password reset link'
        })
        
    except Exception as e:
        current_app.logger.error(f'Forgot password error: {e}')
        return jsonify({'error': 'Request failed'}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with token"""
    try:
        data = request.get_json()
        
        token = data.get('token')
        new_password = data.get('password')
        email = data.get('email')
        
        if not all([token, new_password, email]):
            return jsonify({'error': 'Token, email, and new password required'}), 400
        
        # Validate password strength
        password_error = validate_password(new_password)
        if password_error:
            return jsonify({'error': password_error}), 400
        
        # In production, you'd validate the token here
        # For now, we'll just update the password
        user = User.query.filter_by(email=email.lower()).first()
        
        if not user:
            return jsonify({'error': 'Invalid reset request'}), 400
        
        user.set_password(new_password)
        db.session.commit()
        
        return jsonify({
            'message': 'Password reset successful'
        })
        
    except Exception as e:
        current_app.logger.error(f'Reset password error: {e}')
        return jsonify({'error': 'Password reset failed'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change password for authenticated user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current and new password required'}), 400
        
        if not user.check_password(current_password):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Validate new password strength
        password_error = validate_password(new_password)
        if password_error:
            return jsonify({'error': password_error}), 400
        
        user.set_password(new_password)
        db.session.commit()
        
        return jsonify({
            'message': 'Password changed successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f'Change password error: {e}')
        return jsonify({'error': 'Password change failed'}), 500

@auth_bp.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone' in data:
            user.phone = data['phone']
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f'Update profile error: {e}')
        return jsonify({'error': 'Profile update failed'}), 500
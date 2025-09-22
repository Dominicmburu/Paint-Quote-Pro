from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import csv
import io
import os

from models import db
from models.user import User
from models.company import Company
from models.quote import Quote
from models.subscription import Subscription
from models.project import Project
from utils.decorators import require_admin

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@require_admin
def admin_dashboard():
    """Get admin dashboard statistics"""
    try:
        # Get basic counts
        total_companies = Company.query.count()
        total_users = User.query.count()
        total_projects = Project.query.count()
        active_subscriptions = Subscription.query.filter_by(status='active').count()
        trial_subscriptions = Subscription.query.filter_by(status='trial').count()
        
        # Active companies (companies with at least one active user)
        active_companies = db.session.query(Company).join(User).filter(User.is_active == True).distinct().count()
        
        # Recent activity
        recent_companies = Company.query.order_by(Company.created_at.desc()).limit(10).all()
        recent_projects = Project.query.order_by(Project.created_at.desc()).limit(10).all()
        
        # Revenue data (mock for now - integrate with Stripe for real data)
        revenue_data = [
            {'month': 'Jan', 'revenue': 12500},
            {'month': 'Feb', 'revenue': 15200},
            {'month': 'Mar', 'revenue': 18700},
            {'month': 'Apr', 'revenue': 22100},
            {'month': 'May', 'revenue': 28900},
            {'month': 'Jun', 'revenue': 32400}
        ]
        
        return jsonify({
            'stats': {
                'total_companies': total_companies,
                'total_users': total_users,
                'total_projects': total_projects,
                'active_companies': active_companies,
                'active_subscriptions': active_subscriptions,
                'trial_subscriptions': trial_subscriptions
            },
            'recent_companies': [company.to_dict() for company in recent_companies],
            'recent_projects': [project.to_dict() for project in recent_projects],
            'revenue_data': revenue_data
        })
        
    except Exception as e:
        current_app.logger.error(f'Admin dashboard error: {e}')
        return jsonify({'error': 'Failed to load dashboard'}), 500

# =====================================================
# COMPANY MANAGEMENT ROUTES
# =====================================================

@admin_bp.route('/companies', methods=['GET'])
@jwt_required()
@require_admin
def get_companies():
    """Get all companies with pagination and user details"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        search = request.args.get('search', '')
        status_filter = request.args.get('status')
        
        # Build base query
        query = Company.query
        
        # Apply search filter
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    Company.name.ilike(search_pattern),
                    Company.email.ilike(search_pattern),
                    Company.address.ilike(search_pattern),
                    Company.phone.ilike(search_pattern)
                )
            )
        
        # Apply status filter
        if status_filter:
            if status_filter == 'active':
                # Companies with at least one active user
                query = query.join(User).filter(User.is_active == True).distinct()
            elif status_filter == 'inactive':
                # Companies with no active users or no users at all
                active_company_ids = db.session.query(Company.id).join(User).filter(User.is_active == True).distinct()
                query = query.filter(~Company.id.in_(active_company_ids))
        
        # Order and paginate
        query = query.order_by(Company.created_at.desc())
        companies_paginated = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        companies_data = []
        for company in companies_paginated.items:
            company_dict = company.to_dict()
            
            # Add subscription info
            company_dict['subscription'] = company.subscription.to_dict() if company.subscription else None
            
            # Add user counts and user details
            company_dict['user_count'] = len(company.users)
            company_dict['project_count'] = company.projects.count()
            
            # Add users data for each company
            company_dict['users'] = []
            for user in company.users:
                user_dict = user.to_dict()
                user_dict['company_name'] = company.name
                user_dict['company_id'] = company.id
                company_dict['users'].append(user_dict)
            
            companies_data.append(company_dict)
        
        return jsonify({
            'companies': companies_data,
            'pagination': {
                'page': page,
                'pages': companies_paginated.pages,
                'per_page': per_page,
                'total': companies_paginated.total,
                'has_next': companies_paginated.has_next,
                'has_prev': companies_paginated.has_prev
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Get companies error: {e}')
        return jsonify({'error': 'Failed to get companies'}), 500

@admin_bp.route('/companies', methods=['POST'])
@jwt_required()
@require_admin
def create_company():
    """Create a new company"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if company email already exists
        if Company.query.filter_by(email=data['email'].lower()).first():
            return jsonify({'error': 'Company email already exists'}), 400
        
        # Create company
        company = Company(
            name=data['name'],
            email=data['email'].lower(),
            phone=data.get('phone'),
            address=data.get('address'),
            website=data.get('website'),
            preferred_paint_brand=data.get('preferred_paint_brand', 'Dulux'),
            vat_number=data.get('vat_number'),
            vat_rate=float(data.get('vat_rate', 0.20))
        )
        
        db.session.add(company)
        db.session.flush()  # Get company ID
        
        # Create default trial subscription
        subscription = Subscription(
            company_id=company.id,
            plan_name='starter',
            billing_cycle='monthly',
            status='trial'
        )
        db.session.add(subscription)
        
        db.session.commit()
        
        # Return company data with subscription info
        company_dict = company.to_dict()
        company_dict['subscription'] = subscription.to_dict()
        company_dict['user_count'] = 0
        company_dict['project_count'] = 0
        company_dict['users'] = []
        
        return jsonify({
            'message': 'Company created successfully',
            'company': company_dict
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Create company error: {e}')
        return jsonify({'error': 'Failed to create company'}), 500

@admin_bp.route('/companies/<int:company_id>', methods=['GET'])
@jwt_required()
@require_admin
def get_company(company_id):
    """Get a specific company with detailed information"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        company_dict = company.to_dict()
        company_dict['subscription'] = company.subscription.to_dict() if company.subscription else None
        company_dict['user_count'] = len(company.users)
        company_dict['project_count'] = company.projects.count()
        
        # Add detailed user information
        company_dict['users'] = [user.to_dict() for user in company.users]
        
        # Add recent projects
        recent_projects = company.projects.order_by(Project.created_at.desc()).limit(5).all()
        company_dict['recent_projects'] = [project.to_dict() for project in recent_projects]
        
        return jsonify({'company': company_dict})
        
    except Exception as e:
        current_app.logger.error(f'Get company error: {e}')
        return jsonify({'error': 'Failed to get company'}), 500

@admin_bp.route('/companies/<int:company_id>/details', methods=['GET'])
@jwt_required()
@require_admin
def get_company_details(company_id):
    """Get detailed company information for the details modal"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Get detailed statistics
        user_count = len(company.users)
        project_count = company.projects.count()
        
        # Get recent projects with status
        recent_projects = []
        for project in company.projects.order_by(Project.created_at.desc()).limit(10):
            project_dict = {
                'id': project.id,
                'name': project.name,
                'status': project.status,
                'created_at': project.created_at.isoformat() if project.created_at else None,
                'client_name': project.client_name
            }
            recent_projects.append(project_dict)
        
        # Get users with their roles and status
        users = []
        for user in company.users:
            user_dict = {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
            users.append(user_dict)
        
        return jsonify({
            'user_count': user_count,
            'project_count': project_count,
            'recent_projects': recent_projects,
            'users': users
        })
        
    except Exception as e:
        current_app.logger.error(f'Get company details error: {e}')
        return jsonify({'error': 'Failed to get company details'}), 500

@admin_bp.route('/companies/<int:company_id>', methods=['PUT'])
@jwt_required()
@require_admin
def update_company(company_id):
    """Update a company"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        data = request.get_json()
        
        # Check if email is being changed and if it already exists
        if 'email' in data and data['email'].lower() != company.email:
            if Company.query.filter_by(email=data['email'].lower()).first():
                return jsonify({'error': 'Email already exists for another company'}), 400
        
        # Update allowed fields
        updatable_fields = [
            'name', 'email', 'phone', 'address', 'website',
            'preferred_paint_brand', 'vat_number', 'vat_rate'
        ]
        
        for field in updatable_fields:
            if field in data:
                if field == 'email':
                    setattr(company, field, data[field].lower())
                elif field == 'vat_rate':
                    setattr(company, field, float(data[field]))
                else:
                    setattr(company, field, data[field])
        
        company.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Return updated company data
        company_dict = company.to_dict()
        company_dict['subscription'] = company.subscription.to_dict() if company.subscription else None
        company_dict['user_count'] = len(company.users)
        company_dict['project_count'] = company.projects.count()
        company_dict['users'] = [user.to_dict() for user in company.users]
        
        return jsonify({
            'message': 'Company updated successfully',
            'company': company_dict
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Update company error: {e}')
        return jsonify({'error': 'Failed to update company'}), 500

@admin_bp.route('/companies/<int:company_id>', methods=['DELETE'])
@jwt_required()
@require_admin
def delete_company(company_id):
    """Delete a company and all associated data"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Check if company has projects
        if company.projects.count() > 0:
            return jsonify({
                'error': 'Cannot delete company with existing projects. Please delete all projects first.'
            }), 400
        
        # Check if company has users (optional check - you might want to allow this)
        if len(company.users) > 0:
            return jsonify({
                'error': 'Cannot delete company with existing users. Please delete all users first.'
            }), 400
        
        # Delete subscription first (if exists)
        if company.subscription:
            db.session.delete(company.subscription)
        
        # Delete the company
        db.session.delete(company)
        db.session.commit()
        
        return jsonify({'message': 'Company deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Delete company error: {e}')
        return jsonify({'error': 'Failed to delete company'}), 500

@admin_bp.route('/companies/<int:company_id>/activate', methods=['PUT'])
@jwt_required()
@require_admin
def activate_company(company_id):
    """Activate a company (activate all its users)"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Activate all users in the company
        for user in company.users:
            user.is_active = True
            user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'Company activated successfully. {len(company.users)} users activated.',
            'company': company.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Activate company error: {e}')
        return jsonify({'error': 'Failed to activate company'}), 500

@admin_bp.route('/companies/<int:company_id>/deactivate', methods=['PUT'])
@jwt_required()
@require_admin
def deactivate_company(company_id):
    """Deactivate a company (deactivate all its users)"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Deactivate all users in the company
        for user in company.users:
            user.is_active = False
            user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'Company deactivated successfully. {len(company.users)} users deactivated.',
            'company': company.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Deactivate company error: {e}')
        return jsonify({'error': 'Failed to deactivate company'}), 500

@admin_bp.route('/companies/<int:company_id>/toggle-status', methods=['POST'])
@jwt_required()
@require_admin
def toggle_company_status(company_id):
    """Toggle company active status (toggle all user statuses)"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Check current status - if any user is active, we'll deactivate all
        # If no users are active, we'll activate all
        has_active_users = any(user.is_active for user in company.users)
        new_status = not has_active_users
        
        # Toggle all users in the company
        for user in company.users:
            user.is_active = new_status
            user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        status_text = "activated" if new_status else "deactivated"
        message = f'Company {status_text} successfully. {len(company.users)} users {status_text}.'
        
        # Return updated company data
        company_dict = company.to_dict()
        company_dict['user_count'] = len(company.users)
        company_dict['project_count'] = company.projects.count()
        company_dict['users'] = [user.to_dict() for user in company.users]
        
        return jsonify({
            'message': message,
            'company': company_dict
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Toggle company status error: {e}')
        return jsonify({'error': 'Failed to toggle company status'}), 500

@admin_bp.route('/companies/export', methods=['GET'])
@jwt_required()
@require_admin
def export_companies():
    """Export companies to CSV"""
    try:
        companies = Company.query.order_by(Company.created_at.desc()).all()
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Company ID', 'Company Name', 'Email', 'Phone', 'Address', 'Website',
            'Preferred Paint Brand', 'VAT Number', 'VAT Rate', 'Users Count',
            'Projects Count', 'Subscription Plan', 'Subscription Status',
            'Created At', 'Updated At'
        ])
        
        # Write company data
        for company in companies:
            subscription = company.subscription
            writer.writerow([
                company.id,
                company.name,
                company.email,
                company.phone or '',
                company.address or '',
                company.website or '',
                company.preferred_paint_brand or '',
                company.vat_number or '',
                company.vat_rate or '',
                len(company.users),
                company.projects.count(),
                subscription.plan_name if subscription else '',
                subscription.status if subscription else '',
                company.created_at.strftime('%Y-%m-%d %H:%M:%S') if company.created_at else '',
                company.updated_at.strftime('%Y-%m-%d %H:%M:%S') if company.updated_at else ''
            ])
        
        output.seek(0)
        
        return jsonify({
            'message': 'Export generated successfully',
            'csv_data': output.getvalue()
        })
        
    except Exception as e:
        current_app.logger.error(f'Export companies error: {e}')
        return jsonify({'error': 'Failed to export companies'}), 500

# =====================================================
# USER MANAGEMENT ROUTES (Enhanced)
# =====================================================

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@require_admin
def get_users():
    """Get all users with pagination and company details"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        search = request.args.get('search', '')
        status_filter = request.args.get('status')
        role_filter = request.args.get('role')
        company_filter = request.args.get('company_id', type=int)
        
        # Build query
        query = User.query.join(Company, User.company_id == Company.id, isouter=True)
        
        # Apply filters
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    User.first_name.ilike(search_pattern),
                    User.last_name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    Company.name.ilike(search_pattern)
                )
            )
        
        if status_filter:
            if status_filter == 'active':
                query = query.filter(User.is_active == True)
            elif status_filter == 'inactive':
                query = query.filter(User.is_active == False)
        
        if role_filter:
            query = query.filter(User.role == role_filter)
        
        if company_filter:
            query = query.filter(User.company_id == company_filter)
        
        # Order and paginate
        query = query.order_by(User.created_at.desc())
        users_paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Format response
        users_data = []
        for user in users_paginated.items:
            user_dict = user.to_dict()
            user_dict['company_name'] = user.company.name if user.company else None
            user_dict['company_id'] = user.company_id
            users_data.append(user_dict)
        
        return jsonify({
            'users': users_data,
            'pagination': {
                'page': page,
                'pages': users_paginated.pages,
                'per_page': per_page,
                'total': users_paginated.total,
                'has_next': users_paginated.has_next,
                'has_prev': users_paginated.has_prev
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Get users error: {e}')
        return jsonify({'error': 'Failed to get users'}), 500

@admin_bp.route('/users', methods=['POST'])
@jwt_required()
@require_admin
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=data['email'].lower()).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Validate company exists if company_id provided
        if data.get('company_id'):
            company = Company.query.get(data['company_id'])
            if not company:
                return jsonify({'error': 'Company not found'}), 400
        
        # Create user
        user = User(
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email'].lower(),
            phone=data.get('phone'),
            role=data.get('role', 'user'),
            company_id=data.get('company_id'),
            is_active=data.get('is_active', True)
        )
        
        # Set a default password if creating user as admin
        if 'password' in data:
            user.set_password(data['password'])
        else:
            # Set a temporary password that user must change
            user.set_password('TempPassword123!')
        
        db.session.add(user)
        db.session.commit()
        
        user_dict = user.to_dict()
        if user.company:
            user_dict['company_name'] = user.company.name
        
        return jsonify({
            'message': 'User created successfully',
            'user': user_dict
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Create user error: {e}')
        return jsonify({'error': 'Failed to create user'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
@require_admin
def get_user(user_id):
    """Get a specific user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_dict = user.to_dict()
        if user.company:
            user_dict['company_name'] = user.company.name
            user_dict['company'] = user.company.to_dict()
        
        return jsonify({'user': user_dict})
        
    except Exception as e:
        current_app.logger.error(f'Get user error: {e}')
        return jsonify({'error': 'Failed to get user'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@require_admin
def update_user(user_id):
    """Update a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            # Check if email already exists for another user
            existing_user = User.query.filter_by(email=data['email'].lower()).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Email already exists'}), 400
            user.email = data['email'].lower()
        if 'phone' in data:
            user.phone = data['phone']
        if 'role' in data:
            user.role = data['role']
        if 'company_id' in data:
            if data['company_id']:
                company = Company.query.get(data['company_id'])
                if not company:
                    return jsonify({'error': 'Company not found'}), 400
            user.company_id = data['company_id']
        if 'is_active' in data:
            user.is_active = data['is_active']
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        user_dict = user.to_dict()
        if user.company:
            user_dict['company_name'] = user.company.name
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user_dict
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Update user error: {e}')
        return jsonify({'error': 'Failed to update user'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@require_admin
def delete_user(user_id):
    """Delete a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has projects or other dependencies
        if user.projects and len(user.projects) > 0:
            return jsonify({
                'error': 'Cannot delete user with existing projects. Please transfer or delete projects first.'
            }), 400
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Delete user error: {e}')
        return jsonify({'error': 'Failed to delete user'}), 500

@admin_bp.route('/users/<int:user_id>/activate', methods=['PUT'])
@jwt_required()
@require_admin
def activate_user(user_id):
    """Activate a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.is_active = True
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'User activated successfully',
            'user': user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Activate user error: {e}')
        return jsonify({'error': 'Failed to activate user'}), 500

@admin_bp.route('/users/<int:user_id>/deactivate', methods=['PUT'])
@jwt_required()
@require_admin
def deactivate_user(user_id):
    """Deactivate a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.is_active = False
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'User deactivated successfully',
            'user': user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Deactivate user error: {e}')
        return jsonify({'error': 'Failed to deactivate user'}), 500

@admin_bp.route('/users/<int:user_id>/send-notification', methods=['POST'])
@jwt_required()
@require_admin
def send_user_notification(user_id):
    """Send notification email to user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        notification_type = data.get('type', 'general')
        
        # Here you would integrate with your email service
        # For now, we'll just log it
        current_app.logger.info(f'Sending {notification_type} notification to {user.email}')
        
        return jsonify({'message': 'Notification sent successfully'})
        
    except Exception as e:
        current_app.logger.error(f'Send notification error: {e}')
        return jsonify({'error': 'Failed to send notification'}), 500

@admin_bp.route('/users/export', methods=['GET'])
@jwt_required()
@require_admin
def export_users():
    """Export users to CSV"""
    try:
        users = User.query.join(Company, User.company_id == Company.id, isouter=True).all()
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Role', 
            'Company', 'Company ID', 'Status', 'Created At', 'Last Login', 'Updated At'
        ])
        
        # Write user data
        for user in users:
            writer.writerow([
                user.id,
                user.first_name,
                user.last_name,
                user.email,
                user.phone or '',
                user.role,
                user.company.name if user.company else '',
                user.company_id or '',
                'Active' if user.is_active else 'Inactive',
                user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else '',
                user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else 'Never',
                user.updated_at.strftime('%Y-%m-%d %H:%M:%S') if user.updated_at else ''
            ])
        
        output.seek(0)
        
        return jsonify({
            'message': 'Export generated successfully',
            'csv_data': output.getvalue()
        })
        
    except Exception as e:
        current_app.logger.error(f'Export users error: {e}')
        return jsonify({'error': 'Failed to export users'}), 500

# =====================================================
# PROJECT MANAGEMENT ROUTES (Admin Overview)
# =====================================================

@admin_bp.route('/projects', methods=['GET'])
@jwt_required()
@require_admin
def get_all_projects():
    """Get all projects across all companies for admin overview"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        search = request.args.get('search', '')
        status_filter = request.args.get('status')
        company_filter = request.args.get('company_id', type=int)
        
        # Build query
        query = Project.query.join(Company, Project.company_id == Company.id)
        
        # Apply filters
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    Project.name.ilike(search_pattern),
                    Project.client_name.ilike(search_pattern),
                    Project.description.ilike(search_pattern),
                    Company.name.ilike(search_pattern)
                )
            )
        
        if status_filter:
            query = query.filter(Project.status == status_filter)
        
        if company_filter:
            query = query.filter(Project.company_id == company_filter)
        
        # Order and paginate
        query = query.order_by(Project.created_at.desc())
        projects_paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Format response
        projects_data = []
        for project in projects_paginated.items:
            project_dict = project.to_dict()
            project_dict['company_name'] = project.company.name if project.company else None
            project_dict['created_by_name'] = f"{project.created_by_user.first_name} {project.created_by_user.last_name}" if project.created_by_user else None
            projects_data.append(project_dict)
        
        return jsonify({
            'projects': projects_data,
            'pagination': {
                'page': page,
                'pages': projects_paginated.pages,
                'per_page': per_page,
                'total': projects_paginated.total,
                'has_next': projects_paginated.has_next,
                'has_prev': projects_paginated.has_prev
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Get all projects error: {e}')
        return jsonify({'error': 'Failed to get projects'}), 500

@admin_bp.route('/projects/<int:project_id>', methods=['GET'])
@jwt_required()
@require_admin
def get_project_admin(project_id):
    """Get a specific project (admin view)"""
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        project_dict = project.to_dict()
        project_dict['company_name'] = project.company.name if project.company else None
        project_dict['created_by_name'] = f"{project.created_by_user.first_name} {project.created_by_user.last_name}" if project.created_by_user else None
        
        return jsonify({'project': project_dict})
        
    except Exception as e:
        current_app.logger.error(f'Get project admin error: {e}')
        return jsonify({'error': 'Failed to get project'}), 500

@admin_bp.route('/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
@require_admin
def delete_project_admin(project_id):
    """Delete a project (admin action)"""
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Delete associated files
        try:
            if hasattr(project, 'uploaded_images') and project.uploaded_images:
                import os
                for image_path in project.uploaded_images:
                    if os.path.exists(image_path):
                        os.remove(image_path)
            
            if hasattr(project, 'generated_files') and project.generated_files:
                for file_path in project.generated_files:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        
            if hasattr(project, 'quote_pdf_path') and project.quote_pdf_path and os.path.exists(project.quote_pdf_path):
                os.remove(project.quote_pdf_path)
                
        except Exception as e:
            current_app.logger.warning(f'Error deleting project files: {e}')
        
        # Delete associated quotes
        from models.quote import Quote
        Quote.query.filter_by(project_id=project_id).delete()
        
        # Delete the project
        db.session.delete(project)
        db.session.commit()
        
        return jsonify({'message': 'Project deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Delete project admin error: {e}')
        return jsonify({'error': 'Failed to delete project'}), 500

# =====================================================
# SUBSCRIPTION MANAGEMENT ROUTES (Admin Overview)
# =====================================================

@admin_bp.route('/subscriptions', methods=['GET'])
@jwt_required()
@require_admin
def get_all_subscriptions():
    """Get all subscriptions for admin overview"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        status_filter = request.args.get('status')
        plan_filter = request.args.get('plan')
        
        # Build query
        query = Subscription.query.join(Company, Subscription.company_id == Company.id)
        
        # Apply filters
        if status_filter:
            query = query.filter(Subscription.status == status_filter)
        
        if plan_filter:
            query = query.filter(Subscription.plan_name == plan_filter)
        
        # Order and paginate
        query = query.order_by(Subscription.created_at.desc())
        subscriptions_paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Format response
        subscriptions_data = []
        for subscription in subscriptions_paginated.items:
            subscription_dict = subscription.to_dict()
            subscription_dict['company_name'] = subscription.company.name if subscription.company else None
            subscription_dict['company_email'] = subscription.company.email if subscription.company else None
            subscription_dict['user_count'] = len(subscription.company.users) if subscription.company else 0
            subscriptions_data.append(subscription_dict)
        
        return jsonify({
            'subscriptions': subscriptions_data,
            'pagination': {
                'page': page,
                'pages': subscriptions_paginated.pages,
                'per_page': per_page,
                'total': subscriptions_paginated.total,
                'has_next': subscriptions_paginated.has_next,
                'has_prev': subscriptions_paginated.has_prev
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Get all subscriptions error: {e}')
        return jsonify({'error': 'Failed to get subscriptions'}), 500

@admin_bp.route('/subscriptions/<int:subscription_id>', methods=['PUT'])
@jwt_required()
@require_admin
def update_subscription_admin(subscription_id):
    """Update a subscription (admin action)"""
    try:
        subscription = Subscription.query.get(subscription_id)
        if not subscription:
            return jsonify({'error': 'Subscription not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'plan_name' in data:
            if data['plan_name'] not in current_app.config['SUBSCRIPTION_PLANS']:
                return jsonify({'error': 'Invalid plan name'}), 400
            subscription.plan_name = data['plan_name']
            
            # Update limits based on new plan
            plan = current_app.config['SUBSCRIPTION_PLANS'][data['plan_name']]
            subscription.max_projects = plan['max_projects']
            subscription.max_users = plan['max_users']
        
        if 'status' in data:
            valid_statuses = ['trial', 'active', 'past_due', 'cancelled', 'unpaid']
            if data['status'] not in valid_statuses:
                return jsonify({'error': 'Invalid status'}), 400
            subscription.status = data['status']
        
        if 'billing_cycle' in data:
            if data['billing_cycle'] not in ['monthly', 'yearly']:
                return jsonify({'error': 'Invalid billing cycle'}), 400
            subscription.billing_cycle = data['billing_cycle']
        
        if 'current_period_end' in data:
            subscription.current_period_end = datetime.fromisoformat(data['current_period_end'])
        
        subscription.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Subscription updated successfully',
            'subscription': subscription.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Update subscription admin error: {e}')
        return jsonify({'error': 'Failed to update subscription'}), 500

# =====================================================
# ANALYTICS AND REPORTING ROUTES
# =====================================================

@admin_bp.route('/analytics/overview', methods=['GET'])
@jwt_required()
@require_admin
def get_analytics_overview():
    """Get comprehensive analytics overview"""
    try:
        # Date range parameters
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Basic counts
        total_companies = Company.query.count()
        total_users = User.query.count()
        total_projects = Project.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        
        # Growth metrics
        new_companies = Company.query.filter(Company.created_at >= start_date).count()
        new_users = User.query.filter(User.created_at >= start_date).count()
        new_projects = Project.query.filter(Project.created_at >= start_date).count()
        
        # Subscription metrics
        active_subscriptions = Subscription.query.filter_by(status='active').count()
        trial_subscriptions = Subscription.query.filter_by(status='trial').count()
        cancelled_subscriptions = Subscription.query.filter_by(status='cancelled').count()
        
        # Plan distribution
        plan_distribution = db.session.query(
            Subscription.plan_name,
            db.func.count(Subscription.id).label('count')
        ).group_by(Subscription.plan_name).all()
        
        plan_stats = {plan: count for plan, count in plan_distribution}
        
        # Project status distribution
        project_status_distribution = db.session.query(
            Project.status,
            db.func.count(Project.id).label('count')
        ).group_by(Project.status).all()
        
        project_stats = {status: count for status, count in project_status_distribution}
        
        return jsonify({
            'overview': {
                'total_companies': total_companies,
                'total_users': total_users,
                'total_projects': total_projects,
                'active_users': active_users
            },
            'growth': {
                'new_companies': new_companies,
                'new_users': new_users,
                'new_projects': new_projects,
                'period_days': days
            },
            'subscriptions': {
                'active': active_subscriptions,
                'trial': trial_subscriptions,
                'cancelled': cancelled_subscriptions,
                'plan_distribution': plan_stats
            },
            'projects': {
                'status_distribution': project_stats
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Get analytics overview error: {e}')
        return jsonify({'error': 'Failed to get analytics'}), 500

@admin_bp.route('/analytics/revenue', methods=['GET'])
@jwt_required()
@require_admin
def get_revenue_analytics():
    """Get revenue analytics (mock data for now)"""
    try:
        # This would integrate with Stripe for real revenue data
        # For now, returning mock data
        revenue_data = [
            {'month': '2024-01', 'revenue': 12500, 'subscriptions': 25},
            {'month': '2024-02', 'revenue': 15200, 'subscriptions': 30},
            {'month': '2024-03', 'revenue': 18700, 'subscriptions': 37},
            {'month': '2024-04', 'revenue': 22100, 'subscriptions': 44},
            {'month': '2024-05', 'revenue': 28900, 'subscriptions': 55},
            {'month': '2024-06', 'revenue': 32400, 'subscriptions': 62}
        ]
        
        return jsonify({
            'revenue_data': revenue_data,
            'total_revenue': sum(item['revenue'] for item in revenue_data),
            'average_monthly_revenue': sum(item['revenue'] for item in revenue_data) / len(revenue_data)
        })
        
    except Exception as e:
        current_app.logger.error(f'Get revenue analytics error: {e}')
        return jsonify({'error': 'Failed to get revenue analytics'}), 500

# =====================================================
# SYSTEM MANAGEMENT ROUTES
# =====================================================

@admin_bp.route('/system/health', methods=['GET'])
@jwt_required()
@require_admin
def system_health():
    """Get system health status"""
    try:
        # Database health
        try:
            db.session.execute(db.text('SELECT 1'))
            db_status = 'healthy'
        except Exception as e:
            db_status = f'unhealthy: {str(e)}'
        
        # Get system stats
        total_companies = Company.query.count()
        total_users = User.query.count()
        total_projects = Project.query.count()
        total_subscriptions = Subscription.query.count()
        
        # Disk usage (mock for now)
        disk_usage = {
            'total': '100GB',
            'used': '45GB',
            'free': '55GB',
            'percentage': 45
        }
        
        return jsonify({
            'status': 'healthy' if db_status == 'healthy' else 'degraded',
            'database': db_status,
            'timestamp': datetime.utcnow().isoformat(),
            'stats': {
                'companies': total_companies,
                'users': total_users,
                'projects': total_projects,
                'subscriptions': total_subscriptions
            },
            'disk_usage': disk_usage
        })
        
    except Exception as e:
        current_app.logger.error(f'System health check error: {e}')
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@admin_bp.route('/system/logs', methods=['GET'])
@jwt_required()
@require_admin
def get_system_logs():
    """Get recent system logs (mock implementation)"""
    try:
        # This would read from actual log files in production
        # For now, returning mock log data
        logs = [
            {
                'timestamp': datetime.utcnow().isoformat(),
                'level': 'INFO',
                'message': 'User login successful',
                'user_id': 1,
                'ip_address': '192.168.1.1'
            },
            {
                'timestamp': (datetime.utcnow() - timedelta(minutes=5)).isoformat(),
                'level': 'WARNING',
                'message': 'Failed login attempt',
                'ip_address': '192.168.1.100'
            },
            {
                'timestamp': (datetime.utcnow() - timedelta(minutes=10)).isoformat(),
                'level': 'INFO',
                'message': 'Project created successfully',
                'user_id': 2,
                'project_id': 15
            }
        ]
        
        return jsonify({
            'logs': logs,
            'total': len(logs)
        })
        
    except Exception as e:
        current_app.logger.error(f'Get system logs error: {e}')
        return jsonify({'error': 'Failed to get system logs'}), 500

# =====================================================
# BULK OPERATIONS
# =====================================================

@admin_bp.route('/bulk/activate-companies', methods=['POST'])
@jwt_required()
@require_admin
def bulk_activate_companies():
    """Bulk activate companies"""
    try:
        data = request.get_json()
        company_ids = data.get('company_ids', [])
        
        if not company_ids:
            return jsonify({'error': 'No company IDs provided'}), 400
        
        companies = Company.query.filter(Company.id.in_(company_ids)).all()
        activated_count = 0
        
        for company in companies:
            for user in company.users:
                user.is_active = True
                user.updated_at = datetime.utcnow()
            activated_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully activated {activated_count} companies',
            'activated_count': activated_count
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Bulk activate companies error: {e}')
        return jsonify({'error': 'Failed to activate companies'}), 500

@admin_bp.route('/bulk/deactivate-companies', methods=['POST'])
@jwt_required()
@require_admin
def bulk_deactivate_companies():
    """Bulk deactivate companies"""
    try:
        data = request.get_json()
        company_ids = data.get('company_ids', [])
        
        if not company_ids:
            return jsonify({'error': 'No company IDs provided'}), 400
        
        companies = Company.query.filter(Company.id.in_(company_ids)).all()
        deactivated_count = 0
        
        for company in companies:
            for user in company.users:
                user.is_active = False
                user.updated_at = datetime.utcnow()
            deactivated_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully deactivated {deactivated_count} companies',
            'deactivated_count': deactivated_count
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Bulk deactivate companies error: {e}')
        return jsonify({'error': 'Failed to deactivate companies'}), 500
    
# =====================================================
# ENHANCED SUBSCRIPTION MANAGEMENT ROUTES
# =====================================================

@admin_bp.route('/subscriptions/stats', methods=['GET'])
@jwt_required()
@require_admin
def get_subscription_stats():
    """Get comprehensive subscription statistics"""
    try:
        from datetime import datetime, timedelta
        from sqlalchemy import func, extract
        
        # Current date calculations
        now = datetime.utcnow()
        last_month = now - timedelta(days=30)
        
        # Basic subscription counts
        total_subscriptions = Subscription.query.count()
        active_subscriptions = Subscription.query.filter_by(status='active').count()
        trial_subscriptions = Subscription.query.filter_by(status='trial').count()
        cancelled_subscriptions = Subscription.query.filter_by(status='cancelled').count()
        past_due_subscriptions = Subscription.query.filter_by(status='past_due').count()
        
        # Growth calculations (compare with last month)
        last_month_active = Subscription.query.filter(
            Subscription.status == 'active',
            Subscription.created_at <= last_month
        ).count()
        
        active_growth = 0
        if last_month_active > 0:
            active_growth = ((active_subscriptions - last_month_active) / last_month_active) * 100
        
        # Revenue calculations
        total_revenue = 0
        current_mrr = 0
        previous_mrr = 0
        
        # Calculate current MRR (Monthly Recurring Revenue)
        active_subs = Subscription.query.filter_by(status='active').all()
        for sub in active_subs:
            plan = current_app.config['SUBSCRIPTION_PLANS'].get(sub.plan_name, {})
            monthly_price = plan.get('monthly_price', 0)
            yearly_price = plan.get('yearly_price', 0)
            
            if sub.billing_cycle == 'yearly' and yearly_price:
                current_mrr += yearly_price / 12
                total_revenue += yearly_price
            elif monthly_price:
                current_mrr += monthly_price
                total_revenue += monthly_price
        
        # Calculate previous month MRR for growth
        last_month_subs = Subscription.query.filter(
            Subscription.status == 'active',
            Subscription.created_at <= last_month
        ).all()
        
        for sub in last_month_subs:
            plan = current_app.config['SUBSCRIPTION_PLANS'].get(sub.plan_name, {})
            monthly_price = plan.get('monthly_price', 0)
            yearly_price = plan.get('yearly_price', 0)
            
            if sub.billing_cycle == 'yearly' and yearly_price:
                previous_mrr += yearly_price / 12
            elif monthly_price:
                previous_mrr += monthly_price
        
        # MRR Growth
        mrr_growth = 0
        if previous_mrr > 0:
            mrr_growth = ((current_mrr - previous_mrr) / previous_mrr) * 100
        
        # Revenue Growth
        revenue_growth = 0
        if previous_mrr > 0:
            revenue_growth = ((current_mrr - previous_mrr) / previous_mrr) * 100
        
        # Trial conversion rate
        total_trials = Subscription.query.filter(
            Subscription.status.in_(['trial', 'active', 'cancelled']),
            Subscription.created_at >= last_month
        ).count()
        
        converted_trials = Subscription.query.filter(
            Subscription.status == 'active',
            Subscription.created_at >= last_month,
            Subscription.trial_end.isnot(None)
        ).count()
        
        trial_conversion_rate = 0
        if total_trials > 0:
            trial_conversion_rate = (converted_trials / total_trials) * 100
        
        # Monthly conversions
        monthly_conversions = Subscription.query.filter(
            Subscription.status == 'active',
            Subscription.created_at >= now - timedelta(days=30),
            Subscription.trial_end.isnot(None)
        ).count()
        
        # Churn rate calculation
        cancelled_this_month = Subscription.query.filter(
            Subscription.status == 'cancelled',
            Subscription.cancelled_at >= now - timedelta(days=30)
        ).count()
        
        churn_rate = 0
        if active_subscriptions > 0:
            churn_rate = (cancelled_this_month / (active_subscriptions + cancelled_this_month)) * 100
        
        # Previous month churn for comparison
        cancelled_last_month = Subscription.query.filter(
            Subscription.status == 'cancelled',
            Subscription.cancelled_at >= now - timedelta(days=60),
            Subscription.cancelled_at < now - timedelta(days=30)
        ).count()
        
        last_month_total = last_month_active + cancelled_last_month
        previous_churn = 0
        if last_month_total > 0:
            previous_churn = (cancelled_last_month / last_month_total) * 100
        
        churn_change = churn_rate - previous_churn
        
        # Failed payments and issues
        failed_payments = 0  # This would come from payment provider webhooks
        active_trials = trial_subscriptions
        past_due_count = past_due_subscriptions
        cancelled_count = cancelled_subscriptions
        
        return jsonify({
            'total_revenue': round(total_revenue, 2),
            'revenue_growth': round(revenue_growth, 2),
            'active_subscriptions': active_subscriptions,
            'active_growth': round(active_growth, 2),
            'trial_subscriptions': trial_subscriptions,
            'trial_conversion_rate': round(trial_conversion_rate, 2),
            'churn_rate': round(churn_rate, 2),
            'churn_change': round(churn_change, 2),
            'current_mrr': round(current_mrr, 2),
            'previous_mrr': round(previous_mrr, 2),
            'mrr_growth': round(mrr_growth, 2),
            'monthly_conversions': monthly_conversions,
            'failed_payments': failed_payments,
            'active_trials': active_trials,
            'past_due_count': past_due_count,
            'cancelled_count': cancelled_count,
            'total_subscriptions': total_subscriptions
        })
        
    except Exception as e:
        current_app.logger.error(f'Get subscription stats error: {e}')
        return jsonify({'error': 'Failed to get subscription statistics'}), 500


@admin_bp.route('/subscriptions/revenue-data', methods=['GET'])
@jwt_required()
@require_admin
def get_subscription_revenue_data():
    """Get revenue data for charts"""
    try:
        from datetime import datetime, timedelta
        from sqlalchemy import func, extract
        
        # Get last 12 months of data
        now = datetime.utcnow()
        months_data = []
        plan_revenue = {}
        
        for i in range(12):
            month_start = (now - timedelta(days=30*i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
            
            # Calculate revenue for this month
            month_revenue = 0
            month_subscriptions = 0
            
            # Get active subscriptions for this month
            subs_this_month = Subscription.query.filter(
                Subscription.status == 'active',
                Subscription.created_at <= month_end
            ).all()
            
            for sub in subs_this_month:
                plan = current_app.config['SUBSCRIPTION_PLANS'].get(sub.plan_name, {})
                monthly_price = plan.get('monthly_price', 0)
                yearly_price = plan.get('yearly_price', 0)
                
                if sub.billing_cycle == 'yearly' and yearly_price:
                    month_revenue += yearly_price / 12
                elif monthly_price:
                    month_revenue += monthly_price
                
                month_subscriptions += 1
                
                # Track by plan
                if sub.plan_name not in plan_revenue:
                    plan_revenue[sub.plan_name] = 0
                
                if sub.billing_cycle == 'yearly' and yearly_price:
                    plan_revenue[sub.plan_name] += yearly_price / 12
                elif monthly_price:
                    plan_revenue[sub.plan_name] += monthly_price
            
            months_data.insert(0, {
                'month': month_start.strftime('%Y-%m'),
                'revenue': round(month_revenue, 2),
                'subscriptions': month_subscriptions
            })
        
        # Plan distribution for pie chart
        plan_distribution = []
        for plan_name, revenue in plan_revenue.items():
            if revenue > 0:
                plan_distribution.append({
                    'name': plan_name.title(),
                    'value': round(revenue, 2)
                })
        
        return jsonify({
            'monthly_revenue': months_data,
            'plan_distribution': plan_distribution
        })
        
    except Exception as e:
        current_app.logger.error(f'Get revenue data error: {e}')
        return jsonify({'error': 'Failed to get revenue data'}), 500


@admin_bp.route('/subscriptions/<int:subscription_id>/cancel', methods=['PUT'])
@jwt_required()
@require_admin
def cancel_subscription_admin(subscription_id):
    """Cancel a subscription (admin action)"""
    try:
        subscription = Subscription.query.get(subscription_id)
        if not subscription:
            return jsonify({'error': 'Subscription not found'}), 404
        
        # Cancel in Stripe if it exists
        if subscription.stripe_subscription_id:
            try:
                import stripe
                stripe.api_key = current_app.config.get('STRIPE_SECRET_KEY')
                stripe.Subscription.delete(subscription.stripe_subscription_id)
            except Exception as e:
                current_app.logger.warning(f'Failed to cancel in Stripe: {e}')
        
        # Update local subscription
        subscription.status = 'cancelled'
        subscription.cancelled_at = datetime.utcnow()
        subscription.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Subscription cancelled successfully',
            'subscription': subscription.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Cancel subscription error: {e}')
        return jsonify({'error': 'Failed to cancel subscription'}), 500


@admin_bp.route('/subscriptions/<int:subscription_id>/reactivate', methods=['PUT'])
@jwt_required()
@require_admin
def reactivate_subscription_admin(subscription_id):
    """Reactivate a cancelled subscription"""
    try:
        subscription = Subscription.query.get(subscription_id)
        if not subscription:
            return jsonify({'error': 'Subscription not found'}), 404
        
        if subscription.status not in ['cancelled', 'past_due']:
            return jsonify({'error': 'Can only reactivate cancelled or past due subscriptions'}), 400
        
        # Reactivate subscription
        subscription.status = 'active'
        subscription.cancelled_at = None
        subscription.updated_at = datetime.utcnow()
        
        # Extend current period by 30 days
        subscription.current_period_end = datetime.utcnow() + timedelta(days=30)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Subscription reactivated successfully',
            'subscription': subscription.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Reactivate subscription error: {e}')
        return jsonify({'error': 'Failed to reactivate subscription'}), 500


@admin_bp.route('/subscriptions/<int:subscription_id>/refund', methods=['POST'])
@jwt_required()
@require_admin
def process_refund_admin(subscription_id):
    """Process a refund for a subscription"""
    try:
        subscription = Subscription.query.get(subscription_id)
        if not subscription:
            return jsonify({'error': 'Subscription not found'}), 404
        
        data = request.get_json()
        amount = data.get('amount')  # Amount in cents
        reason = data.get('reason', 'requested_by_customer')
        
        if not amount or amount <= 0:
            return jsonify({'error': 'Valid refund amount required'}), 400
        
        # Process refund in Stripe
        refund_result = None
        if subscription.stripe_customer_id:
            try:
                import stripe
                stripe.api_key = current_app.config.get('STRIPE_SECRET_KEY')
                
                # Get the latest payment intent or charge
                charges = stripe.Charge.list(
                    customer=subscription.stripe_customer_id,
                    limit=1
                )
                
                if charges.data:
                    refund_result = stripe.Refund.create(
                        charge=charges.data[0].id,
                        amount=amount,
                        reason=reason
                    )
                else:
                    return jsonify({'error': 'No charges found for this customer'}), 400
                    
            except Exception as e:
                current_app.logger.error(f'Stripe refund failed: {e}')
                return jsonify({'error': f'Refund processing failed: {str(e)}'}), 500
        
        # Record the refund (you might want to create a Refund model)
        # For now, we'll just log it
        current_app.logger.info(f'Refund processed: {amount/100} for subscription {subscription_id}')
        
        return jsonify({
            'message': f'Refund of €{amount/100:.2f} processed successfully',
            'refund_id': refund_result.id if refund_result else None,
            'amount': amount/100
        })
        
    except Exception as e:
        current_app.logger.error(f'Process refund error: {e}')
        return jsonify({'error': 'Failed to process refund'}), 500


@admin_bp.route('/subscriptions/export', methods=['GET'])
@jwt_required()
@require_admin
def export_subscriptions():
    """Export subscriptions to CSV"""
    try:
        subscriptions = db.session.query(Subscription, Company, User).join(
            Company, Subscription.company_id == Company.id
        ).join(
            User, Company.id == User.company_id, isouter=True
        ).order_by(Subscription.created_at.desc()).all()
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Subscription ID', 'Company Name', 'User Email', 'Plan Name', 
            'Billing Cycle', 'Status', 'Amount', 'Currency', 'Created At',
            'Current Period Start', 'Current Period End', 'Trial End',
            'Cancelled At', 'Stripe Customer ID', 'Stripe Subscription ID',
            'Max Projects', 'Max Users', 'Projects Used This Month'
        ])
        
        # Write subscription data
        for subscription, company, user in subscriptions:
            # Get plan details for amount
            plan = current_app.config['SUBSCRIPTION_PLANS'].get(subscription.plan_name, {})
            amount = 0
            if subscription.billing_cycle == 'yearly':
                amount = plan.get('yearly_price', 0)
            else:
                amount = plan.get('monthly_price', 0)
            
            writer.writerow([
                subscription.id,
                company.name if company else '',
                user.email if user else '',
                subscription.plan_name,
                subscription.billing_cycle,
                subscription.status,
                amount,
                'GBP',
                subscription.created_at.strftime('%Y-%m-%d %H:%M:%S') if subscription.created_at else '',
                subscription.current_period_start.strftime('%Y-%m-%d') if subscription.current_period_start else '',
                subscription.current_period_end.strftime('%Y-%m-%d') if subscription.current_period_end else '',
                subscription.trial_end.strftime('%Y-%m-%d') if subscription.trial_end else '',
                subscription.cancelled_at.strftime('%Y-%m-%d %H:%M:%S') if subscription.cancelled_at else '',
                subscription.stripe_customer_id or '',
                subscription.stripe_subscription_id or '',
                subscription.max_projects or 0,
                subscription.max_users or 0,
                getattr(subscription, 'projects_used_this_month', 0)
            ])
        
        output.seek(0)
        
        return jsonify({
            'message': 'Export generated successfully',
            'csv_data': output.getvalue()
        })
        
    except Exception as e:
        current_app.logger.error(f'Export subscriptions error: {e}')
        return jsonify({'error': 'Failed to export subscriptions'}), 500


# =====================================================
# ENHANCED ANALYTICS ROUTES
# =====================================================

@admin_bp.route('/analytics/dashboard', methods=['GET'])
@jwt_required()
@require_admin
def get_analytics_dashboard():
    """Get comprehensive analytics for admin dashboard"""
    try:
        from datetime import datetime, timedelta
        
        # Date range
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Basic metrics
        total_companies = Company.query.count()
        total_users = User.query.count()
        total_projects = Project.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        
        # Growth metrics
        new_companies = Company.query.filter(Company.created_at >= start_date).count()
        new_users = User.query.filter(User.created_at >= start_date).count()
        new_projects = Project.query.filter(Project.created_at >= start_date).count()
        
        # Subscription metrics
        active_subscriptions = Subscription.query.filter_by(status='active').count()
        trial_subscriptions = Subscription.query.filter_by(status='trial').count()
        cancelled_subscriptions = Subscription.query.filter_by(status='cancelled').count()
        
        # Revenue calculation
        total_revenue = 0
        monthly_revenue = 0
        
        active_subs = Subscription.query.filter_by(status='active').all()
        for sub in active_subs:
            plan = current_app.config['SUBSCRIPTION_PLANS'].get(sub.plan_name, {})
            if sub.billing_cycle == 'yearly':
                yearly_price = plan.get('yearly_price', 0)
                total_revenue += yearly_price
                monthly_revenue += yearly_price / 12
            else:
                monthly_price = plan.get('monthly_price', 0)
                total_revenue += monthly_price
                monthly_revenue += monthly_price
        
        # Project status distribution
        project_statuses = db.session.query(
            Project.status,
            db.func.count(Project.id).label('count')
        ).group_by(Project.status).all()
        
        project_stats = {status: count for status, count in project_statuses}
        
        # Plan distribution
        plan_distribution = db.session.query(
            Subscription.plan_name,
            db.func.count(Subscription.id).label('count')
        ).filter(Subscription.status == 'active').group_by(Subscription.plan_name).all()
        
        plan_stats = {plan: count for plan, count in plan_distribution}
        
        # User activity (last 30 days)
        recent_logins = User.query.filter(
            User.last_login >= start_date
        ).count()
        
        return jsonify({
            'overview': {
                'total_companies': total_companies,
                'total_users': total_users,
                'total_projects': total_projects,
                'active_users': active_users,
                'recent_logins': recent_logins
            },
            'growth': {
                'new_companies': new_companies,
                'new_users': new_users,
                'new_projects': new_projects,
                'period_days': days
            },
            'subscriptions': {
                'active': active_subscriptions,
                'trial': trial_subscriptions,
                'cancelled': cancelled_subscriptions,
                'plan_distribution': plan_stats
            },
            'revenue': {
                'total_revenue': round(total_revenue, 2),
                'monthly_revenue': round(monthly_revenue, 2)
            },
            'projects': {
                'status_distribution': project_stats
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Get analytics dashboard error: {e}')
        return jsonify({'error': 'Failed to get analytics'}), 500


# =====================================================
# BULK OPERATIONS FOR SUBSCRIPTIONS
# =====================================================

@admin_bp.route('/bulk/cancel-subscriptions', methods=['POST'])
@jwt_required()
@require_admin
def bulk_cancel_subscriptions():
    """Bulk cancel subscriptions"""
    try:
        data = request.get_json()
        subscription_ids = data.get('subscription_ids', [])
        
        if not subscription_ids:
            return jsonify({'error': 'No subscription IDs provided'}), 400
        
        subscriptions = Subscription.query.filter(Subscription.id.in_(subscription_ids)).all()
        cancelled_count = 0
        
        for subscription in subscriptions:
            if subscription.status in ['active', 'trial']:
                # Cancel in Stripe if exists
                if subscription.stripe_subscription_id:
                    try:
                        import stripe
                        stripe.api_key = current_app.config.get('STRIPE_SECRET_KEY')
                        stripe.Subscription.delete(subscription.stripe_subscription_id)
                    except Exception as e:
                        current_app.logger.warning(f'Failed to cancel in Stripe: {e}')
                
                subscription.status = 'cancelled'
                subscription.cancelled_at = datetime.utcnow()
                subscription.updated_at = datetime.utcnow()
                cancelled_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully cancelled {cancelled_count} subscriptions',
            'cancelled_count': cancelled_count
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Bulk cancel subscriptions error: {e}')
        return jsonify({'error': 'Failed to cancel subscriptions'}), 500
    

# Add these routes to your admin_bp.py file

# =====================================================
# ADMIN PROJECT MANAGEMENT ROUTES - MISSING FUNCTIONALITY
# =====================================================

# @admin_bp.route('/projects', methods=['GET'])
# @jwt_required()
# @require_admin
# def get_all_projects_admin():
#     """Get all projects across all companies for admin overview"""
#     try:
#         days = request.args.get('days', 30, type=int)
#         page = request.args.get('page', 1, type=int)
#         per_page = min(request.args.get('per_page', 50, type=int), 100)
#         search = request.args.get('search', '')
#         status_filter = request.args.get('status')
#         company_filter = request.args.get('company_id', type=int)
        
#         # Date filter
#         from datetime import datetime, timedelta
#         start_date = datetime.utcnow() - timedelta(days=days)
        
#         # Build query with joins to get company and user info
#         query = db.session.query(Project, Company, User).join(
#             Company, Project.company_id == Company.id
#         ).join(
#             User, Project.created_by == User.id, isouter=True
#         )
        
#         # Apply date filter if specified
#         if days:
#             query = query.filter(Project.created_at >= start_date)
        
#         # Apply other filters
#         if search:
#             search_pattern = f'%{search}%'
#             query = query.filter(
#                 db.or_(
#                     Project.name.ilike(search_pattern),
#                     Project.client_name.ilike(search_pattern),
#                     Project.description.ilike(search_pattern),
#                     Company.name.ilike(search_pattern)
#                 )
#             )
        
#         if status_filter:
#             query = query.filter(Project.status == status_filter)
        
#         if company_filter:
#             query = query.filter(Project.company_id == company_filter)
        
#         # Order by most recent
#         query = query.order_by(Project.created_at.desc())
        
#         # Get all projects for the return (not paginated for this endpoint)
#         all_results = query.all()
        
#         # Format response with enhanced data
#         projects_data = []
#         for project, company, user in all_results:
#             try:
#                 # Get project value from quote if available
#                 estimated_value = 0
#                 try:
#                     from models.quote import Quote
#                     latest_quote = Quote.query.filter_by(project_id=project.id).order_by(Quote.created_at.desc()).first()
#                     if latest_quote:
#                         estimated_value = latest_quote.total_amount or 0
#                 except Exception:
#                     estimated_value = 0
                
#                 project_dict = {
#                     'id': project.id,
#                     'name': project.name,
#                     'description': project.description or '',
#                     'status': project.status,
#                     'created_at': project.created_at.isoformat() if project.created_at else None,
#                     'updated_at': project.updated_at.isoformat() if project.updated_at else None,
#                     'company_id': project.company_id,
#                     'company_name': company.name if company else None,
#                     'user_name': f"{user.first_name} {user.last_name}" if user else 'Unknown',
#                     'estimated_value': float(estimated_value) if estimated_value else 0,
#                     'client_name': getattr(project, 'client_name', ''),
#                     'property_type': getattr(project, 'property_type', 'residential')
#                 }
#                 projects_data.append(project_dict)
                
#             except Exception as e:
#                 current_app.logger.warning(f'Error processing project {project.id}: {e}')
#                 # Add basic project info as fallback
#                 projects_data.append({
#                     'id': project.id,
#                     'name': getattr(project, 'name', 'Unknown Project'),
#                     'status': getattr(project, 'status', 'unknown'),
#                     'created_at': project.created_at.isoformat() if hasattr(project, 'created_at') and project.created_at else None,
#                     'updated_at': project.updated_at.isoformat() if hasattr(project, 'updated_at') and project.updated_at else None,
#                     'company_id': getattr(project, 'company_id', None),
#                     'company_name': company.name if company else 'Unknown Company',
#                     'user_name': 'Unknown User',
#                     'estimated_value': 0,
#                     'client_name': '',
#                     'property_type': 'residential'
#                 })
        
#         return jsonify(projects_data)
        
#     except Exception as e:
#         current_app.logger.error(f'Get all projects admin error: {e}')
#         return jsonify({'error': 'Failed to get projects'}), 500


# @admin_bp.route('/projects/stats', methods=['GET'])
# @jwt_required()
# @require_admin
# def get_admin_project_stats():
#     """Get comprehensive project statistics for admin dashboard"""
#     try:
#         days = request.args.get('days', 30, type=int)
        
#         from datetime import datetime, timedelta
#         start_date = datetime.utcnow() - timedelta(days=days)
        
#         # Basic project counts
#         total_projects = Project.query.count()
#         completed_projects = Project.query.filter_by(status='completed').count()
#         in_progress_projects = Project.query.filter_by(status='in_progress').count()
        
#         # Projects in date range
#         projects_in_period = Project.query.filter(Project.created_at >= start_date).count()
        
#         # Calculate growth
#         previous_period_start = start_date - timedelta(days=days)
#         previous_period_projects = Project.query.filter(
#             Project.created_at >= previous_period_start,
#             Project.created_at < start_date
#         ).count()
        
#         project_growth = 0
#         if previous_period_projects > 0:
#             project_growth = ((projects_in_period - previous_period_projects) / previous_period_projects) * 100
#         elif projects_in_period > 0:
#             project_growth = 100
        
#         # Calculate total value from quotes
#         total_value = 0
#         avg_value = 0
#         try:
#             from models.quote import Quote
#             quotes = db.session.query(Quote.total_amount).join(Project).filter(
#                 Quote.total_amount.isnot(None)
#             ).all()
            
#             if quotes:
#                 total_value = sum(float(quote.total_amount) for quote in quotes if quote.total_amount)
#                 avg_value = total_value / len(quotes) if quotes else 0
#         except Exception as e:
#             current_app.logger.warning(f'Error calculating project values: {e}')
        
#         # Project trends for chart (last 30 days)
#         trends = []
#         for i in range(30):
#             date = datetime.utcnow() - timedelta(days=29-i)
#             date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
#             date_end = date_start + timedelta(days=1)
            
#             daily_projects = Project.query.filter(
#                 Project.created_at >= date_start,
#                 Project.created_at < date_end
#             ).count()
            
#             trends.append({
#                 'date': date.strftime('%Y-%m-%d'),
#                 'projects': daily_projects
#             })
        
#         # Status distribution
#         status_counts = db.session.query(
#             Project.status,
#             db.func.count(Project.id).label('count')
#         ).group_by(Project.status).all()
        
#         status_distribution = []
#         for status, count in status_counts:
#             status_distribution.append({
#                 'name': status.replace('_', ' ').title() if status else 'Unknown',
#                 'value': count
#             })
        
#         # Top performing companies
#         top_companies = db.session.query(
#             Company.name,
#             db.func.count(Project.id).label('project_count')
#         ).join(Project, Company.id == Project.company_id).group_by(
#             Company.id, Company.name
#         ).order_by(db.func.count(Project.id).desc()).limit(5).all()
        
#         top_companies_list = [
#             {'name': name, 'project_count': count}
#             for name, count in top_companies
#         ]
        
#         # Project types distribution
#         project_types = []
#         try:
#             type_counts = db.session.query(
#                 Project.property_type,
#                 db.func.count(Project.id).label('count')
#             ).group_by(Project.property_type).all()
            
#             for prop_type, count in type_counts:
#                 project_types.append({
#                     'name': (prop_type or 'Unknown').title(),
#                     'count': count
#                 })
#         except Exception as e:
#             current_app.logger.warning(f'Error getting project types: {e}')
#             project_types = [{'name': 'Residential', 'count': total_projects}]
        
#         # Recent activity
#         recent_activity = []
#         try:
#             recent_projects = Project.query.order_by(Project.updated_at.desc()).limit(5).all()
#             for project in recent_projects:
#                 recent_activity.append({
#                     'action': f"Project {project.status}",
#                     'project_name': project.name,
#                     'timestamp': project.updated_at.isoformat() if project.updated_at else project.created_at.isoformat()
#                 })
#         except Exception as e:
#             current_app.logger.warning(f'Error getting recent activity: {e}')
        
#         return jsonify({
#             'stats': {
#                 'total_projects': total_projects,
#                 'completed_projects': completed_projects,
#                 'in_progress_projects': in_progress_projects,
#                 'project_growth': round(project_growth, 1),
#                 'total_value': round(total_value, 2),
#                 'avg_value': round(avg_value, 2),
#                 'top_companies': top_companies_list,
#                 'project_types': project_types,
#                 'recent_activity': recent_activity
#             },
#             'trends': trends,
#             'status_distribution': status_distribution
#         })
        
#     except Exception as e:
#         current_app.logger.error(f'Get admin project stats error: {e}')
#         return jsonify({'error': 'Failed to get project statistics'}), 500


# @admin_bp.route('/projects/export', methods=['GET'])
# @jwt_required()
# @require_admin
# def export_projects_admin():
#     """Export projects to CSV"""
#     try:
#         days = request.args.get('days', 30, type=int)
        
#         from datetime import datetime, timedelta
#         start_date = datetime.utcnow() - timedelta(days=days) if days else None
        
#         # Build query
#         query = db.session.query(Project, Company, User).join(
#             Company, Project.company_id == Company.id
#         ).join(
#             User, Project.created_by == User.id, isouter=True
#         )
        
#         if start_date:
#             query = query.filter(Project.created_at >= start_date)
        
#         projects = query.order_by(Project.created_at.desc()).all()
        
#         # Create CSV content
#         output = io.StringIO()
#         writer = csv.writer(output)
        
#         # Write header
#         writer.writerow([
#             'Project ID', 'Project Name', 'Description', 'Client Name',
#             'Company Name', 'Created By', 'Status', 'Property Type',
#             'Estimated Value', 'Created At', 'Updated At'
#         ])
        
#         # Write project data
#         for project, company, user in projects:
#             # Get estimated value from quotes
#             estimated_value = 0
#             try:
#                 from models.quote import Quote
#                 latest_quote = Quote.query.filter_by(project_id=project.id).order_by(Quote.created_at.desc()).first()
#                 if latest_quote and latest_quote.total_amount:
#                     estimated_value = float(latest_quote.total_amount)
#             except Exception:
#                 estimated_value = 0
            
#             writer.writerow([
#                 project.id,
#                 project.name or '',
#                 (project.description or '')[:100] + '...' if project.description and len(project.description) > 100 else project.description or '',
#                 getattr(project, 'client_name', '') or '',
#                 company.name if company else '',
#                 f"{user.first_name} {user.last_name}" if user else '',
#                 project.status or '',
#                 getattr(project, 'property_type', '') or '',
#                 f"€{estimated_value:.2f}" if estimated_value else '€0.00',
#                 project.created_at.strftime('%Y-%m-%d %H:%M:%S') if project.created_at else '',
#                 project.updated_at.strftime('%Y-%m-%d %H:%M:%S') if project.updated_at else ''
#             ])
        
#         output.seek(0)
        
#         return jsonify({
#             'message': 'Export generated successfully',
#             'csv_data': output.getvalue()
#         })
        
#     except Exception as e:
#         current_app.logger.error(f'Export projects error: {e}')
#         return jsonify({'error': 'Failed to export projects'}), 500


# @admin_bp.route('/companies', methods=['GET'])
# @jwt_required()
# @require_admin
# def get_companies_admin():
#     """Get all companies for admin - ENHANCED VERSION FOR FRONTEND"""
#     try:
#         page = request.args.get('page', 1, type=int)
#         per_page = min(request.args.get('per_page', 20, type=int), 100)
#         search = request.args.get('search', '')
#         status_filter = request.args.get('status')
        
#         # Build base query
#         query = Company.query
        
#         # Apply search filter
#         if search:
#             search_pattern = f'%{search}%'
#             query = query.filter(
#                 db.or_(
#                     Company.name.ilike(search_pattern),
#                     Company.email.ilike(search_pattern),
#                     Company.address.ilike(search_pattern),
#                     Company.phone.ilike(search_pattern)
#                 )
#             )
        
#         # Apply status filter
#         if status_filter:
#             if status_filter == 'active':
#                 query = query.join(User).filter(User.is_active == True).distinct()
#             elif status_filter == 'inactive':
#                 active_company_ids = db.session.query(Company.id).join(User).filter(User.is_active == True).distinct()
#                 query = query.filter(~Company.id.in_(active_company_ids))
        
#         # Order and get all companies (not paginated for the dropdown)
#         companies = query.order_by(Company.name.asc()).all()
        
#         # Format response - simplified for dropdown usage
#         companies_data = []
#         for company in companies:
#             try:
#                 companies_data.append({
#                     'id': company.id,
#                     'name': company.name,
#                     'email': company.email or '',
#                     'created_at': company.created_at.isoformat() if hasattr(company, 'created_at') and company.created_at else None
#                 })
#             except Exception as e:
#                 current_app.logger.warning(f'Error processing company {company.id}: {e}')
#                 companies_data.append({
#                     'id': company.id,
#                     'name': getattr(company, 'name', 'Unknown Company'),
#                     'email': '',
#                     'created_at': None
#                 })
        
#         # Return the companies array directly (not wrapped in pagination object)
#         return jsonify(companies_data)
        
#     except Exception as e:
#         current_app.logger.error(f'Get companies admin error: {e}')
#         return jsonify([])  # Return empty array on error


# =====================================================
# FIX EXISTING ROUTES TO HANDLE MISSING FIELDS
# =====================================================

# @admin_bp.route('/projects/<int:project_id>', methods=['GET'])
# @jwt_required()
# @require_admin
# def get_project_admin_detailed(project_id):
#     """Get a specific project with full admin details"""
#     try:
#         project = db.session.query(Project, Company, User).join(
#             Company, Project.company_id == Company.id
#         ).join(
#             User, Project.created_by == User.id, isouter=True
#         ).filter(Project.id == project_id).first()
        
#         if not project:
#             return jsonify({'error': 'Project not found'}), 404
        
#         project_obj, company, user = project
        
#         # Get estimated value from quotes
#         estimated_value = 0
#         try:
#             from models.quote import Quote
#             latest_quote = Quote.query.filter_by(project_id=project_obj.id).order_by(Quote.created_at.desc()).first()
#             if latest_quote and latest_quote.total_amount:
#                 estimated_value = float(latest_quote.total_amount)
#         except Exception:
#             estimated_value = 0
        
#         project_dict = {
#             'id': project_obj.id,
#             'name': project_obj.name,
#             'description': project_obj.description or '',
#             'status': project_obj.status,
#             'created_at': project_obj.created_at.isoformat() if project_obj.created_at else None,
#             'updated_at': project_obj.updated_at.isoformat() if project_obj.updated_at else None,
#             'company_id': project_obj.company_id,
#             'company_name': company.name if company else None,
#             'user_name': f"{user.first_name} {user.last_name}" if user else None,
#             'estimated_value': estimated_value,
#             'client_name': getattr(project_obj, 'client_name', ''),
#             'client_email': getattr(project_obj, 'client_email', ''),
#             'client_phone': getattr(project_obj, 'client_phone', ''),
#             'client_address': getattr(project_obj, 'client_address', ''),
#             'property_type': getattr(project_obj, 'property_type', 'residential'),
#             'project_type': getattr(project_obj, 'project_type', 'interior')
#         }
        
#         return jsonify({'project': project_dict})
        
#     except Exception as e:
#         current_app.logger.error(f'Get project admin detailed error: {e}')
#         return jsonify({'error': 'Failed to get project'}), 500


# @admin_bp.route('/projects/<int:project_id>', methods=['DELETE'])
# @jwt_required()
# @require_admin
# def delete_project_admin(project_id):
#     """Delete a project (admin action) - ENHANCED VERSION"""
#     try:
#         project = Project.query.get(project_id)
#         if not project:
#             return jsonify({'error': 'Project not found'}), 404
        
#         # Delete associated files
#         try:
#             if hasattr(project, 'uploaded_images') and project.uploaded_images:
#                 import os
#                 for image_path in project.uploaded_images:
#                     if os.path.exists(image_path):
#                         os.remove(image_path)
            
#             if hasattr(project, 'generated_files') and project.generated_files:
#                 for file_path in project.generated_files:
#                     if os.path.exists(file_path):
#                         os.remove(file_path)
                        
#             if hasattr(project, 'quote_pdf_path') and project.quote_pdf_path and os.path.exists(project.quote_pdf_path):
#                 os.remove(project.quote_pdf_path)
                
#         except Exception as e:
#             current_app.logger.warning(f'Error deleting project files: {e}')
        
#         # Delete associated quotes
#         try:
#             from models.quote import Quote
#             Quote.query.filter_by(project_id=project_id).delete()
#         except Exception as e:
#             current_app.logger.warning(f'Error deleting project quotes: {e}')
        
#         # Delete the project
#         db.session.delete(project)
#         db.session.commit()
        
#         return jsonify({'message': 'Project deleted successfully'})
        
#     except Exception as e:
#         db.session.rollback()
#         current_app.logger.error(f'Delete project admin error: {e}')
#         return jsonify({'error': 'Failed to delete project'}), 500
    
# Add these routes to your admin_bp.py file - CONFLICT-FREE VERSION

# =====================================================
# ADMIN PROJECT OVERVIEW ROUTES (NEW - NO CONFLICTS)
# =====================================================

@admin_bp.route('/projects-overview', methods=['GET'])
@jwt_required()
@require_admin
def get_projects_overview():
    """Get all projects across all companies for admin overview"""
    try:
        days = request.args.get('days', 30, type=int)
        search = request.args.get('search', '')
        status_filter = request.args.get('status')
        company_filter = request.args.get('company_id', type=int)
        
        # Date filter
        from datetime import datetime, timedelta
        start_date = datetime.utcnow() - timedelta(days=days) if days else None
        
        # Build query with joins to get company and user info
        query = db.session.query(Project, Company, User).join(
            Company, Project.company_id == Company.id
        ).join(
            User, Project.created_by == User.id, isouter=True
        )
        
        # Apply date filter if specified
        if start_date:
            query = query.filter(Project.created_at >= start_date)
        
        # Apply other filters
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    Project.name.ilike(search_pattern),
                    Project.client_name.ilike(search_pattern),
                    Project.description.ilike(search_pattern),
                    Company.name.ilike(search_pattern)
                )
            )
        
        if status_filter:
            query = query.filter(Project.status == status_filter)
        
        if company_filter:
            query = query.filter(Project.company_id == company_filter)
        
        # Order by most recent
        query = query.order_by(Project.created_at.desc())
        
        # Get all projects for the return
        all_results = query.all()
        
        # Format response with enhanced data
        projects_data = []
        for project, company, user in all_results:
            try:
                # Get project value from quote if available
                estimated_value = 0
                try:
                    from models.quote import Quote
                    latest_quote = Quote.query.filter_by(project_id=project.id).order_by(Quote.created_at.desc()).first()
                    if latest_quote:
                        estimated_value = latest_quote.total_amount or 0
                except Exception:
                    estimated_value = 0
                
                project_dict = {
                    'id': project.id,
                    'name': project.name,
                    'description': project.description or '',
                    'status': project.status,
                    'created_at': project.created_at.isoformat() if project.created_at else None,
                    'updated_at': project.updated_at.isoformat() if project.updated_at else None,
                    'company_id': project.company_id,
                    'company_name': company.name if company else None,
                    'user_name': f"{user.first_name} {user.last_name}" if user else 'Unknown',
                    'estimated_value': float(estimated_value) if estimated_value else 0,
                    'client_name': getattr(project, 'client_name', ''),
                    'property_type': getattr(project, 'property_type', 'residential')
                }
                projects_data.append(project_dict)
                
            except Exception as e:
                current_app.logger.warning(f'Error processing project {project.id}: {e}')
                # Add basic project info as fallback
                projects_data.append({
                    'id': project.id,
                    'name': getattr(project, 'name', 'Unknown Project'),
                    'status': getattr(project, 'status', 'unknown'),
                    'created_at': project.created_at.isoformat() if hasattr(project, 'created_at') and project.created_at else None,
                    'updated_at': project.updated_at.isoformat() if hasattr(project, 'updated_at') and project.updated_at else None,
                    'company_id': getattr(project, 'company_id', None),
                    'company_name': company.name if company else 'Unknown Company',
                    'user_name': 'Unknown User',
                    'estimated_value': 0,
                    'client_name': '',
                    'property_type': 'residential'
                })
        
        return jsonify(projects_data)
        
    except Exception as e:
        current_app.logger.error(f'Get projects overview error: {e}')
        return jsonify([])  # Return empty array on error


@admin_bp.route('/projects-overview/stats', methods=['GET'])
@jwt_required()
@require_admin
def get_projects_overview_stats():
    """Get comprehensive project statistics for admin dashboard"""
    try:
        days = request.args.get('days', 30, type=int)
        
        from datetime import datetime, timedelta
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Basic project counts
        total_projects = Project.query.count()
        completed_projects = Project.query.filter_by(status='completed').count()
        in_progress_projects = Project.query.filter_by(status='in_progress').count()
        
        # Projects in date range
        projects_in_period = Project.query.filter(Project.created_at >= start_date).count()
        
        # Calculate growth
        previous_period_start = start_date - timedelta(days=days)
        previous_period_projects = Project.query.filter(
            Project.created_at >= previous_period_start,
            Project.created_at < start_date
        ).count()
        
        project_growth = 0
        if previous_period_projects > 0:
            project_growth = ((projects_in_period - previous_period_projects) / previous_period_projects) * 100
        elif projects_in_period > 0:
            project_growth = 100
        
        # Calculate total value from quotes
        total_value = 0
        avg_value = 0
        try:
            from models.quote import Quote
            quotes = db.session.query(Quote.total_amount).join(Project).filter(
                Quote.total_amount.isnot(None)
            ).all()
            
            if quotes:
                total_value = sum(float(quote.total_amount) for quote in quotes if quote.total_amount)
                avg_value = total_value / len(quotes) if quotes else 0
        except Exception as e:
            current_app.logger.warning(f'Error calculating project values: {e}')
        
        # Project trends for chart (last 30 days)
        trends = []
        for i in range(30):
            date = datetime.utcnow() - timedelta(days=29-i)
            date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            date_end = date_start + timedelta(days=1)
            
            daily_projects = Project.query.filter(
                Project.created_at >= date_start,
                Project.created_at < date_end
            ).count()
            
            trends.append({
                'date': date.strftime('%Y-%m-%d'),
                'projects': daily_projects
            })
        
        # Status distribution
        status_counts = db.session.query(
            Project.status,
            db.func.count(Project.id).label('count')
        ).group_by(Project.status).all()
        
        status_distribution = []
        for status, count in status_counts:
            status_distribution.append({
                'name': status.replace('_', ' ').title() if status else 'Unknown',
                'value': count
            })
        
        # Top performing companies
        top_companies = db.session.query(
            Company.name,
            db.func.count(Project.id).label('project_count')
        ).join(Project, Company.id == Project.company_id).group_by(
            Company.id, Company.name
        ).order_by(db.func.count(Project.id).desc()).limit(5).all()
        
        top_companies_list = [
            {'name': name, 'project_count': count}
            for name, count in top_companies
        ]
        
        # Project types distribution
        project_types = []
        try:
            type_counts = db.session.query(
                Project.property_type,
                db.func.count(Project.id).label('count')
            ).group_by(Project.property_type).all()
            
            for prop_type, count in type_counts:
                project_types.append({
                    'name': (prop_type or 'Unknown').title(),
                    'count': count
                })
        except Exception as e:
            current_app.logger.warning(f'Error getting project types: {e}')
            project_types = [{'name': 'Residential', 'count': total_projects}]
        
        # Recent activity
        recent_activity = []
        try:
            recent_projects = Project.query.order_by(Project.updated_at.desc()).limit(5).all()
            for project in recent_projects:
                recent_activity.append({
                    'action': f"Project {project.status}",
                    'project_name': project.name,
                    'timestamp': project.updated_at.isoformat() if project.updated_at else project.created_at.isoformat()
                })
        except Exception as e:
            current_app.logger.warning(f'Error getting recent activity: {e}')
        
        return jsonify({
            'stats': {
                'total_projects': total_projects,
                'completed_projects': completed_projects,
                'in_progress_projects': in_progress_projects,
                'project_growth': round(project_growth, 1),
                'total_value': round(total_value, 2),
                'avg_value': round(avg_value, 2),
                'top_companies': top_companies_list,
                'project_types': project_types,
                'recent_activity': recent_activity
            },
            'trends': trends,
            'status_distribution': status_distribution
        })
        
    except Exception as e:
        current_app.logger.error(f'Get projects overview stats error: {e}')
        # Return safe empty stats
        return jsonify({
            'stats': {
                'total_projects': 0,
                'completed_projects': 0,
                'in_progress_projects': 0,
                'project_growth': 0,
                'total_value': 0,
                'avg_value': 0,
                'top_companies': [],
                'project_types': [],
                'recent_activity': []
            },
            'trends': [],
            'status_distribution': []
        })


@admin_bp.route('/projects-overview/export', methods=['GET'])
@jwt_required()
@require_admin
def export_projects_overview():
    """Export projects to CSV"""
    try:
        days = request.args.get('days', 30, type=int)
        
        from datetime import datetime, timedelta
        start_date = datetime.utcnow() - timedelta(days=days) if days else None
        
        # Build query
        query = db.session.query(Project, Company, User).join(
            Company, Project.company_id == Company.id
        ).join(
            User, Project.created_by == User.id, isouter=True
        )
        
        if start_date:
            query = query.filter(Project.created_at >= start_date)
        
        projects = query.order_by(Project.created_at.desc()).all()
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Project ID', 'Project Name', 'Description', 'Client Name',
            'Company Name', 'Created By', 'Status', 'Property Type',
            'Estimated Value', 'Created At', 'Updated At'
        ])
        
        # Write project data
        for project, company, user in projects:
            # Get estimated value from quotes
            estimated_value = 0
            try:
                from models.quote import Quote
                latest_quote = Quote.query.filter_by(project_id=project.id).order_by(Quote.created_at.desc()).first()
                if latest_quote and latest_quote.total_amount:
                    estimated_value = float(latest_quote.total_amount)
            except Exception:
                estimated_value = 0
            
            writer.writerow([
                project.id,
                project.name or '',
                (project.description or '')[:100] + '...' if project.description and len(project.description) > 100 else project.description or '',
                getattr(project, 'client_name', '') or '',
                company.name if company else '',
                f"{user.first_name} {user.last_name}" if user else '',
                project.status or '',
                getattr(project, 'property_type', '') or '',
                f"€{estimated_value:.2f}" if estimated_value else '€0.00',
                project.created_at.strftime('%Y-%m-%d %H:%M:%S') if project.created_at else '',
                project.updated_at.strftime('%Y-%m-%d %H:%M:%S') if project.updated_at else ''
            ])
        
        output.seek(0)
        
        return jsonify({
            'message': 'Export generated successfully',
            'csv_data': output.getvalue()
        })
        
    except Exception as e:
        current_app.logger.error(f'Export projects overview error: {e}')
        return jsonify({'error': 'Failed to export projects'}), 500


@admin_bp.route('/companies-list', methods=['GET'])
@jwt_required()
@require_admin
def get_companies_list():
    """Get all companies for dropdowns - simplified version"""
    try:
        search = request.args.get('search', '')
        
        # Build base query
        query = Company.query
        
        # Apply search filter
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    Company.name.ilike(search_pattern),
                    Company.email.ilike(search_pattern)
                )
            )
        
        # Order and get all companies
        companies = query.order_by(Company.name.asc()).all()
        
        # Format response - simplified for dropdown usage
        companies_data = []
        for company in companies:
            try:
                companies_data.append({
                    'id': company.id,
                    'name': company.name,
                    'email': company.email or '',
                    'created_at': company.created_at.isoformat() if hasattr(company, 'created_at') and company.created_at else None
                })
            except Exception as e:
                current_app.logger.warning(f'Error processing company {company.id}: {e}')
                companies_data.append({
                    'id': company.id,
                    'name': getattr(company, 'name', 'Unknown Company'),
                    'email': '',
                    'created_at': None
                })
        
        # Return the companies array directly
        return jsonify(companies_data)
        
    except Exception as e:
        current_app.logger.error(f'Get companies list error: {e}')
        return jsonify([])  # Return empty array on error


# Add these routes to your admin_bp.py file - UNIQUE ADMIN QUOTES ROUTES

# =====================================================
# ADMIN QUOTES MANAGEMENT ROUTES (UNIQUE NAMES)
# =====================================================

@admin_bp.route('/admin-quotes', methods=['GET'])
@jwt_required()
@require_admin
def get_admin_quotes_overview():
    """Get all quotes across all companies for admin overview"""
    try:
        days = request.args.get('days', 30, type=int)
        search = request.args.get('search', '')
        status_filter = request.args.get('status')
        company_filter = request.args.get('company_id', type=int)
        
        # Date filter
        from datetime import datetime, timedelta
        start_date = datetime.utcnow() - timedelta(days=days) if days else None
        
        # Build query with joins to get company, project, and user info
        query = db.session.query(Quote, Project, Company, User).join(
            Project, Quote.project_id == Project.id
        ).join(
            Company, Project.company_id == Company.id
        ).join(
            User, Project.created_by == User.id, isouter=True
        )
        
        # Apply date filter if specified
        if start_date:
            query = query.filter(Quote.created_at >= start_date)
        
        # Apply other filters
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    Quote.title.ilike(search_pattern),
                    Quote.quote_number.ilike(search_pattern),
                    Project.name.ilike(search_pattern),
                    Project.client_name.ilike(search_pattern),
                    Company.name.ilike(search_pattern)
                )
            )
        
        if status_filter:
            query = query.filter(Quote.status == status_filter)
        
        if company_filter:
            query = query.filter(Project.company_id == company_filter)
        
        # Order by most recent
        query = query.order_by(Quote.created_at.desc())
        
        # Get all quotes
        all_results = query.all()
        
        # Format response with enhanced data
        quotes_data = []
        for quote, project, company, user in all_results:
            try:
                quote_dict = {
                    'id': quote.id,
                    'quote_number': quote.quote_number,
                    'title': quote.title,
                    'description': quote.description or '',
                    'status': quote.status,
                    'subtotal': float(quote.subtotal) if quote.subtotal else 0,
                    'vat_amount': float(quote.vat_amount) if quote.vat_amount else 0,
                    'total_amount': float(quote.total_amount) if quote.total_amount else 0,
                    'valid_until': quote.valid_until.isoformat() if quote.valid_until else None,
                    'sent_at': quote.sent_at.isoformat() if quote.sent_at else None,
                    'created_at': quote.created_at.isoformat() if quote.created_at else None,
                    'updated_at': quote.updated_at.isoformat() if quote.updated_at else None,
                    'project_id': project.id,
                    'project_name': project.name,
                    'client_name': getattr(project, 'client_name', ''),
                    'company_id': company.id,
                    'company_name': company.name,
                    'user_name': f"{user.first_name} {user.last_name}" if user else 'Unknown',
                    'line_items_count': len(quote.line_items) if quote.line_items else 0
                }
                quotes_data.append(quote_dict)
                
            except Exception as e:
                current_app.logger.warning(f'Error processing quote {quote.id}: {e}')
                # Add basic quote info as fallback
                quotes_data.append({
                    'id': quote.id,
                    'quote_number': getattr(quote, 'quote_number', 'Unknown'),
                    'title': getattr(quote, 'title', 'Unknown Quote'),
                    'status': getattr(quote, 'status', 'draft'),
                    'total_amount': float(getattr(quote, 'total_amount', 0)),
                    'created_at': quote.created_at.isoformat() if hasattr(quote, 'created_at') and quote.created_at else None,
                    'project_name': project.name if project else 'Unknown Project',
                    'company_name': company.name if company else 'Unknown Company',
                    'user_name': 'Unknown User',
                    'line_items_count': 0
                })
        
        return jsonify(quotes_data)
        
    except Exception as e:
        current_app.logger.error(f'Get admin quotes overview error: {e}')
        return jsonify([])  # Return empty array on error


@admin_bp.route('/admin-quotes/stats', methods=['GET'])
@jwt_required()
@require_admin
def get_admin_quotes_stats():
    """Get comprehensive quote statistics for admin dashboard"""
    try:
        days = request.args.get('days', 30, type=int)
        
        from datetime import datetime, timedelta
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Basic quote counts
        total_quotes = Quote.query.count()
        draft_quotes = Quote.query.filter_by(status='draft').count()
        sent_quotes = Quote.query.filter_by(status='sent').count()
        accepted_quotes = Quote.query.filter_by(status='accepted').count()
        rejected_quotes = Quote.query.filter_by(status='rejected').count()
        
        # Quotes in date range
        quotes_in_period = Quote.query.filter(Quote.created_at >= start_date).count()
        
        # Calculate growth
        previous_period_start = start_date - timedelta(days=days)
        previous_period_quotes = Quote.query.filter(
            Quote.created_at >= previous_period_start,
            Quote.created_at < start_date
        ).count()
        
        quote_growth = 0
        if previous_period_quotes > 0:
            quote_growth = ((quotes_in_period - previous_period_quotes) / previous_period_quotes) * 100
        elif quotes_in_period > 0:
            quote_growth = 100
        
        # Calculate total values
        total_value = 0
        avg_value = 0
        accepted_value = 0
        
        try:
            # All quotes value
            all_quotes = Quote.query.filter(Quote.total_amount.isnot(None)).all()
            if all_quotes:
                total_value = sum(float(quote.total_amount) for quote in all_quotes if quote.total_amount)
                avg_value = total_value / len(all_quotes) if all_quotes else 0
            
            # Accepted quotes value
            accepted_quotes_objs = Quote.query.filter(
                Quote.status == 'accepted',
                Quote.total_amount.isnot(None)
            ).all()
            if accepted_quotes_objs:
                accepted_value = sum(float(quote.total_amount) for quote in accepted_quotes_objs if quote.total_amount)
                
        except Exception as e:
            current_app.logger.warning(f'Error calculating quote values: {e}')
        
        # Conversion rate
        conversion_rate = 0
        if sent_quotes > 0:
            conversion_rate = (accepted_quotes / sent_quotes) * 100
        
        # Quote trends for chart (last 30 days)
        trends = []
        for i in range(30):
            date = datetime.utcnow() - timedelta(days=29-i)
            date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            date_end = date_start + timedelta(days=1)
            
            daily_quotes = Quote.query.filter(
                Quote.created_at >= date_start,
                Quote.created_at < date_end
            ).count()
            
            daily_value = 0
            daily_quotes_objs = Quote.query.filter(
                Quote.created_at >= date_start,
                Quote.created_at < date_end,
                Quote.total_amount.isnot(None)
            ).all()
            
            if daily_quotes_objs:
                daily_value = sum(float(q.total_amount) for q in daily_quotes_objs if q.total_amount)
            
            trends.append({
                'date': date.strftime('%Y-%m-%d'),
                'quotes': daily_quotes,
                'value': round(daily_value, 2)
            })
        
        # Status distribution
        status_counts = db.session.query(
            Quote.status,
            db.func.count(Quote.id).label('count')
        ).group_by(Quote.status).all()
        
        status_distribution = []
        for status, count in status_counts:
            status_distribution.append({
                'name': status.replace('_', ' ').title() if status else 'Unknown',
                'value': count
            })
        
        # Top performing companies by quote value
        top_companies = db.session.query(
            Company.name,
            db.func.count(Quote.id).label('quote_count'),
            db.func.sum(Quote.total_amount).label('total_value')
        ).join(Project, Company.id == Project.company_id).join(
            Quote, Project.id == Quote.project_id
        ).filter(
            Quote.total_amount.isnot(None)
        ).group_by(
            Company.id, Company.name
        ).order_by(db.func.sum(Quote.total_amount).desc()).limit(5).all()
        
        top_companies_list = [
            {
                'name': name, 
                'quote_count': count,
                'total_value': round(float(total_val) if total_val else 0, 2)
            }
            for name, count, total_val in top_companies
        ]
        
        # Recent activity
        recent_activity = []
        try:
            recent_quotes = Quote.query.order_by(Quote.updated_at.desc()).limit(5).all()
            for quote in recent_quotes:
                project = Project.query.get(quote.project_id)
                recent_activity.append({
                    'action': f"Quote {quote.status}",
                    'quote_title': quote.title,
                    'project_name': project.name if project else 'Unknown Project',
                    'timestamp': quote.updated_at.isoformat() if quote.updated_at else quote.created_at.isoformat()
                })
        except Exception as e:
            current_app.logger.warning(f'Error getting recent activity: {e}')
        
        # Average quote value by month (last 6 months)
        monthly_averages = []
        for i in range(6):
            month_start = (datetime.utcnow() - timedelta(days=30*i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
            
            month_quotes = Quote.query.filter(
                Quote.created_at >= month_start,
                Quote.created_at <= month_end,
                Quote.total_amount.isnot(None)
            ).all()
            
            month_avg = 0
            if month_quotes:
                month_total = sum(float(q.total_amount) for q in month_quotes if q.total_amount)
                month_avg = month_total / len(month_quotes)
            
            monthly_averages.insert(0, {
                'month': month_start.strftime('%Y-%m'),
                'average_value': round(month_avg, 2),
                'quote_count': len(month_quotes)
            })
        
        return jsonify({
            'stats': {
                'total_quotes': total_quotes,
                'draft_quotes': draft_quotes,
                'sent_quotes': sent_quotes,
                'accepted_quotes': accepted_quotes,
                'rejected_quotes': rejected_quotes,
                'quote_growth': round(quote_growth, 1),
                'total_value': round(total_value, 2),
                'avg_value': round(avg_value, 2),
                'accepted_value': round(accepted_value, 2),
                'conversion_rate': round(conversion_rate, 2),
                'top_companies': top_companies_list,
                'recent_activity': recent_activity
            },
            'trends': trends,
            'status_distribution': status_distribution,
            'monthly_averages': monthly_averages
        })
        
    except Exception as e:
        current_app.logger.error(f'Get admin quotes stats error: {e}')
        # Return safe empty stats
        return jsonify({
            'stats': {
                'total_quotes': 0,
                'draft_quotes': 0,
                'sent_quotes': 0,
                'accepted_quotes': 0,
                'rejected_quotes': 0,
                'quote_growth': 0,
                'total_value': 0,
                'avg_value': 0,
                'accepted_value': 0,
                'conversion_rate': 0,
                'top_companies': [],
                'recent_activity': []
            },
            'trends': [],
            'status_distribution': [],
            'monthly_averages': []
        })


@admin_bp.route('/admin-quotes/export', methods=['GET'])
@jwt_required()
@require_admin
def export_admin_quotes():
    """Export quotes to CSV"""
    try:
        days = request.args.get('days', 30, type=int)
        
        from datetime import datetime, timedelta
        start_date = datetime.utcnow() - timedelta(days=days) if days else None
        
        # Build query
        query = db.session.query(Quote, Project, Company, User).join(
            Project, Quote.project_id == Project.id
        ).join(
            Company, Project.company_id == Company.id
        ).join(
            User, Project.created_by == User.id, isouter=True
        )
        
        if start_date:
            query = query.filter(Quote.created_at >= start_date)
        
        quotes = query.order_by(Quote.created_at.desc()).all()
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Quote ID', 'Quote Number', 'Title', 'Status', 'Project Name',
            'Client Name', 'Company Name', 'Created By', 'Subtotal', 'VAT Amount',
            'Total Amount', 'Valid Until', 'Sent At', 'Created At', 'Updated At'
        ])
        
        # Write quote data
        for quote, project, company, user in quotes:
            writer.writerow([
                quote.id,
                quote.quote_number or '',
                quote.title or '',
                quote.status or '',
                project.name or '',
                getattr(project, 'client_name', '') or '',
                company.name if company else '',
                f"{user.first_name} {user.last_name}" if user else '',
                f"€{quote.subtotal:.2f}" if quote.subtotal else '€0.00',
                f"€{quote.vat_amount:.2f}" if quote.vat_amount else '€0.00',
                f"€{quote.total_amount:.2f}" if quote.total_amount else '€0.00',
                quote.valid_until.strftime('%Y-%m-%d') if quote.valid_until else '',
                quote.sent_at.strftime('%Y-%m-%d %H:%M:%S') if quote.sent_at else '',
                quote.created_at.strftime('%Y-%m-%d %H:%M:%S') if quote.created_at else '',
                quote.updated_at.strftime('%Y-%m-%d %H:%M:%S') if quote.updated_at else ''
            ])
        
        output.seek(0)
        
        return jsonify({
            'message': 'Export generated successfully',
            'csv_data': output.getvalue()
        })
        
    except Exception as e:
        current_app.logger.error(f'Export admin quotes error: {e}')
        return jsonify({'error': 'Failed to export quotes'}), 500


@admin_bp.route('/admin-quotes/<int:quote_id>', methods=['GET'])
@jwt_required()
@require_admin
def get_admin_quote_details(quote_id):
    """Get a specific quote with full admin details"""
    try:
        quote_data = db.session.query(Quote, Project, Company, User).join(
            Project, Quote.project_id == Project.id
        ).join(
            Company, Project.company_id == Company.id
        ).join(
            User, Project.created_by == User.id, isouter=True
        ).filter(Quote.id == quote_id).first()
        
        if not quote_data:
            return jsonify({'error': 'Quote not found'}), 404
        
        quote, project, company, user = quote_data
        
        quote_dict = {
            'id': quote.id,
            'quote_number': quote.quote_number,
            'title': quote.title,
            'description': quote.description or '',
            'status': quote.status,
            'subtotal': float(quote.subtotal) if quote.subtotal else 0,
            'vat_amount': float(quote.vat_amount) if quote.vat_amount else 0,
            'total_amount': float(quote.total_amount) if quote.total_amount else 0,
            'line_items': quote.line_items or [],
            'valid_until': quote.valid_until.isoformat() if quote.valid_until else None,
            'sent_at': quote.sent_at.isoformat() if quote.sent_at else None,
            'created_at': quote.created_at.isoformat() if quote.created_at else None,
            'updated_at': quote.updated_at.isoformat() if quote.updated_at else None,
            'project': {
                'id': project.id,
                'name': project.name,
                'client_name': getattr(project, 'client_name', ''),
                'client_email': getattr(project, 'client_email', ''),
                'client_phone': getattr(project, 'client_phone', ''),
                'client_address': getattr(project, 'client_address', '')
            },
            'company': {
                'id': company.id,
                'name': company.name,
                'email': company.email,
                'phone': getattr(company, 'phone', ''),
                'address': getattr(company, 'address', '')
            },
            'user': {
                'id': user.id if user else None,
                'name': f"{user.first_name} {user.last_name}" if user else 'Unknown',
                'email': user.email if user else ''
            }
        }
        
        return jsonify({'quote': quote_dict})
        
    except Exception as e:
        current_app.logger.error(f'Get admin quote details error: {e}')
        return jsonify({'error': 'Failed to get quote'}), 500


@admin_bp.route('/admin-quotes/<int:quote_id>', methods=['DELETE'])
@jwt_required()
@require_admin
def delete_admin_quote(quote_id):
    """Delete a quote (admin action)"""
    try:
        quote = Quote.query.get(quote_id)
        if not quote:
            return jsonify({'error': 'Quote not found'}), 404
        
        quote_number = quote.quote_number
        quote_title = quote.title
        
        # Delete associated PDF file if it exists
        try:
            if quote.pdf_path and os.path.exists(quote.pdf_path):
                os.remove(quote.pdf_path)
        except Exception as e:
            current_app.logger.warning(f'Error deleting quote PDF: {e}')
        
        # Delete the quote
        db.session.delete(quote)
        db.session.commit()
        
        return jsonify({
            'message': f'Quote "{quote_number}" ({quote_title}) deleted successfully',
            'quote_id': quote_id
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Delete admin quote error: {e}')
        return jsonify({'error': 'Failed to delete quote'}), 500


@admin_bp.route('/admin-quotes/<int:quote_id>/status', methods=['PUT'])
@jwt_required()
@require_admin
def update_admin_quote_status(quote_id):
    """Update quote status (admin action)"""
    try:
        quote = Quote.query.get(quote_id)
        if not quote:
            return jsonify({'error': 'Quote not found'}), 404
        
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'error': 'Status is required'}), 400
        
        valid_statuses = ['draft', 'sent', 'accepted', 'rejected', 'expired']
        if new_status not in valid_statuses:
            return jsonify({'error': 'Invalid status'}), 400
        
        old_status = quote.status
        quote.status = new_status
        quote.updated_at = datetime.utcnow()
        
        # Update sent_at if status is being set to sent
        if new_status == 'sent' and old_status != 'sent':
            quote.sent_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'Quote status updated from {old_status} to {new_status}',
            'old_status': old_status,
            'new_status': new_status,
            'quote_id': quote_id
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Update admin quote status error: {e}')
        return jsonify({'error': 'Failed to update quote status'}), 500


# =====================================================
# BULK OPERATIONS FOR QUOTES
# =====================================================

@admin_bp.route('/bulk/update-quote-status', methods=['POST'])
@jwt_required()
@require_admin
def bulk_update_quote_status():
    """Bulk update quote statuses"""
    try:
        data = request.get_json()
        quote_ids = data.get('quote_ids', [])
        new_status = data.get('status')
        
        if not quote_ids:
            return jsonify({'error': 'No quote IDs provided'}), 400
        
        if not new_status:
            return jsonify({'error': 'Status is required'}), 400
        
        valid_statuses = ['draft', 'sent', 'accepted', 'rejected', 'expired']
        if new_status not in valid_statuses:
            return jsonify({'error': 'Invalid status'}), 400
        
        quotes = Quote.query.filter(Quote.id.in_(quote_ids)).all()
        updated_count = 0
        
        for quote in quotes:
            old_status = quote.status
            quote.status = new_status
            quote.updated_at = datetime.utcnow()
            
            # Update sent_at if status is being set to sent
            if new_status == 'sent' and old_status != 'sent':
                quote.sent_at = datetime.utcnow()
            
            updated_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully updated {updated_count} quotes to {new_status}',
            'updated_count': updated_count,
            'new_status': new_status
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Bulk update quote status error: {e}')
        return jsonify({'error': 'Failed to update quote statuses'}), 500


@admin_bp.route('/bulk/delete-quotes', methods=['POST'])
@jwt_required()
@require_admin
def bulk_delete_quotes():
    """Bulk delete quotes"""
    try:
        data = request.get_json()
        quote_ids = data.get('quote_ids', [])
        
        if not quote_ids:
            return jsonify({'error': 'No quote IDs provided'}), 400
        
        quotes = Quote.query.filter(Quote.id.in_(quote_ids)).all()
        deleted_count = 0
        
        for quote in quotes:
            # Delete associated PDF file if it exists
            try:
                if quote.pdf_path and os.path.exists(quote.pdf_path):
                    os.remove(quote.pdf_path)
            except Exception as e:
                current_app.logger.warning(f'Error deleting quote PDF: {e}')
            
            db.session.delete(quote)
            deleted_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully deleted {deleted_count} quotes',
            'deleted_count': deleted_count
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Bulk delete quotes error: {e}')
        return jsonify({'error': 'Failed to delete quotes'}), 500






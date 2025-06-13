from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from models import db
from models.user import User
from models.company import Company
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

@admin_bp.route('/companies', methods=['GET'])
@jwt_required()
@require_admin
def get_companies():
    """Get all companies with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        companies_paginated = Company.query.order_by(Company.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        companies_data = []
        for company in companies_paginated.items:
            company_dict = company.to_dict()
            company_dict['subscription'] = company.subscription.to_dict() if company.subscription else None
            company_dict['user_count'] = len(company.users)
            company_dict['project_count'] = company.projects.count()
            companies_data.append(company_dict)
        
        return jsonify({
            'companies': companies_data,
            'pagination': {
                'page': page,
                'pages': companies_paginated.pages,
                'per_page': per_page,
                'total': companies_paginated.total
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Get companies error: {e}')
        return jsonify({'error': 'Failed to get companies'}), 500

@admin_bp.route('/companies/<int:company_id>/toggle-status', methods=['POST'])
@jwt_required()
@require_admin
def toggle_company_status(company_id):
    """Toggle company active status"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Toggle all users in the company
        for user in company.users:
            user.is_active = not user.is_active
        
        db.session.commit()
        
        return jsonify({
            'message': f'Company status {"activated" if company.users[0].is_active else "deactivated"}',
            'company': company.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Toggle company status error: {e}')
        return jsonify({'error': 'Failed to toggle company status'}), 500
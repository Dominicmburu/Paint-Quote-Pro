from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from models.user import User
from models.subscription import Subscription

def require_admin(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role not in ['admin', 'super_admin']:
            return jsonify({'error': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

def require_active_subscription(f):
    """Decorator to require active subscription"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404
        
        subscription = user.company.subscription
        if not subscription or not subscription.is_active:
            return jsonify({
                'error': 'Active subscription required',
                'subscription_status': subscription.status if subscription else 'none'
            }), 403
        
        return f(*args, **kwargs)
    return decorated_function
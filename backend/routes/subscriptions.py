import os
import stripe
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta

from models import db
from models.user import User
from models.company import Company
from models.subscription import Subscription
from utils.decorators import require_active_subscription

subscriptions_bp = Blueprint('subscriptions', __name__)

# Initialize Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

@subscriptions_bp.route('/current', methods=['GET'])
@jwt_required()
def get_current_subscription():
    """Get current subscription details"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404
        
        subscription = user.company.subscription
        
        if not subscription:
            return jsonify({'error': 'No subscription found'}), 404
        
        return jsonify({
            'subscription': subscription.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f'Get subscription error: {e}')
        return jsonify({'error': 'Failed to get subscription'}), 500

@subscriptions_bp.route('/plans', methods=['GET'])
def get_subscription_plans():
    """Get available subscription plans"""
    return jsonify({
        'plans': current_app.config['SUBSCRIPTION_PLANS']
    })

@subscriptions_bp.route('/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    """Create Stripe checkout session for subscription"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404
        
        data = request.get_json()
        plan_name = data.get('plan_name')
        billing_cycle = data.get('billing_cycle', 'monthly')
        
        if plan_name not in current_app.config['SUBSCRIPTION_PLANS']:
            return jsonify({'error': 'Invalid plan'}), 400
        
        plan = current_app.config['SUBSCRIPTION_PLANS'][plan_name]
        price_id = plan[f'stripe_price_id_{billing_cycle}']
        
        if not price_id:
            return jsonify({'error': 'Price ID not configured'}), 400
        
        # Create or get Stripe customer
        subscription = user.company.subscription
        if subscription and subscription.stripe_customer_id:
            customer_id = subscription.stripe_customer_id
        else:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.company.name,
                metadata={'company_id': user.company_id}
            )
            customer_id = customer.id
            
            if subscription:
                subscription.stripe_customer_id = customer_id
                db.session.commit()
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=request.host_url + 'dashboard?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=request.host_url + 'subscription',
            metadata={
                'company_id': user.company_id,
                'plan_name': plan_name,
                'billing_cycle': billing_cycle
            }
        )
        
        return jsonify({
            'checkout_url': checkout_session.url
        })
        
    except Exception as e:
        current_app.logger.error(f'Create checkout session error: {e}')
        return jsonify({'error': 'Failed to create checkout session'}), 500

@subscriptions_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks"""
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = current_app.config['STRIPE_WEBHOOK_SECRET']
    
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({'error': 'Invalid signature'}), 400
    
    try:
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            handle_successful_payment(session)
        
        elif event['type'] == 'invoice.payment_succeeded':
            invoice = event['data']['object']
            handle_successful_renewal(invoice)
        
        elif event['type'] == 'invoice.payment_failed':
            invoice = event['data']['object']
            handle_failed_payment(invoice)
        
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            handle_subscription_cancelled(subscription)
        
        return jsonify({'status': 'success'})
        
    except Exception as e:
        current_app.logger.error(f'Webhook error: {e}')
        return jsonify({'error': 'Webhook processing failed'}), 500

def handle_successful_payment(session):
    """Handle successful payment from checkout"""
    company_id = session['metadata']['company_id']
    plan_name = session['metadata']['plan_name']
    billing_cycle = session['metadata']['billing_cycle']
    
    company = Company.query.get(company_id)
    if not company:
        return
    
    subscription = company.subscription
    if not subscription:
        subscription = Subscription(company_id=company_id)
        db.session.add(subscription)
    
    # Get plan details
    plan = current_app.config['SUBSCRIPTION_PLANS'][plan_name]
    
    # Update subscription
    subscription.stripe_customer_id = session['customer']
    subscription.stripe_subscription_id = session['subscription']
    subscription.plan_name = plan_name
    subscription.billing_cycle = billing_cycle
    subscription.status = 'active'
    subscription.max_projects = plan['max_projects']
    subscription.max_users = plan['max_users']
    subscription.current_period_start = datetime.utcnow()
    
    if billing_cycle == 'yearly':
        subscription.current_period_end = datetime.utcnow() + timedelta(days=365)
    else:
        subscription.current_period_end = datetime.utcnow() + timedelta(days=30)
    
    db.session.commit()

def handle_successful_renewal(invoice):
    """Handle successful subscription renewal"""
    customer_id = invoice['customer']
    subscription = Subscription.query.filter_by(stripe_customer_id=customer_id).first()
    
    if subscription:
        subscription.status = 'active'
        subscription.current_period_start = datetime.utcfromtimestamp(invoice['period_start'])
        subscription.current_period_end = datetime.utcfromtimestamp(invoice['period_end'])
        subscription.projects_used_this_month = 0  # Reset usage
        db.session.commit()

def handle_failed_payment(invoice):
    """Handle failed payment"""
    customer_id = invoice['customer']
    subscription = Subscription.query.filter_by(stripe_customer_id=customer_id).first()
    
    if subscription:
        subscription.status = 'past_due'
        db.session.commit()

def handle_subscription_cancelled(stripe_subscription):
    """Handle subscription cancellation"""
    subscription = Subscription.query.filter_by(
        stripe_subscription_id=stripe_subscription['id']
    ).first()
    
    if subscription:
        subscription.status = 'cancelled'
        subscription.cancelled_at = datetime.utcnow()
        db.session.commit()
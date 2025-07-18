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
from services.email_service import send_payment_success_email, send_payment_failed_email, send_subscription_cancelled_email


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
            # Create a default trial subscription
            from datetime import datetime, timedelta
            subscription = Subscription(
                company_id=user.company_id,
                plan_name='starter',
                billing_cycle='monthly',
                status='trial',
                current_period_start=datetime.utcnow(),
                current_period_end=datetime.utcnow() + timedelta(days=7),
                trial_end=datetime.utcnow() + timedelta(days=7)
            )
            db.session.add(subscription)
            db.session.commit()
        
        return jsonify({
            'subscription': subscription.to_dict(),
            'company': user.company.to_dict()
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
        
        # Get frontend URL from environment
        frontend_url = os.environ.get('FRONTEND_URL').rstrip('/')
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f'{frontend_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{frontend_url}/payment/cancelled',
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


# Add this new endpoint to your subscriptions.py

@subscriptions_bp.route('/session/<session_id>', methods=['GET'])
@jwt_required()
def get_session_details(session_id):
    """Get Stripe checkout session details"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404
        
        # Retrieve session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Verify session belongs to this user's company
        if session.metadata.get('company_id') != str(user.company_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get subscription details
        subscription = user.company.subscription
        if not subscription:
            return jsonify({'error': 'Subscription not found'}), 404
        
        # Calculate next billing date
        next_billing_date = subscription.current_period_end.strftime('%Y-%m-%d') if subscription.current_period_end else None
        
        return jsonify({
            'session_id': session_id,
            'plan_name': session.metadata.get('plan_name'),
            'billing_cycle': session.metadata.get('billing_cycle'),
            'amount': session.amount_total / 100 if session.amount_total else 0,  # Convert from cents
            'currency': session.currency or 'gbp',
            'customer_email': user.email,
            'next_billing_date': next_billing_date,
            'company_name': user.company.name,
            'subscription_status': subscription.status
        })
        
    except stripe.error.StripeError as e:
        current_app.logger.error(f'Stripe error retrieving session: {e}')
        return jsonify({'error': 'Failed to retrieve session details'}), 500
    except Exception as e:
        current_app.logger.error(f'Error retrieving session details: {e}')
        return jsonify({'error': 'Failed to get session details'}), 500

# def handle_successful_payment(session):
#     """Handle successful payment from checkout"""
#     company_id = session['metadata']['company_id']
#     plan_name = session['metadata']['plan_name']
#     billing_cycle = session['metadata']['billing_cycle']
    
#     company = Company.query.get(company_id)
#     if not company:
#         return
    
#     subscription = company.subscription
#     if not subscription:
#         subscription = Subscription(company_id=company_id)
#         db.session.add(subscription)
    
#     # Get plan details
#     plan = current_app.config['SUBSCRIPTION_PLANS'][plan_name]
    
#     # Update subscription
#     subscription.stripe_customer_id = session['customer']
#     subscription.stripe_subscription_id = session['subscription']
#     subscription.plan_name = plan_name
#     subscription.billing_cycle = billing_cycle
#     subscription.status = 'active'
#     subscription.max_projects = plan['max_projects']
#     subscription.max_users = plan['max_users']
#     subscription.current_period_start = datetime.utcnow()
    
#     if billing_cycle == 'yearly':
#         subscription.current_period_end = datetime.utcnow() + timedelta(days=365)
#     else:
#         subscription.current_period_end = datetime.utcnow() + timedelta(days=30)
    
#     db.session.commit()


# def handle_successful_renewal(invoice):
#     """Handle successful subscription renewal"""
#     customer_id = invoice['customer']
#     subscription = Subscription.query.filter_by(stripe_customer_id=customer_id).first()
    
#     if subscription:
#         subscription.status = 'active'
#         subscription.current_period_start = datetime.utcfromtimestamp(invoice['period_start'])
#         subscription.current_period_end = datetime.utcfromtimestamp(invoice['period_end'])
#         subscription.projects_used_this_month = 0  # Reset usage
#         db.session.commit()

# def handle_failed_payment(invoice):
#     """Handle failed payment"""
#     customer_id = invoice['customer']
#     subscription = Subscription.query.filter_by(stripe_customer_id=customer_id).first()
    
#     if subscription:
#         subscription.status = 'past_due'
#         db.session.commit()

# def handle_subscription_cancelled(stripe_subscription):
#     """Handle subscription cancellation"""
#     subscription = Subscription.query.filter_by(
#         stripe_subscription_id=stripe_subscription['id']
#     ).first()
    
#     if subscription:
#         subscription.status = 'cancelled'
#         subscription.cancelled_at = datetime.utcnow()
#         db.session.commit()



def handle_successful_payment(session):
    """Handle successful payment from checkout"""
    try:
        company_id = session['metadata'].get('company_id')
        plan_name = session['metadata'].get('plan_name')
        billing_cycle = session['metadata'].get('billing_cycle', 'monthly')
        
        if not company_id or not plan_name:
            current_app.logger.error(f'Missing metadata in checkout session: {session["id"]}')
            return
        
        company = Company.query.get(company_id)
        if not company:
            current_app.logger.error(f'Company not found: {company_id}')
            return
        
        # Get plan details
        if plan_name not in current_app.config['SUBSCRIPTION_PLANS']:
            current_app.logger.error(f'Invalid plan name: {plan_name}')
            return
            
        plan = current_app.config['SUBSCRIPTION_PLANS'][plan_name]
        
        subscription = company.subscription
        if not subscription:
            subscription = Subscription(company_id=company_id)
            db.session.add(subscription)
        
        # Update subscription with new details
        subscription.stripe_customer_id = session.get('customer')
        subscription.stripe_subscription_id = session.get('subscription')
        subscription.plan_name = plan_name
        subscription.billing_cycle = billing_cycle
        subscription.status = 'active'
        subscription.max_projects = plan.get('max_projects', 5)
        subscription.max_users = plan.get('max_users', 1)
        subscription.current_period_start = datetime.utcnow()
        
        # Clear trial status
        subscription.trial_end = None
        
        # Set period end based on billing cycle
        if billing_cycle == 'yearly':
            subscription.current_period_end = datetime.utcnow() + timedelta(days=365)
        else:
            subscription.current_period_end = datetime.utcnow() + timedelta(days=30)
        
        # Reset usage counters
        subscription.projects_used_this_month = 0
        
        db.session.commit()
        
        # Send success email
        try:
            # Get the primary user for this company
            primary_user = User.query.filter_by(company_id=company_id).first()
            if primary_user:
                amount = (session.get('amount_total', 0) / 100) if session.get('amount_total') else plan.get('price', 0)
                send_payment_success_email(
                    email=primary_user.email,
                    first_name=primary_user.first_name,
                    company_name=company.name,
                    plan_name=plan_name,
                    billing_cycle=billing_cycle,
                    amount=amount
                )
        except Exception as email_error:
            current_app.logger.error(f'Failed to send payment success email: {email_error}')
            # Don't fail the payment processing if email fails
        
        current_app.logger.info(f'Successfully processed payment for company {company_id}, plan {plan_name}')
        
    except Exception as e:
        current_app.logger.error(f'Error handling successful payment: {e}')
        db.session.rollback()


def handle_successful_renewal(invoice):
    """Handle successful subscription renewal"""
    try:
        customer_id = invoice.get('customer')
        subscription_id = invoice.get('subscription')
        
        if not customer_id:
            current_app.logger.error(f'Missing customer ID in invoice: {invoice.get("id")}')
            return
        
        subscription = Subscription.query.filter_by(stripe_customer_id=customer_id).first()
        
        if not subscription:
            current_app.logger.error(f'Subscription not found for customer: {customer_id}')
            return
        
        # Update subscription status and period
        subscription.status = 'active'
        subscription.current_period_start = datetime.utcfromtimestamp(invoice.get('period_start', 0))
        subscription.current_period_end = datetime.utcfromtimestamp(invoice.get('period_end', 0))
        
        # Reset monthly usage counters
        subscription.projects_used_this_month = 0
        
        # Clear any past due status
        subscription.past_due_notified = False
        
        db.session.commit()
        current_app.logger.info(f'Successfully processed renewal for subscription {subscription.id}')
        
    except Exception as e:
        current_app.logger.error(f'Error handling successful renewal: {e}')
        db.session.rollback()


def handle_failed_payment(invoice):
    """Handle failed payment"""
    try:
        customer_id = invoice.get('customer')
        attempt_count = invoice.get('attempt_count', 1)
        
        if not customer_id:
            current_app.logger.error(f'Missing customer ID in failed payment invoice: {invoice.get("id")}')
            return
        
        subscription = Subscription.query.filter_by(stripe_customer_id=customer_id).first()
        
        if not subscription:
            current_app.logger.error(f'Subscription not found for customer: {customer_id}')
            return
        
        # Update subscription status
        subscription.status = 'past_due'
        subscription.failed_payment_count = attempt_count
        subscription.last_payment_failure = datetime.utcnow()
        
        # If this is the final attempt, mark as cancelled
        if attempt_count >= 4:  # Stripe typically tries 4 times
            subscription.status = 'cancelled'
            subscription.cancelled_at = datetime.utcnow()
            subscription.cancellation_reason = 'payment_failed'
        
        db.session.commit()
        
        # Send payment failed email
        try:
            company = Company.query.get(subscription.company_id)
            primary_user = User.query.filter_by(company_id=subscription.company_id).first()
            if primary_user and company:
                send_payment_failed_email(
                    email=primary_user.email,
                    first_name=primary_user.first_name,
                    company_name=company.name,
                    plan_name=subscription.plan_name,
                    attempt_count=attempt_count
                )
        except Exception as email_error:
            current_app.logger.error(f'Failed to send payment failed email: {email_error}')
        
        current_app.logger.warning(f'Payment failed for subscription {subscription.id}, attempt {attempt_count}')
        
    except Exception as e:
        current_app.logger.error(f'Error handling failed payment: {e}')
        db.session.rollback()


def handle_subscription_cancelled(stripe_subscription):
    """Handle subscription cancellation"""
    try:
        subscription_id = stripe_subscription.get('id')
        cancel_reason = stripe_subscription.get('cancellation_details', {}).get('reason', 'user_cancelled')
        
        if not subscription_id:
            current_app.logger.error('Missing subscription ID in cancellation event')
            return
        
        subscription = Subscription.query.filter_by(
            stripe_subscription_id=subscription_id
        ).first()
        
        if not subscription:
            current_app.logger.error(f'Subscription not found for Stripe subscription: {subscription_id}')
            return
        
        # Update subscription status
        subscription.status = 'cancelled'
        subscription.cancelled_at = datetime.utcnow()
        subscription.cancellation_reason = cancel_reason
        
        # Set end of service period (allow access until period end)
        cancel_at_period_end = stripe_subscription.get('cancel_at_period_end', False)
        if cancel_at_period_end:
            subscription.status = 'active'  # Keep active until period ends
            subscription.will_cancel_at_period_end = True
        
        db.session.commit()
        
        # Send cancellation email
        try:
            company = Company.query.get(subscription.company_id)
            primary_user = User.query.filter_by(company_id=subscription.company_id).first()
            if primary_user and company:
                send_subscription_cancelled_email(
                    email=primary_user.email,
                    first_name=primary_user.first_name,
                    company_name=company.name,
                    cancellation_reason=cancel_reason
                )
        except Exception as email_error:
            current_app.logger.error(f'Failed to send subscription cancelled email: {email_error}')
        
        current_app.logger.info(f'Successfully processed cancellation for subscription {subscription.id}')
        
    except Exception as e:
        current_app.logger.error(f'Error handling subscription cancellation: {e}')
        db.session.rollback()
    """Handle subscription cancellation"""
    try:
        subscription_id = stripe_subscription.get('id')
        cancel_reason = stripe_subscription.get('cancellation_details', {}).get('reason', 'user_cancelled')
        
        if not subscription_id:
            current_app.logger.error('Missing subscription ID in cancellation event')
            return
        
        subscription = Subscription.query.filter_by(
            stripe_subscription_id=subscription_id
        ).first()
        
        if not subscription:
            current_app.logger.error(f'Subscription not found for Stripe subscription: {subscription_id}')
            return
        
        # Update subscription status
        subscription.status = 'cancelled'
        subscription.cancelled_at = datetime.utcnow()
        subscription.cancellation_reason = cancel_reason
        
        # Set end of service period (allow access until period end)
        cancel_at_period_end = stripe_subscription.get('cancel_at_period_end', False)
        if cancel_at_period_end:
            subscription.status = 'active'  # Keep active until period ends
            subscription.will_cancel_at_period_end = True
        
        db.session.commit()
        current_app.logger.info(f'Successfully processed cancellation for subscription {subscription.id}')
        
    except Exception as e:
        current_app.logger.error(f'Error handling subscription cancellation: {e}')
        db.session.rollback()
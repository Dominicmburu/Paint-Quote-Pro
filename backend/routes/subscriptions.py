import os
import stripe
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta

from models import db
from models.user import User
from models.company import Company
from models.subscription import Subscription, SubscriptionPurchase, PaymentHistory, SUBSCRIPTION_PLANS
from utils.decorators import require_active_subscription
from services.email_service import (
    send_payment_success_email, 
    send_payment_failed_email, 
    send_subscription_cancelled_email
)

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
            subscription = create_trial_subscription(user.company_id)
        
        # Recalculate limits from active purchases
        subscription.recalculate_limits()
        db.session.commit()
        
        return jsonify({
            'subscription': subscription.to_dict(),
            'company': user.company.to_dict(),
            'active_purchases': [p.to_dict() for p in subscription.subscription_purchases 
                               if p.is_active and not p.is_expired],
            'trial_days_remaining': subscription.trial_days_remaining
        })
        
    except Exception as e:
        current_app.logger.error(f'Get subscription error: {e}')
        return jsonify({'error': 'Failed to get subscription'}), 500


def create_trial_subscription(company_id):
    """Create a new trial subscription with correct initial values"""
    trial_start = datetime.utcnow()
    trial_end = trial_start + timedelta(days=7)
    
    subscription = Subscription(
        company_id=company_id,
        plan_name='trial',
        billing_cycle='monthly',
        status='trial',
        trial_start=trial_start,
        trial_end=trial_end,
        total_projects_allowed=3,  # Trial benefits
        total_users_allowed=1,
        total_storage_mb_allowed=500,
        total_api_rate_limit=50,
        projects_used_this_period=0,
        storage_used_mb=0,
        trial_projects_used=0,
        current_period_start=trial_start,
        current_period_end=trial_end
    )
    
    db.session.add(subscription)
    db.session.commit()
    return subscription


@subscriptions_bp.route('/plans', methods=['GET'])
def get_subscription_plans():
    """Get available subscription plans"""
    plans = SUBSCRIPTION_PLANS.copy()
    
    # Remove trial plan from purchase options
    if 'trial' in plans:
        del plans['trial']
    
    return jsonify({'plans': plans})


@subscriptions_bp.route('/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    """Create Stripe checkout session for subscription purchase"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404
        
        data = request.get_json()
        plan_name = data.get('plan_name')
        billing_cycle = data.get('billing_cycle', 'monthly')
        
        # Validation
        if plan_name == 'trial':
            return jsonify({'error': 'Trial plan cannot be purchased'}), 400
        
        if plan_name not in SUBSCRIPTION_PLANS:
            return jsonify({'error': 'Invalid plan'}), 400
        
        if billing_cycle not in ['monthly', 'yearly']:
            return jsonify({'error': 'Invalid billing cycle. Must be monthly or yearly'}), 400
        
        plan = SUBSCRIPTION_PLANS[plan_name]
        price_id = plan.get(f'stripe_price_id_{billing_cycle}')
        
        if not price_id:
            return jsonify({'error': 'Price ID not configured for this plan and billing cycle'}), 400
        
        # Get or create subscription
        subscription = user.company.subscription
        if not subscription:
            subscription = create_trial_subscription(user.company_id)
        
        # Create or get Stripe customer
        if subscription.stripe_customer_id:
            customer_id = subscription.stripe_customer_id
        else:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.company.name,
                metadata={'company_id': str(user.company_id)}
            )
            customer_id = customer.id
            subscription.stripe_customer_id = customer_id
            db.session.commit()
        
        # Get frontend URL
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f'{frontend_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{frontend_url}/subscription/cancelled',
            metadata={
                'company_id': str(user.company_id),
                'plan_name': plan_name,
                'billing_cycle': billing_cycle,
                'user_id': str(user.id)
            }
        )
        
        return jsonify({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id,
            'plan_details': {
                'name': plan['name'],
                'price': plan[f'price_{billing_cycle}'],
                'billing_cycle': billing_cycle,
                'projects': plan['max_projects'],
                'users': plan['max_users']
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Create checkout session error: {e}')
        return jsonify({'error': 'Failed to create checkout session'}), 500


@subscriptions_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks with enhanced debugging"""
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = current_app.config.get('STRIPE_WEBHOOK_SECRET')
    
    # Enhanced logging
    current_app.logger.info(f'=== WEBHOOK RECEIVED ===')
    current_app.logger.info(f'Signature present: {bool(sig_header)}')
    current_app.logger.info(f'Webhook secret configured: {bool(webhook_secret)}')
    current_app.logger.info(f'Payload size: {len(payload)} bytes')
    
    if not webhook_secret:
        current_app.logger.error('STRIPE_WEBHOOK_SECRET not configured')
        return jsonify({'error': 'Webhook secret not configured'}), 500
    
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        current_app.logger.info(f'✅ Webhook event constructed: {event["type"]}')
    except ValueError as e:
        current_app.logger.error(f'❌ Invalid payload: {e}')
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        current_app.logger.error(f'❌ Invalid signature: {e}')
        return jsonify({'error': 'Invalid signature'}), 400
    
    try:
        event_type = event['type']
        current_app.logger.info(f'🔄 Processing webhook event: {event_type}')
        
        if event_type == 'checkout.session.completed':
            session = event['data']['object']
            if session.get('payment_status') == 'paid' and session.get('mode') == 'subscription':
                handle_successful_payment(session)
        
        elif event_type == 'invoice.payment_succeeded':
            invoice = event['data']['object']
            handle_successful_renewal(invoice)
        
        elif event_type == 'invoice.payment_failed':
            invoice = event['data']['object']
            handle_failed_payment(invoice)
        
        elif event_type == 'customer.subscription.deleted':
            subscription_obj = event['data']['object']
            handle_subscription_cancelled(subscription_obj)
        
        current_app.logger.info(f'✅ Webhook event {event_type} processed successfully')
        return jsonify({'status': 'success', 'event_type': event_type})
        
    except Exception as e:
        current_app.logger.error(f'❌ Webhook processing error: {str(e)}', exc_info=True)
        return jsonify({'error': 'Webhook processing failed'}), 500


def handle_successful_payment(session):
    """FIXED: Handle successful payment with proper cumulative logic"""
    try:
        current_app.logger.info(f'🎯 Processing successful payment for session: {session["id"]}')
        
        # Extract metadata
        metadata = session.get('metadata', {})
        company_id = int(metadata.get('company_id'))
        plan_name = metadata.get('plan_name')
        billing_cycle = metadata.get('billing_cycle', 'monthly')
        
        current_app.logger.info(f'📋 Payment details: Company {company_id}, Plan {plan_name}, Billing {billing_cycle}')
        
        # Validate data
        if not company_id or not plan_name:
            raise Exception(f'Missing metadata: company_id={company_id}, plan_name={plan_name}')
        
        # Get company and subscription
        company = Company.query.get(company_id)
        if not company:
            raise Exception(f'Company not found: {company_id}')
        
        subscription = company.subscription
        if not subscription:
            subscription = create_trial_subscription(company_id)
        
        # Get plan details
        plan = SUBSCRIPTION_PLANS.get(plan_name)
        if not plan:
            raise Exception(f'Plan not found: {plan_name}')
        
        # FIXED: Calculate subscription period dates - ADD to existing, don't replace
        start_date = datetime.utcnow()
        
        # Calculate end date based on billing cycle
        if billing_cycle == 'yearly':
            end_date = start_date + timedelta(days=365)
        else:
            # Calculate exact month increment
            if start_date.month == 12:
                end_date = start_date.replace(year=start_date.year + 1, month=1)
            else:
                try:
                    end_date = start_date.replace(month=start_date.month + 1)
                except ValueError:
                    # Handle case where next month has fewer days
                    end_date = start_date.replace(month=start_date.month + 1, day=28)
        
        current_app.logger.info(f'📅 New subscription period: {start_date} to {end_date}')
        
        # Get payment details from Stripe
        amount_paid = (session.get('amount_total', 0) / 100)  # Convert cents to dollars
        
        # Create subscription purchase record
        purchase = SubscriptionPurchase(
            subscription_id=subscription.id,
            plan_name=plan_name,
            billing_cycle=billing_cycle,
            stripe_payment_intent_id=session.get('payment_intent'),
            stripe_subscription_id=session.get('subscription'),
            amount_paid=amount_paid,
            currency=session.get('currency', 'usd').upper(),
            start_date=start_date,
            end_date=end_date,
            is_active=True,
            purchase_type='new'
        )
        db.session.add(purchase)
        
        # Create payment history record
        payment_record = PaymentHistory(
            company_id=company_id,
            subscription_purchase_id=purchase.id,
            stripe_payment_intent_id=session.get('payment_intent'),
            amount=amount_paid,
            currency=session.get('currency', 'usd').upper(),
            status='succeeded',
            description=f'{plan["name"]} - {billing_cycle.title()} Subscription',
            plan_name=plan_name,
            billing_cycle=billing_cycle,
            transaction_date=datetime.utcnow()
        )
        db.session.add(payment_record)
        
        # Update main subscription record
        subscription.stripe_customer_id = session.get('customer')
        subscription.stripe_subscription_id = session.get('subscription')
        subscription.status = 'active'
        
        # FIXED: Don't override period dates - these should reflect the longest active period
        # Update only if this extends the current period
        if not subscription.current_period_end or end_date > subscription.current_period_end:
            subscription.current_period_start = start_date
            subscription.current_period_end = end_date
        
        # CRITICAL: Recalculate total limits from trial + all active purchases
        subscription.recalculate_limits()
        
        # FIXED: Reset usage counters for new billing period if this is a new subscription
        now = datetime.utcnow()
        
        # For brand new subscriptions, reset to 0
        if not subscription.subscription_purchases:
            subscription.projects_used_this_period = 0
            subscription.storage_used_mb = 0
        
        # For renewals, check if this is a new billing period
        elif subscription.current_period_end and now >= subscription.current_period_end:
            subscription.reset_usage_for_new_period()
        
        # CRITICAL: Recalculate total limits from trial + all active purchases
        subscription.recalculate_limits()
        
        db.session.commit()
        
        current_app.logger.info(f'✅ Successfully created subscription purchase and payment record')
        current_app.logger.info(f'📊 New limits: Projects={subscription.total_projects_allowed}, Users={subscription.total_users_allowed}')
        
        # Send success email
        try:
            primary_user = User.query.filter_by(company_id=company_id).first()
            if primary_user:
                send_payment_success_email(
                    email=primary_user.email,
                    first_name=primary_user.first_name,
                    company_name=company.name,
                    plan_name=plan_name,
                    billing_cycle=billing_cycle,
                    amount=amount_paid,
                    was_trial=(subscription.trial_days_remaining > 0)
                )
        except Exception as email_error:
            current_app.logger.error(f'Failed to send payment success email: {email_error}')
        
        current_app.logger.info(f'🎉 Successfully processed payment for company {company_id}, plan {plan_name}')
        
    except Exception as e:
        current_app.logger.error(f'❌ Error handling successful payment: {str(e)}', exc_info=True)
        db.session.rollback()
        raise


def handle_successful_renewal(invoice):
    """FIXED: Handle successful subscription renewal"""
    try:
        current_app.logger.info(f'🔄 Processing renewal for invoice: {invoice["id"]}')
        
        customer_id = invoice.get('customer')
        subscription_id = invoice.get('subscription')
        
        if not customer_id:
            current_app.logger.error(f'Missing customer ID in invoice: {invoice.get("id")}')
            return
        
        # Find subscription by Stripe customer ID
        subscription = Subscription.query.filter_by(stripe_customer_id=customer_id).first()
        if not subscription:
            current_app.logger.error(f'Subscription not found for customer: {customer_id}')
            return
        
        # Find the corresponding subscription purchase
        stripe_sub_id = invoice.get('subscription')
        purchase = SubscriptionPurchase.query.filter_by(
            subscription_id=subscription.id,
            stripe_subscription_id=stripe_sub_id,
            is_active=True
        ).first()
        
        if purchase:
            # FIXED: Extend the existing purchase period
            if purchase.billing_cycle == 'yearly':
                purchase.end_date = purchase.end_date + timedelta(days=365)
            else:
                # Add one month to existing end date
                new_end = purchase.end_date
                if new_end.month == 12:
                    new_end = new_end.replace(year=new_end.year + 1, month=1)
                else:
                    try:
                        new_end = new_end.replace(month=new_end.month + 1)
                    except ValueError:
                        new_end = new_end.replace(month=new_end.month + 1, day=28)
                purchase.end_date = new_end
            
            # Create payment history record
            amount = (invoice.get('amount_paid', 0) / 100)
            payment_record = PaymentHistory(
                company_id=subscription.company_id,
                subscription_purchase_id=purchase.id,
                stripe_invoice_id=invoice.get('id'),
                amount=amount,
                currency=invoice.get('currency', 'usd').upper(),
                status='succeeded',
                description=f'{purchase.plan_name} - {purchase.billing_cycle} Renewal',
                plan_name=purchase.plan_name,
                billing_cycle=purchase.billing_cycle,
                transaction_date=datetime.utcnow()
            )
            db.session.add(payment_record)
        
        # Update main subscription
        subscription.status = 'active'
        subscription.failed_payment_count = 0  # Reset failure count
        
        # Update subscription period to reflect the latest end date
        active_purchases = [p for p in subscription.subscription_purchases 
                          if p.is_active and p.end_date > datetime.utcnow()]
        if active_purchases:
            latest_end = max(p.end_date for p in active_purchases)
            subscription.current_period_end = latest_end
        
        # Reset usage for new billing period
        subscription.reset_usage_for_new_period()
        
        # Recalculate limits
        subscription.recalculate_limits()
        
        db.session.commit()
        current_app.logger.info(f'✅ Successfully processed renewal for subscription {subscription.id}')
        
    except Exception as e:
        current_app.logger.error(f'❌ Error handling successful renewal: {e}', exc_info=True)
        db.session.rollback()


def handle_failed_payment(invoice):
    """Handle failed payment"""
    try:
        current_app.logger.info(f'💸 Processing failed payment for invoice: {invoice["id"]}')
        
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
        
        # Create payment history record for failed payment
        amount = (invoice.get('amount_due', 0) / 100)
        payment_record = PaymentHistory(
            company_id=subscription.company_id,
            stripe_invoice_id=invoice.get('id'),
            amount=amount,
            currency=invoice.get('currency', 'usd').upper(),
            status='failed',
            description=f'Failed payment attempt #{attempt_count}',
            failure_code=invoice.get('last_finalization_error', {}).get('code'),
            failure_message=invoice.get('last_finalization_error', {}).get('message'),
            transaction_date=datetime.utcnow()
        )
        db.session.add(payment_record)
        
        # If final attempt failed, cancel subscription
        if attempt_count >= 4:
            subscription.status = 'cancelled'
            subscription.cancelled_at = datetime.utcnow()
            
            # Deactivate all purchases
            for purchase in subscription.subscription_purchases:
                if purchase.is_active:
                    purchase.is_active = False
                    purchase.is_cancelled = True
                    purchase.cancelled_at = datetime.utcnow()
            
            # Recalculate limits after cancellation
            subscription.recalculate_limits()
        
        db.session.commit()
        
        # Send failure email
        try:
            company = Company.query.get(subscription.company_id)
            primary_user = User.query.filter_by(company_id=subscription.company_id).first()
            if primary_user and company:
                send_payment_failed_email(
                    email=primary_user.email,
                    first_name=primary_user.first_name,
                    company_name=company.name,
                    plan_name=subscription.plan_name,
                    attempt_count=attempt_count,
                    is_final_attempt=(attempt_count >= 4)
                )
        except Exception as email_error:
            current_app.logger.error(f'Failed to send payment failed email: {email_error}')
        
        current_app.logger.warning(f'⚠️ Payment failed for subscription {subscription.id}, attempt {attempt_count}')
        
    except Exception as e:
        current_app.logger.error(f'❌ Error handling failed payment: {e}', exc_info=True)
        db.session.rollback()


def handle_subscription_cancelled(stripe_subscription):
    """Handle subscription cancellation"""
    try:
        current_app.logger.info(f'🗑️ Processing cancellation for subscription: {stripe_subscription["id"]}')
        
        subscription_id = stripe_subscription.get('id')
        if not subscription_id:
            current_app.logger.error('Missing subscription ID in cancellation event')
            return
        
        # Find subscription purchase by Stripe subscription ID
        purchase = SubscriptionPurchase.query.filter_by(
            stripe_subscription_id=subscription_id,
            is_active=True
        ).first()
        
        if not purchase:
            current_app.logger.error(f'Active purchase not found for Stripe subscription: {subscription_id}')
            return
        
        subscription = purchase.subscription
        
        # Mark purchase as cancelled
        purchase.is_active = False
        purchase.is_cancelled = True
        purchase.cancelled_at = datetime.utcnow()
        
        # Check if subscription should be cancelled completely
        active_purchases = [p for p in subscription.subscription_purchases 
                          if p.is_active and not p.is_expired]
        
        if not active_purchases:
            subscription.status = 'cancelled'
            subscription.cancelled_at = datetime.utcnow()
        
        # Recalculate limits after cancellation
        subscription.recalculate_limits()
        
        db.session.commit()
        current_app.logger.info(f'✅ Successfully processed cancellation')
        
    except Exception as e:
        current_app.logger.error(f'❌ Error handling subscription cancellation: {e}', exc_info=True)
        db.session.rollback()


# Additional endpoints for enhanced functionality

@subscriptions_bp.route('/payment-history', methods=['GET'])
@jwt_required()
def get_payment_history():
    """Get payment history for the current user's company"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404
        
        # Get payment history
        payments = PaymentHistory.query.filter_by(
            company_id=user.company_id
        ).order_by(PaymentHistory.transaction_date.desc()).limit(50).all()
        
        return jsonify({
            'payment_history': [payment.to_dict() for payment in payments],
            'total_records': len(payments)
        })
        
    except Exception as e:
        current_app.logger.error(f'Get payment history error: {e}')
        return jsonify({'error': 'Failed to get payment history'}), 500


@subscriptions_bp.route('/active-purchases', methods=['GET'])
@jwt_required()
def get_active_purchases():
    """Get all active subscription purchases"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404
        
        subscription = user.company.subscription
        if not subscription:
            return jsonify({'active_purchases': [], 'total_limits': {}})
        
        # Get active purchases
        now = datetime.utcnow()
        active_purchases = [p for p in subscription.subscription_purchases 
                          if p.is_active and p.end_date > now]
        
        return jsonify({
            'active_purchases': [purchase.to_dict() for purchase in active_purchases],
            'total_limits': {
                'projects': subscription.total_projects_allowed,
                'users': subscription.total_users_allowed,
                'storage_mb': subscription.total_storage_mb_allowed,
                'api_rate_limit': subscription.total_api_rate_limit
            },
            'current_usage': {
                'projects_used': subscription.projects_used_this_period,
                'storage_used_mb': subscription.storage_used_mb
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Get active purchases error: {e}')
        return jsonify({'error': 'Failed to get active purchases'}), 500


@subscriptions_bp.route('/usage', methods=['GET'])
@jwt_required()
def get_usage_stats():
    """Get current usage statistics"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404
        
        subscription = user.company.subscription
        if not subscription:
            return jsonify({'error': 'No subscription found'}), 404
        
        # Calculate usage percentages
        projects_percentage = 0
        if subscription.total_projects_allowed > 0:
            projects_percentage = (subscription.projects_used_this_period / subscription.total_projects_allowed) * 100
        elif subscription.total_projects_allowed == -1:
            projects_percentage = 0  # Unlimited
        
        storage_percentage = 0
        if subscription.total_storage_mb_allowed > 0:
            storage_percentage = (subscription.storage_used_mb / subscription.total_storage_mb_allowed) * 100
        elif subscription.total_storage_mb_allowed == -1:
            storage_percentage = 0  # Unlimited
        
        return jsonify({
            'current_limits': {
                'projects': subscription.total_projects_allowed,
                'users': subscription.total_users_allowed,
                'storage_mb': subscription.total_storage_mb_allowed,
                'api_rate_limit': subscription.total_api_rate_limit
            },
            'current_usage': {
                'projects_used': subscription.projects_used_this_period,
                'projects_percentage': min(projects_percentage, 100),
                'storage_used_mb': subscription.storage_used_mb,
                'storage_percentage': min(storage_percentage, 100)
            },
            'can_create_project': subscription.can_create_project(),
            'days_remaining': subscription.days_remaining,
            'trial_days_remaining': subscription.trial_days_remaining,
            'active_plans': subscription.get_active_plans()
        })
        
    except Exception as e:
        current_app.logger.error(f'Get usage stats error: {e}')
        return jsonify({'error': 'Failed to get usage statistics'}), 500


@subscriptions_bp.route('/session/<session_id>', methods=['GET'])
def get_session_details(session_id):
    """Get Stripe session details for payment success page"""
    try:
        current_app.logger.info(f'Fetching session details for: {session_id}')
        
        # Retrieve the session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        if session.payment_status != 'paid':
            return jsonify({'error': 'Payment not completed'}), 400
        
        # Extract session data
        metadata = session.get('metadata', {})
        plan_name = metadata.get('plan_name', 'Unknown')
        billing_cycle = metadata.get('billing_cycle', 'monthly')
        
        plan = SUBSCRIPTION_PLANS.get(plan_name, {})
        
        # Calculate next billing date
        created_timestamp = session.get('created', 0)
        created_date = datetime.utcfromtimestamp(created_timestamp) if created_timestamp else datetime.utcnow()
        
        if billing_cycle == 'yearly':
            next_billing_date = created_date + timedelta(days=365)
        else:
            # Add one month
            if created_date.month == 12:
                next_billing_date = created_date.replace(year=created_date.year + 1, month=1)
            else:
                try:
                    next_billing_date = created_date.replace(month=created_date.month + 1)
                except ValueError:
                    next_billing_date = created_date.replace(month=created_date.month + 1, day=28)
        
        # Format amount (convert from cents to dollars/pounds)
        amount = (session.get('amount_total', 0) / 100)
        currency = session.get('currency', 'usd').upper()
        
        # Get customer details
        customer_email = session.get('customer_details', {}).get('email', 'N/A')
        
        response_data = {
            'session_id': session_id,
            'payment_status': session.payment_status,
            'plan_name': plan_name.title(),
            'billing_cycle': billing_cycle,
            'amount': amount,
            'currency': currency,
            'customer_email': customer_email,
            'next_billing_date': next_billing_date.isoformat(),
            'created_at': created_date.isoformat(),
            'plan_details': {
                'name': plan.get('name', plan_name.title()),
                'features': plan.get('features', []),
                'max_projects': plan.get('max_projects', 'N/A'),
                'max_users': plan.get('max_users', 'N/A'),
                'max_storage_mb': plan.get('max_storage_mb', 'N/A'),
                'api_rate_limit': plan.get('api_rate_limit', 'N/A')
            }
        }
        
        current_app.logger.info(f'Successfully retrieved session details for: {session_id}')
        return jsonify(response_data)
        
    except stripe.error.InvalidRequestError as e:
        current_app.logger.error(f'Invalid Stripe session ID {session_id}: {e}')
        return jsonify({'error': 'Invalid session ID'}), 400
    except stripe.error.StripeError as e:
        current_app.logger.error(f'Stripe error for session {session_id}: {e}')
        return jsonify({'error': 'Payment processor error'}), 500
    except Exception as e:
        current_app.logger.error(f'Error fetching session details for {session_id}: {e}')
        return jsonify({'error': 'Failed to retrieve session details'}), 500
   

@subscriptions_bp.route('/cancel/<int:purchase_id>', methods=['POST'])
@jwt_required()
def cancel_specific_purchase(purchase_id):
    """Cancel a specific subscription purchase"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404
        
        # Find the purchase
        purchase = SubscriptionPurchase.query.filter_by(
            id=purchase_id,
            subscription_id=user.company.subscription.id if user.company.subscription else None
        ).first()
        
        if not purchase:
            return jsonify({'error': 'Purchase not found'}), 404
        
        if not purchase.is_active:
            return jsonify({'error': 'Purchase is already cancelled'}), 400
        
        # Cancel in Stripe if it has a subscription ID
        if purchase.stripe_subscription_id:
            try:
                stripe.Subscription.modify(
                    purchase.stripe_subscription_id,
                    cancel_at_period_end=True
                )
            except stripe.error.StripeError as e:
                current_app.logger.error(f'Stripe cancellation error: {e}')
                return jsonify({'error': 'Failed to cancel with payment processor'}), 500
        
        # Mark as cancelled locally (will be handled by webhook for immediate effect)
        purchase.will_cancel_at_period_end = True
        purchase.cancellation_requested_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'{purchase.plan_name} subscription will be cancelled at the end of the billing period',
            'purchase': purchase.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f'Cancel purchase error: {e}')
        return jsonify({'error': 'Failed to cancel subscription'}), 500